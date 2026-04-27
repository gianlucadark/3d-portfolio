import { Injectable, NgZone, ElementRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import gsap from 'gsap';
import { BehaviorSubject, Subject } from 'rxjs';
import { THREE_CONFIG, MATERIAL_CONFIG, COLORS } from '../constants/app.constants';

// Throttle render: ms per frame target
const FPS_ACTIVE = 1000 / 60;  // 60fps durante interazione
const FPS_IDLE = 1000 / 30;  // 30fps a riposo
const INTERACTION_COOLDOWN_MS = 2000; // torna a idle dopo 2s senza input

@Injectable({
    providedIn: 'root'
})
export class ThreeSceneService implements OnDestroy {
    // Three.js core objects
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private model: THREE.Group | null = null;
    private animationId: number | null = null;

    // Raycasting
    private readonly raycaster = new THREE.Raycaster();
    private readonly mouse = new THREE.Vector2();

    // Clickable objects cache
    private quadroMesh: THREE.Mesh | null = null;
    private corniceMesh: THREE.Mesh | null = null;
    private schermoGrandeMesh: THREE.Mesh | null = null;
    private schermoPiccoloMesh: THREE.Mesh | null = null;
    private catMesh: THREE.Mesh | null = null;
    private quadroOriginalScale = new THREE.Vector3();
    private corniceOriginalScale = new THREE.Vector3();

    // Lighting
    private ambientLight!: THREE.AmbientLight;
    private directionalLight!: THREE.DirectionalLight;
    private rectLight!: THREE.RectAreaLight;
    private envMap: THREE.Texture | null = null;

    // State
    private isZooming = false;
    private readonly cameraOriginalPosition = new THREE.Vector3();
    private readonly controlsOriginalTarget = new THREE.Vector3();
    private readonly textureCache = new Map<string, THREE.Texture>();
    private isHovering = false;
    private catGlowTween: gsap.core.Tween | null = null;
    private pacmanGlowTween: gsap.core.Tween | null = null;
    private catMeshes: THREE.Mesh[] = [];
    private placeholder: THREE.Mesh | null = null;
    private isFullQualityEnabled = false;

    // Render throttling
    private lastFrameTime = 0;
    private lastInteractionTime = 0;
    private frameCount = 0; // per throttle raycaster nel mousemove

    // Shared Loading Manager
    private readonly loadingManager: THREE.LoadingManager;

    // Shared loaders
    private readonly dracoLoader: DRACOLoader;
    private readonly gltfLoader: GLTFLoader;
    private readonly textureLoader: THREE.TextureLoader;
    private readonly rgbeLoader: RGBELoader;

    // Observables
    public readonly loadingProgress$ = new BehaviorSubject<number>(0);
    public readonly loadingComplete$ = new BehaviorSubject<boolean>(false);
    public readonly screenClick$ = new Subject<'desktop' | 'game'>();
    public readonly pdfClick$ = new Subject<void>();
    public readonly catClick$ = new Subject<void>();

    private isEnvLoaded = false;
    private isModelLoaded = false;

    private readonly webGLAvailable: boolean;

    constructor(private readonly ngZone: NgZone) {
        this.webGLAvailable = this.detectWebGL();

        // Initialize Loading Manager
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();

        // Initialize loaders
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('assets/draco/');
        this.dracoLoader.preload();

        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.rgbeLoader = new RGBELoader(this.loadingManager);
        this.rgbeLoader.setDataType(THREE.HalfFloatType);

        if (!this.webGLAvailable) {
            // Headless/no-GPU environment (e.g. Lighthouse): skip 3D and unblock UI immediately
            setTimeout(() => this.ngZone.run(() => this.loadingComplete$.next(true)), 0);
            return;
        }

        // Pre-load critical textures immediately
        this.preloadTextures();
    }

    private detectWebGL(): boolean {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
            return false;
        }
    }

    private setupLoadingManager(): void {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            this.updateLoadingState(progress, 'model');
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading asset:', url);
        };
    }

    private preloadTextures(): void {
        const textures = [
            'assets/opt_sfondo.webp',
            'assets/opt_pacman.webp',
            'assets/opt_cvfoto1.webp'
        ];
        textures.forEach(path => this.loadTexture(path, { flipY: true }));
    }

    public initialize(container: ElementRef): void {
        if (!this.webGLAvailable) return;

        this.ngZone.runOutsideAngular(() => {
            this.initScene(container);
            this.createPlaceholder();
            this.loadModel();
            this.startAnimation();
            this.setupEventListeners(container.nativeElement);
        });
    }

    private initScene(container: ElementRef): void {
        this.scene = new THREE.Scene();
        this.setupCamera(container.nativeElement);
        this.setupRenderer(container.nativeElement);
        this.setupControls();
        this.setupLights();
        this.loadEnvironment();
    }

    private setupCamera(container: HTMLElement): void {
        const { clientWidth: width, clientHeight: height } = container;
        const { CAMERA } = THREE_CONFIG;

        this.camera = new THREE.PerspectiveCamera(CAMERA.FOV, width / height, CAMERA.NEAR, CAMERA.FAR);
        this.camera.position.z = CAMERA.INITIAL_Z;
        this.camera.position.x += CAMERA.INITIAL_X_OFFSET;
    }

    private setupRenderer(container: HTMLElement): void {
        const { clientWidth: width, clientHeight: height } = container;
        const dpr = window.devicePixelRatio || 1;
        
        // Optimistic antialias: only on desktop/high-end
        const needsAntialias = dpr < 2;

        this.renderer = new THREE.WebGLRenderer({
            antialias: needsAntialias,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
            alpha: false // Faster rendering for opaque scenes
        });

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(0.75); // Low DPR initially for speed
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.4;
        
        // Disable sorting if not needed (saves CPU)
        this.renderer.sortObjects = true; 

        container.appendChild(this.renderer.domElement);
    }

    private setupControls(): void {
        const { CONTROLS } = THREE_CONFIG;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = CONTROLS.DAMPING_FACTOR;
        this.controls.minDistance = CONTROLS.MIN_DISTANCE;
        this.controls.maxDistance = CONTROLS.MAX_DISTANCE;
        this.controls.enablePan = false;
        this.controls.screenSpacePanning = false;
    }

    private setupLights(): void {
        const { LIGHTS } = THREE_CONFIG;

        this.ambientLight = new THREE.AmbientLight(COLORS.WHITE, LIGHTS.AMBIENT.INTENSITY_LIGHT);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(COLORS.WHITE, LIGHTS.DIRECTIONAL.INTENSITY_LIGHT);
        this.configureDirectionalLight();
        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target);

        RectAreaLightUniformsLib.init();
        this.rectLight = new THREE.RectAreaLight(0xDDEEFF, LIGHTS.RECT.INTENSITY_LIGHT, 8, 8);
        this.rectLight.position.set(5, 5, 5);
        this.rectLight.lookAt(0, 0, 0);
        this.scene.add(this.rectLight);
    }

    private configureDirectionalLight(): void {
        const d = 10;
        this.directionalLight.position.set(-5, 10, 7);
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.castShadow = true;
        // Boost light intensity slightly while waiting for env map
        this.directionalLight.intensity = THREE_CONFIG.LIGHTS.DIRECTIONAL.INTENSITY_LIGHT * 1.5;

        const shadow = this.directionalLight.shadow;
        if (shadow?.camera) {
            const cam = shadow.camera as THREE.OrthographicCamera;
            cam.left = -d;
            cam.right = d;
            cam.top = d;
            cam.bottom = -d;
            cam.near = 0.5;
            cam.far = 50;
        }

        if (shadow) {
            shadow.mapSize.width = THREE_CONFIG.SHADOW_MAP_SIZE;
            shadow.mapSize.height = THREE_CONFIG.SHADOW_MAP_SIZE;
            shadow.bias = -0.0006;
            shadow.radius = 1;
        }
    }

    private loadEnvironment(): void {
        this.scene.background = new THREE.Color(COLORS.ICE_BLUE).multiplyScalar(0.2);

        this.rgbeLoader.load(
            'assets/cielo1.hdr',
            (texture) => {
                const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
                pmremGenerator.compileEquirectangularShader();

                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                this.envMap = envMap;
                
                // Only set environment if not already loaded (prevents race conditions)
                if (!this.scene.environment) {
                    this.scene.environment = envMap;
                    this.scene.background = envMap;
                }

                (this.scene as any).backgroundIntensity = THREE_CONFIG.LIGHTS.ENVIRONMENT_INTENSITY;
                (this.scene as any).environmentIntensity = THREE_CONFIG.LIGHTS.ENVIRONMENT_INTENSITY;

                texture.dispose();
                pmremGenerator.dispose();
                this.isEnvLoaded = true;
            }
        );
    }

    private createPlaceholder(): void {
        // Create a simple wireframe box as placeholder
        const geometry = new THREE.BoxGeometry(10, 6, 10);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });

        this.placeholder = new THREE.Mesh(geometry, material);
        this.placeholder.position.y = 0;
        this.scene.add(this.placeholder);

        // Animate placeholder with subtle pulse
        gsap.to(this.placeholder.scale, {
            x: 1.05,
            y: 1.05,
            z: 1.05,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
    }

    private enableProgressiveFeatures(): void {
        if (this.isFullQualityEnabled) return;
        this.isFullQualityEnabled = true;

        // Upgrade pixel ratio smoothly from 0.75 to full device DPR
        const targetDpr = Math.min(window.devicePixelRatio, THREE_CONFIG.MAX_PIXEL_RATIO);
        const proxy = { val: 0.75 };
        gsap.to(proxy, {
            val: targetDpr,
            duration: 1.5,
            ease: 'power1.inOut',
            onUpdate: () => this.renderer.setPixelRatio(proxy.val),
            onComplete: () => this.renderer.setPixelRatio(targetDpr)
        });

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Re-compile scene with shadows enabled
        this.renderer.compile(this.scene, this.camera);

        console.log('Progressive features enabled: high-quality rendering active');
    }


    private loadModel(): void {
        this.gltfLoader.load(
            'assets/3d/room-space-3-final.glb',
            (gltf) => {
                this.onModelLoaded(gltf);
            },
            undefined, // Use LoadingManager for progress
            (error) => {
                console.error('Error loading model:', error);
                this.isModelLoaded = true;
                this.checkLoadingComplete();
            }
        );
    }

    private onModelLoaded(gltf: any): void {
        this.model = gltf.scene;
        if (!this.model) return;

        // Consolidate all model processing into a single traversal
        this.processModel();
        
        // Calculate framing after processing (requires updated world matrices/bounds)
        this.frameModel();

        // Remove placeholder with fade out
        if (this.placeholder) {
            gsap.to(this.placeholder.material, {
                opacity: 0, duration: 0.5,
                onComplete: () => {
                    this.scene.remove(this.placeholder!);
                    this.placeholder?.geometry.dispose();
                    (this.placeholder?.material as THREE.Material).dispose();
                    this.placeholder = null;
                }
            });
        }

        this.scene.add(this.model);

        // Pre-compile scene to avoid stutter
        this.renderer.compile(this.scene, this.camera);

        // Enable progressive features after a short delay
        setTimeout(() => this.enableProgressiveFeatures(), 1000);

        this.isModelLoaded = true;
        this.updateLoadingState(100, 'model');
        this.checkLoadingComplete();
    }

    private processModel(): void {
        if (!this.model) return;

        // One-pass traversal for optimization
        this.model.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;

            // 1. Shadows
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // 2. Performance: disable matrix updates for static objects
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();

            // 3. Materials processing
            if (material) {
                material.transparent = true;
                material.opacity = 0;
                gsap.to(material, { opacity: 1, duration: 0.8, ease: 'power2.out' });

                const name = material.name?.toLowerCase() || '';
                const meshNameLower = mesh.name?.toLowerCase() || '';
                this.applyMaterialByName(mesh, material, name);

                if (meshNameLower.includes('schermogrande') && !name.includes('schermogrande')) {
                    this.applyScreenMaterial(mesh, material, 'assets/opt_sfondo.webp', 'schermoGrande');
                } else if (meshNameLower.includes('schermopiccolo') && !name.includes('schermopiccolo')) {
                    this.applyScreenMaterial(mesh, material, 'assets/opt_pacman.webp', 'schermoPiccolo');
                }
            }
        });

        // Center model once
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.position.y += THREE_CONFIG.MODEL.POSITION_Y_OFFSET;
        this.model.position.x += THREE_CONFIG.MODEL.POSITION_X_OFFSET;
        this.model.updateMatrixWorld(true);
    }

    private frameModel(): void {
        if (!this.model || !this.camera || !this.controls) return;

        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        distance *= 1.4;

        const cameraPos = new THREE.Vector3(center.x, center.y + maxDim * 0.15, center.z + distance);

        this.camera.position.copy(cameraPos);
        this.controls.target.copy(center);
        this.controls.update();

        this.cameraOriginalPosition.copy(this.camera.position);
        this.controlsOriginalTarget.copy(this.controls.target);
    }

    private applyMaterialByName(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial, name: string): void {
        if (name.includes('muro1')) {
            this.applyGlassMaterial(mesh, material);
        } else if (name.includes('pavimento')) {
            this.applyMarbleMaterial(mesh, material);
        } else if (name.includes('soffitto')) {
            this.applyCeilingMaterial(material);
        } else if (name.includes('led')) {
            this.applyLedMaterial(mesh, material);
        } else if (name.includes('schermogrande')) {
            this.applyScreenMaterial(mesh, material, 'assets/opt_sfondo.webp', 'schermoGrande');
        } else if (name.includes('schermopiccolo')) {
            this.applyScreenMaterial(mesh, material, 'assets/opt_pacman.webp', 'schermoPiccolo');
        } else if (name.includes('quadro')) {
            this.applyQuadroMaterial(mesh, material);
        } else if (name.includes('cornice')) {
            this.cacheCornice(mesh, material);
        } else if (name.includes('giallo')) {
            this.applyYellowMaterial(material);
        } else if (name.includes('stanza')) {
            this.applyWallMaterial(mesh, material);
        } else if (name.includes('gatto') || name.includes('cat') || name.includes('siberi')) {
            this.applyCatMaterial(mesh);
        }
    }

    private applyCatMaterial(mesh: THREE.Mesh): void {
        this.catMesh = mesh;
        this.catMeshes.push(mesh);
        mesh.userData['isClickable'] = true;
        // Avvia il glow dopo che tutti i mesh sono stati raccolti
        if (this.catGlowTween) return;
        setTimeout(() => this.startCatGlow(), 0);
    }

    // Material application helpers
    private applyGlassMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { GLASS } = MATERIAL_CONFIG;
        // Preserve original material: update non-physical properties in-place
        material.map = material.map || material.map;
        material.normalMap = material.normalMap || material.normalMap;
        material.color = (material.color || new THREE.Color(0xffffff)).clone();
        material.transparent = true;
        material.opacity = 1;
        material.roughness = GLASS.ROUGHNESS;
        material.metalness = GLASS.METALNESS;
        material.side = THREE.DoubleSide;

        // Only set physical-only properties if material is a MeshPhysicalMaterial
        if ((material as any).isMeshPhysicalMaterial) {
            (material as any).transmission = GLASS.TRANSMISSION;
            (material as any).ior = GLASS.IOR;
            (material as any).thickness = 0.05;
        } else {
            console.log(`Skipping physical props for material '${material.name}' (not MeshPhysicalMaterial)`);
        }
        material.needsUpdate = true;
    }

    private applyMarbleMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { MARBLE } = MATERIAL_CONFIG;
        // Preserve original material: tweak properties in-place
        material.map = material.map || material.map;
        material.normalMap = material.normalMap || material.normalMap;
        material.color = (material.color || new THREE.Color(0xffffff)).clone();
        material.roughness = MARBLE.ROUGHNESS;
        material.metalness = MARBLE.METALNESS;
        material.side = THREE.DoubleSide;

        if ((material as any).isMeshPhysicalMaterial) {
            (material as any).clearcoat = MARBLE.CLEARCOAT;
            (material as any).clearcoatRoughness = 0.1;
        } else {
            console.log(`Skipping clearcoat props for material '${material.name}' (not MeshPhysicalMaterial)`);
        }
        material.needsUpdate = true;
    }

    private applyWallMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { WALL } = MATERIAL_CONFIG;
        // Turn the wall ('stanza') into a glass-like material while preserving maps
        const oldMap = material.map || null;
        const oldNormal = material.normalMap || undefined;
        const color = (material.color || new THREE.Color(0xffffff)).clone();

        // If already a physical material, just tweak to be glassy
        if ((material as any).isMeshPhysicalMaterial) {
            material.transparent = true;
            material.opacity = 1;
            material.roughness = 0.02;
            material.metalness = 0;
            (material as any).transmission = 0.9;
            (material as any).ior = 1.45;
            (material as any).thickness = 0.05;
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
            return;
        }

        // Otherwise create a MeshPhysicalMaterial and replace the old one
        const glass = new THREE.MeshPhysicalMaterial({
            map: oldMap,
            normalMap: oldNormal,
            color,
            transparent: true,
            opacity: 0.2,
            roughness: 0.02,
            metalness: 0,
            transmission: 0.9,
            ior: 1.1,
            thickness: 0,
            side: THREE.DoubleSide
        });
        glass.name = material.name || 'stanza-glass';

        // Assign new material to mesh and dispose old material to avoid leaks
        mesh.material = glass;
        try { material.dispose(); } catch (e) { /* ignore */ }
        glass.needsUpdate = true;
    }

    private applyCeilingMaterial(material: THREE.MeshStandardMaterial): void {
        material.emissive = new THREE.Color(COLORS.ICE_BLUE);
        material.emissiveIntensity = MATERIAL_CONFIG.CEILING.EMISSIVE_INTENSITY;
    }

    private applyLedMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { LED } = MATERIAL_CONFIG;
        material.emissive = new THREE.Color(LED.COLOR);
        material.emissiveIntensity = LED.EMISSIVE_INTENSITY;
        material.toneMapped = false;
        const light = new THREE.PointLight(LED.COLOR, LED.POINT_LIGHT_INTENSITY, LED.POINT_LIGHT_DISTANCE, 2);
        mesh.add(light);
    }

    private applyScreenMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial, texturePath: string, target: 'schermoGrande' | 'schermoPiccolo'): void {
        const { SCREEN } = MATERIAL_CONFIG;

        // Set basic material properties immediately
        material.emissive = new THREE.Color(COLORS.WHITE);
        material.emissiveIntensity = SCREEN.EMISSIVE_INTENSITY * 0.3; // Lower initially
        material.roughness = SCREEN.ROUGHNESS;
        material.metalness = SCREEN.METALNESS;

        // Carica la texture subito (il modello e' gia' visibile a questo punto)
        const texture = this.loadTexture(texturePath, { flipY: true });
        material.map = texture;
        material.emissiveMap = texture;
        material.emissiveIntensity = SCREEN.EMISSIVE_INTENSITY;
        material.needsUpdate = true;

        if (target === 'schermoGrande') this.schermoGrandeMesh = mesh;
        else {
            this.schermoPiccoloMesh = mesh;
            this.startPacmanGlow();
        }

        mesh.userData['isClickable'] = true;
    }

    private applyQuadroMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        // Set basic properties immediately
        material.emissive = new THREE.Color(COLORS.WHITE);

        // Carica la texture subito
        const texture = this.loadTexture('assets/opt_cvfoto1.webp', { flipY: true });
        material.map = texture;
        material.emissiveMap = texture;
        material.emissiveIntensity = MATERIAL_CONFIG.SCREEN.EMISSIVE_INTENSITY;
        material.needsUpdate = true;

        this.quadroMesh = mesh;
        this.quadroOriginalScale.copy(mesh.scale);
        mesh.userData['isClickable'] = true;
    }

    private cacheCornice(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        this.corniceMesh = mesh;
        this.corniceOriginalScale.copy(mesh.scale);
    }

    private applyYellowMaterial(material: THREE.MeshStandardMaterial): void {
        material.needsUpdate = true;
        material.emissive = new THREE.Color(COLORS.YELLOW);
        material.emissiveIntensity = MATERIAL_CONFIG.SCREEN.EMISSIVE_INTENSITY;
    }

    private loadTexture(path: string, opts?: { flipY?: boolean; generateMipmaps?: boolean }): THREE.Texture {
        const key = `${path}::f:${String(opts?.flipY ?? false)}::m:${String(opts?.generateMipmaps ?? false)}`;
        if (!this.textureCache.has(key)) {
            const texture = this.textureLoader.load(path);
            texture.flipY = opts?.flipY ?? false;
            try { texture.colorSpace = THREE.SRGBColorSpace; } catch (e) { }
            
            // Optimization: anisotropic filtering for premium look without much cost
            const maxAnisotropy = this.renderer?.capabilities.getMaxAnisotropy() || 1;
            texture.anisotropy = Math.min(maxAnisotropy, 8); 

            texture.generateMipmaps = opts?.generateMipmaps ?? false;
            texture.minFilter = texture.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
            this.textureCache.set(key, texture);
        }
        return this.textureCache.get(key)!;
    }

    private currentEnvProgress = 0;
    private currentModelProgress = 0;

    private updateLoadingState(progress: number, type: 'env' | 'model'): void {
        // Only track model progress for the UI
        if (type === 'model') {
            this.currentModelProgress = progress;
            this.updateProgress(progress);
        }
    }

    private updateProgress(value: number): void {
        this.ngZone.run(() => this.loadingProgress$.next(value));
    }

    private checkLoadingComplete(): void {
        if (this.isModelLoaded) {
            this.updateProgress(100);
            setTimeout(() => {
                this.ngZone.run(() => this.loadingComplete$.next(true));
            }, 400);
        }
    }

    private startAnimation(): void {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    private animate(now: number = 0): void {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        // Render throttling: 60fps durante interazione, 30fps a riposo
        const isActive = (now - this.lastInteractionTime) < INTERACTION_COOLDOWN_MS;
        const targetFps = isActive ? FPS_ACTIVE : FPS_IDLE;
        const elapsed = now - this.lastFrameTime;
        if (elapsed < targetFps) return;
        this.lastFrameTime = now - (elapsed % targetFps);

        this.frameCount++;
        this.controls?.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Interaction
    private markInteraction(): void {
        this.lastInteractionTime = performance.now();
    }

    private setupEventListeners(canvas: HTMLElement): void {
        window.addEventListener('resize', () => this.onWindowResize(canvas));
        canvas.addEventListener('click', (e) => { this.markInteraction(); this.onCanvasClick(e, canvas); });
        canvas.addEventListener('mousemove', (e) => { this.markInteraction(); this.onMouseMove(e, canvas); });
        // Segna interazione anche per touch e scroll (OrbitControls)
        canvas.addEventListener('touchstart', () => this.markInteraction(), { passive: true });
        canvas.addEventListener('wheel', () => this.markInteraction(), { passive: true });
    }

    private onWindowResize(canvas: HTMLElement): void {
        const { clientWidth: width, clientHeight: height } = canvas;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private onCanvasClick(event: MouseEvent, canvas: HTMLElement): void {
        if (this.isZooming) return;

        this.updateMouseCoordinates(event, canvas);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Clickable objects priority list
        const targets = [];
        if (this.quadroMesh) targets.push(this.quadroMesh);
        if (this.schermoGrandeMesh) targets.push(this.schermoGrandeMesh);
        if (this.schermoPiccoloMesh) targets.push(this.schermoPiccoloMesh);
        if (this.catMesh) targets.push(this.catMesh);

        const intersects = this.raycaster.intersectObjects(targets);
        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh;
            
            if (mesh === this.quadroMesh) {
                this.ngZone.run(() => this.pdfClick$.next());
            } else if (mesh === this.schermoGrandeMesh) {
                this.zoomToScreen(this.schermoGrandeMesh, THREE_CONFIG.ZOOM.SCREEN_DISTANCE, () => {
                    this.screenClick$.next('desktop');
                });
            } else if (mesh === this.schermoPiccoloMesh) {
                this.zoomToScreen(this.schermoPiccoloMesh, THREE_CONFIG.ZOOM.GAME_DISTANCE, () => {
                    this.screenClick$.next('game');
                });
            } else if (mesh === this.catMesh) {
                this.ngZone.run(() => this.catClick$.next());
            }
        }
    }

    private onMouseMove(event: MouseEvent, canvas: HTMLElement): void {
        if (this.isZooming) return;

        this.updateMouseCoordinates(event, canvas);

        // Throttle raycasting: ogni 2 frames (risparmia CPU soprattutto su mesh complessi)
        if (this.frameCount % 2 !== 0) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        let isHoveringSomething = false;

        if (this.handleQuadroHover()) isHoveringSomething = true;

        const isPacmanHit = this.checkIntersection(this.schermoPiccoloMesh);
        const isCatHit = this.checkIntersection(this.catMesh);

        if (!isHoveringSomething && (this.checkIntersection(this.schermoGrandeMesh) || isPacmanHit || isCatHit)) {
            isHoveringSomething = true;
        }

        canvas.style.cursor = isHoveringSomething ? 'pointer' : 'grab';
    }

    private updateMouseCoordinates(event: MouseEvent, canvas: HTMLElement): void {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private checkIntersection(mesh: THREE.Mesh | null): boolean {
        if (!mesh) return false;
        return this.raycaster.intersectObject(mesh, false).length > 0;
    }

    private handleQuadroHover(): boolean {
        if (!this.quadroMesh || !this.corniceMesh) return false;
        const isHit = this.checkIntersection(this.quadroMesh);

        if (isHit && !this.isHovering) {
            this.isHovering = true;
            this.animateHoverIn();
        } else if (!isHit && this.isHovering) {
            this.isHovering = false;
            this.animateHoverOut();
        }
        return isHit;
    }

    private animateHoverIn(): void {
        const scale = 1.05;
        const duration = 0.4;

        gsap.to(this.quadroMesh!.scale, {
            x: this.quadroOriginalScale.x * scale,
            y: this.quadroOriginalScale.y * scale,
            z: this.quadroOriginalScale.z * scale,
            duration,
            ease: 'power2.out'
        });

        gsap.to(this.corniceMesh!.scale, {
            x: this.corniceOriginalScale.x * scale,
            y: this.corniceOriginalScale.y * scale,
            z: this.corniceOriginalScale.z * scale,
            duration,
            ease: 'power2.out'
        });

        const material = this.corniceMesh!.material as THREE.MeshStandardMaterial;
        gsap.to(material, {
            emissiveIntensity: 0.8,
            duration,
            ease: 'power2.out',
            onStart: () => { material.emissive = new THREE.Color(COLORS.ICE_BLUE); }
        });
    }

    private animateHoverOut(): void {
        const duration = 0.4;

        gsap.to(this.quadroMesh!.scale, {
            x: this.quadroOriginalScale.x,
            y: this.quadroOriginalScale.y,
            z: this.quadroOriginalScale.z,
            duration,
            ease: 'power2.out'
        });

        gsap.to(this.corniceMesh!.scale, {
            x: this.corniceOriginalScale.x,
            y: this.corniceOriginalScale.y,
            z: this.corniceOriginalScale.z,
            duration,
            ease: 'power2.out'
        });

        const material = this.corniceMesh!.material as THREE.MeshStandardMaterial;
        gsap.to(material, {
            emissiveIntensity: 0,
            duration,
            ease: 'power2.out',
            onComplete: () => { material.emissive = new THREE.Color(COLORS.BLACK); }
        });
    }

    private startCatGlow(): void {
        if (!this.catMeshes.length) return;
        this.catMeshes.forEach(mesh => {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach(mat => {
                const m = mat as THREE.MeshStandardMaterial;
                if (!m || !('emissive' in m)) return;
                m.emissive = new THREE.Color(0xffe0aa);
                m.emissiveIntensity = 0.05;
                this.catGlowTween = gsap.to(m, {
                    emissiveIntensity: 0.18,
                    duration: 0.9,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            });
        });
    }

    private startPacmanGlow(): void {
        if (!this.schermoPiccoloMesh) return;
        const material = this.schermoPiccoloMesh.material as THREE.MeshStandardMaterial;
        if (!material) return;
        this.pacmanGlowTween = gsap.to(material, {
            emissiveIntensity: 3.5,
            duration: 0.9,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            startAt: { emissiveIntensity: MATERIAL_CONFIG.SCREEN.EMISSIVE_INTENSITY }
        });
    }

    private zoomToScreen(mesh: THREE.Mesh, distance: number, onComplete: () => void): void {
        if (!this.camera || !this.controls) return;
        this.isZooming = true;

        this.cameraOriginalPosition.copy(this.camera.position);
        this.controlsOriginalTarget.copy(this.controls.target);

        const screenPos = new THREE.Vector3();
        mesh.getWorldPosition(screenPos);
        const targetCameraPos = new THREE.Vector3(screenPos.x, screenPos.y, screenPos.z + distance);
        const duration = THREE_CONFIG.ZOOM.ANIMATION_DURATION;

        gsap.to(this.camera.position, {
            x: targetCameraPos.x,
            y: targetCameraPos.y,
            z: targetCameraPos.z,
            duration,
            ease: 'power2.inOut'
        });

        gsap.to(this.controls.target, {
            x: screenPos.x,
            y: screenPos.y,
            z: screenPos.z,
            duration,
            ease: 'power2.inOut',
            onComplete: () => {
                this.isZooming = false;
                this.controls.enabled = false;
                this.ngZone.run(onComplete);
            }
        });
    }

    public setInitialPositionOnScreen(): void {
        if (!this.schermoGrandeMesh) return;

        // Salva la posizione originale della camera (per poter tornare indietro)
        this.cameraOriginalPosition.copy(this.camera.position);
        this.controlsOriginalTarget.copy(this.controls.target);

        // Ottieni la posizione dello schermo grande
        const screenPos = new THREE.Vector3();
        this.schermoGrandeMesh.getWorldPosition(screenPos);

        // Posiziona la camera direttamente davanti allo schermo (senza animazione)
        this.camera.position.set(
            screenPos.x,
            screenPos.y,
            screenPos.z + THREE_CONFIG.ZOOM.SCREEN_DISTANCE
        );

        // Imposta il target dei controlli sullo schermo
        this.controls.target.set(screenPos.x, screenPos.y, screenPos.z);
        this.controls.update();

        // Disabilita i controlli e mostra il desktop
        this.controls.enabled = false;
        this.ngZone.run(() => this.screenClick$.next('desktop'));
    }

    public returnFromZoom(): void {
        this.isZooming = true;
        const duration = THREE_CONFIG.ZOOM.RETURN_DURATION;

        gsap.to(this.camera.position, {
            x: this.cameraOriginalPosition.x,
            y: this.cameraOriginalPosition.y,
            z: this.cameraOriginalPosition.z,
            duration,
            ease: 'power2.inOut'
        });

        gsap.to(this.controls.target, {
            x: this.controlsOriginalTarget.x,
            y: this.controlsOriginalTarget.y,
            z: this.controlsOriginalTarget.z,
            duration,
            ease: 'power2.inOut',
            onComplete: () => {
                this.isZooming = false;
                this.controls.enabled = true;
            }
        });
    }

    public toggleDarkMode(isDarkMode: boolean): void {
        const { LIGHTS } = THREE_CONFIG;
        if (isDarkMode) {
            this.ambientLight.intensity = LIGHTS.AMBIENT.INTENSITY_DARK;
            this.directionalLight.intensity = LIGHTS.DIRECTIONAL.INTENSITY_DARK;
            this.rectLight.intensity = LIGHTS.RECT.INTENSITY_DARK;
            // Show the HDR sky as a 'photo' background but disable it as lighting source
            if (this.envMap) {
                this.scene.background = this.envMap;
            } else {
                this.scene.background = new THREE.Color(COLORS.DARK_BACKGROUND);
            }
            this.scene.environment = null;
        } else {
            this.ambientLight.intensity = LIGHTS.AMBIENT.INTENSITY_LIGHT;
            this.directionalLight.intensity = LIGHTS.DIRECTIONAL.INTENSITY_LIGHT;
            this.rectLight.intensity = LIGHTS.RECT.INTENSITY_LIGHT;
            if (this.envMap) {
                this.scene.background = this.envMap;
                this.scene.environment = this.envMap;
                (this.scene as any).backgroundIntensity = THREE_CONFIG.LIGHTS.ENVIRONMENT_INTENSITY;
                (this.scene as any).environmentIntensity = THREE_CONFIG.LIGHTS.ENVIRONMENT_INTENSITY;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        this.catGlowTween?.kill();
        this.pacmanGlowTween?.kill();
        this.textureCache.forEach(texture => texture.dispose());
        this.textureCache.clear();
        this.model?.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.geometry?.dispose();
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    materials.forEach(mat => mat.dispose());
                }
            }
        });
        this.renderer?.dispose();
    }
}
