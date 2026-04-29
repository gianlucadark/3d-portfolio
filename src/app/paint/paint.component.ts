import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

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

    color = '#000000';
    selectedTool: DrawingTool = 'pencil';
    lineWidth = 5;
    eraserSize = 5;
    isErasing = false;
    isPencilSizeActive = false;

    readonly paletteColors = [
        '#000000', '#808080', '#C0C0C0', '#FFFFFF',
        '#800000', '#FF0000', '#808000', '#FFFF00',
        '#008000', '#00FF00', '#008080', '#00FFFF',
        '#000080', '#0000FF', '#800080', '#FF00FF',
        '#FFA500', '#A52A2A', '#F5DEB3', '#FFD700'
    ];

    private readonly shapeTools: DrawingTool[] = ['line', 'rect', 'ellipse'];

    private readonly boundStartDrawing = this.startDrawing.bind(this);
    private readonly boundStopDrawing = this.stopDrawing.bind(this);
    private readonly boundDraw = this.draw.bind(this);
    private readonly boundTouchStart = this.onTouchStart.bind(this);
    private readonly boundTouchMove = this.onTouchMove.bind(this);
    private readonly boundTouchEnd = this.onTouchEnd.bind(this);

    ngAfterViewInit(): void {
        const canvas = this.canvasRef.nativeElement;
        if (!canvas) return;

        this.ctx = canvas.getContext('2d')!;

        canvas.addEventListener('mousedown', this.boundStartDrawing);
        canvas.addEventListener('mouseup', this.boundStopDrawing);
        canvas.addEventListener('mousemove', this.boundDraw);
        canvas.addEventListener('mouseleave', this.boundStopDrawing);

        // passive: false è necessario per poter chiamare preventDefault() e bloccare lo scroll
        canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }

    ngOnDestroy(): void {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        canvas.removeEventListener('mousedown', this.boundStartDrawing);
        canvas.removeEventListener('mouseup', this.boundStopDrawing);
        canvas.removeEventListener('mousemove', this.boundDraw);
        canvas.removeEventListener('mouseleave', this.boundStopDrawing);
        canvas.removeEventListener('touchstart', this.boundTouchStart);
        canvas.removeEventListener('touchmove', this.boundTouchMove);
        canvas.removeEventListener('touchend', this.boundTouchEnd);
    }

    // ============================================
    // COORDINATE HELPER — gestisce il scaling CSS vs canvas interno
    // ============================================

    private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    // ============================================
    // MOUSE EVENTS
    // ============================================

    private startDrawing(event: MouseEvent): void {
        const { x, y } = this.getCanvasCoords(event.clientX, event.clientY);
        this.beginStroke(x, y);
    }

    private stopDrawing(event: MouseEvent): void {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.isShapeTool()) {
            const { x, y } = this.getCanvasCoords(event.clientX, event.clientY);
            this.restoreCanvas();
            this.drawShape(x, y);
            this.previewImage = null;
        } else {
            this.ctx.closePath();
        }
    }

    private draw(event: MouseEvent): void {
        if (!this.isDrawing) return;
        const { x, y } = this.getCanvasCoords(event.clientX, event.clientY);
        this.continueStroke(x, y);
    }

    // ============================================
    // TOUCH EVENTS — blocca scroll durante il disegno
    // ============================================

    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;
        const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
        this.beginStroke(x, y);
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (!this.isDrawing) return;
        const touch = event.touches[0];
        if (!touch) return;
        const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
        this.continueStroke(x, y);
    }

    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.isShapeTool()) {
            const touch = event.changedTouches[0];
            if (touch) {
                const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
                this.restoreCanvas();
                this.drawShape(x, y);
            }
            this.previewImage = null;
        } else {
            this.ctx.closePath();
        }
    }

    // ============================================
    // STROKE HELPERS — condivisi tra mouse e touch
    // ============================================

    private beginStroke(x: number, y: number): void {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;

        if (this.isShapeTool()) {
            this.saveCanvas();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }
    }

    private continueStroke(x: number, y: number): void {
        if (this.selectedTool === 'pencil' || this.selectedTool === 'eraser') {
            this.drawFreehandAt(x, y);
        } else if (this.isShapeTool()) {
            this.restoreCanvas();
            this.drawShape(x, y);
        }
    }

    // ============================================
    // DRAWING METHODS
    // ============================================

    private drawFreehandAt(x: number, y: number): void {
        this.ctx.lineTo(x, y);
        this.ctx.lineWidth = this.isErasing ? this.eraserSize : this.lineWidth;
        this.ctx.strokeStyle = this.isErasing ? 'white' : this.color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    private drawShape(x: number, y: number): void {
        this.ctx.save();
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        switch (this.selectedTool) {
            case 'line':    this.drawLine(x, y);      break;
            case 'rect':    this.drawRectangle(x, y); break;
            case 'ellipse': this.drawEllipse(x, y);   break;
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
