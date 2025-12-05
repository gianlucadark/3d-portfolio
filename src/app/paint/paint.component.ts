import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

/** Strumenti di disegno disponibili */
type DrawingTool = 'pencil' | 'eraser' | 'line' | 'rect' | 'ellipse';

@Component({
    selector: 'app-paint',
    templateUrl: './paint.component.html',
    styleUrls: ['./paint.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaintComponent implements AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;
    private startX = 0;
    private startY = 0;
    private previewImage: ImageData | null = null;

    // Public state
    color = '#000000';
    selectedTool: DrawingTool = 'pencil';
    lineWidth = 5;
    eraserSize = 5;
    isErasing = false;
    isPencilSizeActive = false;

    // Color palette
    readonly paletteColors = [
        '#000000', '#808080', '#C0C0C0', '#FFFFFF',
        '#800000', '#FF0000', '#808000', '#FFFF00',
        '#008000', '#00FF00', '#008080', '#00FFFF',
        '#000080', '#0000FF', '#800080', '#FF00FF',
        '#FFA500', '#A52A2A', '#F5DEB3', '#FFD700'
    ];

    // Tools that use preview mode
    private readonly shapeTools: DrawingTool[] = ['line', 'rect', 'ellipse'];

    // Bound event handlers for cleanup
    private readonly boundStartDrawing = this.startDrawing.bind(this);
    private readonly boundStopDrawing = this.stopDrawing.bind(this);
    private readonly boundDraw = this.draw.bind(this);

    ngAfterViewInit(): void {
        const canvas = this.canvasRef.nativeElement;
        if (!canvas) return;

        this.ctx = canvas.getContext('2d')!;

        canvas.addEventListener('mousedown', this.boundStartDrawing);
        canvas.addEventListener('mouseup', this.boundStopDrawing);
        canvas.addEventListener('mousemove', this.boundDraw);
    }

    ngOnDestroy(): void {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        canvas.removeEventListener('mousedown', this.boundStartDrawing);
        canvas.removeEventListener('mouseup', this.boundStopDrawing);
        canvas.removeEventListener('mousemove', this.boundDraw);
    }

    // ============================================
    // DRAWING EVENTS
    // ============================================

    private startDrawing(event: MouseEvent): void {
        this.isDrawing = true;
        this.startX = event.offsetX;
        this.startY = event.offsetY;

        if (this.isShapeTool()) {
            this.saveCanvas();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(event.offsetX, event.offsetY);
        }
    }

    private stopDrawing(event: MouseEvent): void {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        if (this.isShapeTool()) {
            this.restoreCanvas();
            this.drawShape(event.offsetX, event.offsetY);
            this.previewImage = null;
        } else {
            this.ctx.closePath();
        }
    }

    private draw(event: MouseEvent): void {
        if (!this.isDrawing) return;

        if (this.selectedTool === 'pencil' || this.selectedTool === 'eraser') {
            this.drawFreehand(event);
        } else if (this.isShapeTool()) {
            this.drawShapePreview(event);
        }
    }

    // ============================================
    // DRAWING METHODS
    // ============================================

    private drawFreehand(event: MouseEvent): void {
        this.ctx.lineTo(event.offsetX, event.offsetY);
        this.ctx.lineWidth = this.isErasing ? this.eraserSize : this.lineWidth;
        this.ctx.strokeStyle = this.isErasing ? 'white' : this.color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    private drawShapePreview(event: MouseEvent): void {
        this.restoreCanvas();
        this.drawShape(event.offsetX, event.offsetY);
    }

    private drawShape(x: number, y: number): void {
        this.ctx.save();
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        switch (this.selectedTool) {
            case 'line':
                this.drawLine(x, y);
                break;
            case 'rect':
                this.drawRectangle(x, y);
                break;
            case 'ellipse':
                this.drawEllipse(x, y);
                break;
        }

        this.ctx.restore();
    }

    private drawLine(x: number, y: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawRectangle(x: number, y: number): void {
        this.ctx.beginPath();
        this.ctx.rect(this.startX, this.startY, x - this.startX, y - this.startY);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawEllipse(x: number, y: number): void {
        const rx = Math.abs(x - this.startX) / 2;
        const ry = Math.abs(y - this.startY) / 2;
        const cx = (x + this.startX) / 2;
        const cy = (y + this.startY) / 2;

        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    // ============================================
    // CANVAS STATE
    // ============================================

    private saveCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        this.previewImage = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    private restoreCanvas(): void {
        if (this.previewImage) {
            this.ctx.putImageData(this.previewImage, 0, 0);
        }
    }

    // ============================================
    // TOOL SELECTION
    // ============================================

    selectTool(tool: DrawingTool): void {
        this.selectedTool = tool;
        this.isErasing = tool === 'eraser';
        this.isPencilSizeActive = tool === 'pencil';
    }

    selectColor(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.value) {
            this.color = input.value;
            this.selectedTool = 'pencil';
            this.isErasing = false;
        }
    }

    setColor(c: string): void {
        this.color = c;
        this.selectedTool = 'pencil';
        this.isErasing = false;
    }

    clearCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        if (canvas) {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    private isShapeTool(): boolean {
        return this.shapeTools.includes(this.selectedTool);
    }
}
