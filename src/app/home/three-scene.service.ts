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

    // Observables
    public readonly loadingProgress$ = new BehaviorSubject<number>(0);
    public readonly loadingComplete$ = new BehaviorSubject<boolean>(false);
    public readonly screenClick$ = new Subject<'desktop' | 'game'>();
    public readonly pdfClick$ = new Subject<void>();

    private isEnvLoaded = false;
    private isModelLoaded = false;

    constructor(private readonly ngZone: NgZone) { }

    public initialize(container: ElementRef): void {
        this.ngZone.runOutsideAngular(() => {
            this.initScene(container);
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

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, THREE_CONFIG.MAX_PIXEL_RATIO));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

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
        const rgbeLoader = new RGBELoader();
        rgbeLoader.setDataType(THREE.HalfFloatType);

        rgbeLoader.load(
            'assets/cielo1.hdr',
            (texture) => {
                const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
                pmremGenerator.compileEquirectangularShader();

                this.envMap = pmremGenerator.fromEquirectangular(texture).texture;
                this.scene.background = this.envMap;
                this.scene.environment = this.envMap;

                texture.dispose();
                pmremGenerator.dispose();

                this.isEnvLoaded = true;
                this.checkLoadingComplete();
            },
            (event) => {
                if (event.lengthComputable) {
                    // Environment is roughly 30% of total weight
                    const progress = (event.loaded / event.total) * 30;
                    this.updateLoadingState(progress, 'env');
                }
            },
            (error) => {
                console.error('Error loading HDR:', error);
                this.isEnvLoaded = true;
                this.checkLoadingComplete();
            }
        );
    }

    private loadModel(): void {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('assets/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            'assets/3d/room-space-draco.glb',
            (gltf) => {
                this.onModelLoaded(gltf);
                dracoLoader.dispose();
            },
            (event) => {
                if (event.lengthComputable) {
                    // Model is roughly 70% of total weight
                    const progress = (event.loaded / event.total) * 70;
                    this.updateLoadingState(progress, 'model');
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                this.isModelLoaded = true;
                this.checkLoadingComplete();
                dracoLoader.dispose();
            }
        );
    }

    private onModelLoaded(gltf: any): void {
        this.model = gltf.scene;
        if (!this.model) return;

        this.centerModel();
        this.enableShadows();
        this.applyMaterials();
        this.scene.add(this.model);

        this.isModelLoaded = true;
        this.updateLoadingState(30, 'model'); // Ensure it hits 100% contribution
        this.checkLoadingComplete();
    }

    private centerModel(): void {
        if (!this.model) return;
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());

        this.model.position.sub(center);
        this.model.position.y += THREE_CONFIG.MODEL.POSITION_Y_OFFSET;
        this.model.position.x += THREE_CONFIG.MODEL.POSITION_X_OFFSET;
    }

    private enableShadows(): void {
        this.model?.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    private applyMaterials(): void {
        this.model?.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;

            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (!material?.name) return;

            const name = material.name.toLowerCase();
            this.applyMaterialByName(mesh, material, name);
        });
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
            this.applyScreenMaterial(mesh, material, 'assets/sfondo.webp', 'schermoGrande');
        } else if (name.includes('schermopiccolo')) {
            this.applyScreenMaterial(mesh, material, 'assets/pacman.webp', 'schermoPiccolo');
        } else if (name.includes('quadro')) {
            this.applyQuadroMaterial(mesh, material);
        } else if (name.includes('cornice')) {
            this.cacheCornice(mesh, material);
        } else if (name.includes('giallo')) {
            this.applyYellowMaterial(material);
        }
    }

    // Material application helpers
    private applyGlassMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { GLASS } = MATERIAL_CONFIG;
        mesh.material = new THREE.MeshPhysicalMaterial({
            name: material.name,
            map: material.map,
            normalMap: material.normalMap,
            color: material.color,
            transparent: true,
            transmission: GLASS.TRANSMISSION,
            opacity: 1,
            roughness: GLASS.ROUGHNESS,
            metalness: GLASS.METALNESS,
            ior: GLASS.IOR,
            thickness: 0.05,
            side: THREE.DoubleSide
        });
    }

    private applyMarbleMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const { MARBLE } = MATERIAL_CONFIG;
        mesh.material = new THREE.MeshPhysicalMaterial({
            name: material.name,
            map: material.map,
            normalMap: material.normalMap,
            color: material.color,
            roughness: MARBLE.ROUGHNESS,
            metalness: MARBLE.METALNESS,
            clearcoat: MARBLE.CLEARCOAT,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });
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
        const texture = this.loadTexture(texturePath);
        material.map = texture;
        material.emissive = new THREE.Color(COLORS.WHITE);
        material.emissiveMap = texture;
        material.emissiveIntensity = SCREEN.EMISSIVE_INTENSITY;
        material.roughness = SCREEN.ROUGHNESS;
        material.metalness = SCREEN.METALNESS;

        if (target === 'schermoGrande') this.schermoGrandeMesh = mesh;
        else this.schermoPiccoloMesh = mesh;

        mesh.userData['isClickable'] = true;
    }

    private applyQuadroMaterial(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
        const texture = this.loadTexture('assets/cvfoto1.webp');
        material.map = texture;
        material.needsUpdate = true;
        material.emissive = new THREE.Color(COLORS.WHITE);
        material.emissiveMap = texture;
        material.emissiveIntensity = MATERIAL_CONFIG.SCREEN.EMISSIVE_INTENSITY;

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

    private loadTexture(path: string): THREE.Texture {
        if (!this.textureCache.has(path)) {
            const loader = new THREE.TextureLoader();
            const texture = loader.load(path);
            texture.flipY = true;
            texture.colorSpace = THREE.SRGBColorSpace;
            this.textureCache.set(path, texture);
        }
        return this.textureCache.get(path)!;
    }

    private currentEnvProgress = 0;
    private currentModelProgress = 0;

    private updateLoadingState(progress: number, type: 'env' | 'model'): void {
        if (type === 'env') {
            this.currentEnvProgress = progress;
        } else {
            this.currentModelProgress = progress;
        }

        const totalProgress = Math.min(Math.round(this.currentEnvProgress + this.currentModelProgress), 99);
        this.updateProgress(totalProgress);
    }

    private updateProgress(value: number): void {
        this.ngZone.run(() => this.loadingProgress$.next(value));
    }

    private checkLoadingComplete(): void {
        if (this.isEnvLoaded && this.isModelLoaded) {
            this.updateProgress(100);
            setTimeout(() => {
                this.ngZone.run(() => this.loadingComplete$.next(true));
            }, 400);
        }
    }

    private startAnimation(): void {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    private animate(): void {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.controls?.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Interaction
    private setupEventListeners(canvas: HTMLElement): void {
        window.addEventListener('resize', () => this.onWindowResize(canvas));
        canvas.addEventListener('click', (e) => this.onCanvasClick(e, canvas));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e, canvas));
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

        if (this.checkIntersection(this.quadroMesh)) {
            this.ngZone.run(() => this.pdfClick$.next());
            return;
        }

        if (this.checkIntersection(this.schermoGrandeMesh)) {
            this.zoomToScreen(this.schermoGrandeMesh!, THREE_CONFIG.ZOOM.SCREEN_DISTANCE, () => {
                this.screenClick$.next('desktop');
            });
            return;
        }

        if (this.checkIntersection(this.schermoPiccoloMesh)) {
            this.zoomToScreen(this.schermoPiccoloMesh!, THREE_CONFIG.ZOOM.GAME_DISTANCE, () => {
                this.screenClick$.next('game');
            });
        }
    }

    private onMouseMove(event: MouseEvent, canvas: HTMLElement): void {
        if (this.isZooming) return;

        this.updateMouseCoordinates(event, canvas);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        let isHoveringSomething = false;

        if (this.handleQuadroHover()) isHoveringSomething = true;
        if (!isHoveringSomething && (this.checkIntersection(this.schermoGrandeMesh) || this.checkIntersection(this.schermoPiccoloMesh))) {
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
            this.scene.background = new THREE.Color(COLORS.DARK_BACKGROUND);
            this.scene.environment = null;
        } else {
            this.ambientLight.intensity = LIGHTS.AMBIENT.INTENSITY_LIGHT;
            this.directionalLight.intensity = LIGHTS.DIRECTIONAL.INTENSITY_LIGHT;
            this.rectLight.intensity = LIGHTS.RECT.INTENSITY_LIGHT;
            if (this.envMap) {
                this.scene.background = this.envMap;
                this.scene.environment = this.envMap;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
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
