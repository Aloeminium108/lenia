"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lenia = void 0;
const framecounter_js_1 = require("./framecounter.js");
const gpulenia_js_1 = require("./gpulenia.js");
const kernel_js_1 = require("./kernel.js");
class Lenia {
    constructor(size, growthCenter, growthWidth, countFrames = false) {
        this.size = size;
        this.growthCenter = growthCenter;
        this.growthWidth = growthWidth;
        this.dt = 0.05;
        this.animate = () => {
            var _a, _b;
            const frame = this.update(this.lastFrame, this.size, this.kernel, this.kernel.length, this.dt, this.growthCenter, this.growthWidth);
            this.render(frame);
            (_a = this.lastFrame) === null || _a === void 0 ? void 0 : _a.delete();
            this.lastFrame = frame;
            (_b = this.frameCounter) === null || _b === void 0 ? void 0 : _b.countFrame();
            requestAnimationFrame(this.animate);
        };
        this.randomize = (size) => {
            let points = [];
            for (let i = 0; i < size; i++) {
                points[i] = [];
                for (let j = 0; j < size; j++) {
                    const rand = Math.random();
                    points[i][j] = rand;
                }
            }
            return points;
        };
        this.points = this.randomize(size);
        this.kernel = (0, kernel_js_1.generateKernel)([1], 0.3, 20, kernel_js_1.FunctionShape.POLYNOMIAL);
        this.update = (0, gpulenia_js_1.createUpdateFunction)(size);
        this.render = (0, gpulenia_js_1.createRenderFunction)(size);
        this.render(this.points);
        const canvas = this.render.canvas;
        document.body.appendChild(canvas);
        canvas.addEventListener('dblclick', (e) => {
            this.points = this.randomize(size);
        });
        this.lastFrame = this.update(this.points, this.size, this.kernel, this.kernel.length, this.dt, this.growthCenter, this.growthWidth);
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
