import { FrameCounter } from "./framecounter.js";
class Lenia {
    constructor(size, stateResolution, ctx, countFrames = false) {
        this.size = size;
        this.stateResolution = stateResolution;
        this.ctx = ctx;
        this.draw = () => {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    const index = (x + y * this.size) * 4;
                    this.image.data[index + 2] = this.points[x][y].real;
                    this.image.data[index + 3] = 255;
                }
            }
            this.ctx.putImageData(this.image, 0, 0);
        };
        this.update = () => {
            for (let i = 0; i < this.size; i++) {
                this.points[i] = [];
                for (let j = 0; j < this.size; j++) {
                    const rand = Math.floor(Math.random() * this.stateResolution);
                    this.points[i][j] = {
                        real: rand,
                        imag: 0
                    };
                }
            }
        };
        this.animate = () => {
            var _a;
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.update();
            this.draw();
            (_a = this.frameCounter) === null || _a === void 0 ? void 0 : _a.countFrame();
            requestAnimationFrame(this.animate);
        };
        this.image = ctx.createImageData(size, size);
        this.points = [];
        for (let i = 0; i < size; i++) {
            this.points[i] = [];
            for (let j = 0; j < size; j++) {
                const rand = Math.floor(Math.random() * stateResolution);
                this.points[i][j] = {
                    real: rand,
                    imag: 0
                };
            }
        }
        this.frameCounter = countFrames ? new FrameCounter() : undefined;
    }
}
export { Lenia };
