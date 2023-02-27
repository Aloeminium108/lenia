"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lenia = void 0;
const index_js_1 = require("/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js");
const framecounter_js_1 = require("./framecounter.js");
const gpufunctions_js_1 = require("./gpufunctions.js");
const kernel_js_1 = require("./kernel.js");
class Lenia {
    constructor(size, growthCenter, growthWidth, countFrames = false) {
        var _a;
        this.size = size;
        this.growthCenter = growthCenter;
        this.growthWidth = growthWidth;
        this.dt = 0.05;
        this.animate = () => {
            var _a;
            const frame = this.update(this.lastFrame, this.size, this.kernel, this.kernel.length, this.dt, this.growthCenter, this.growthWidth);
            this.render(frame);
            if (this.lastFrame instanceof index_js_1.Texture)
                this.lastFrame.delete();
            this.lastFrame = frame;
            (_a = this.frameCounter) === null || _a === void 0 ? void 0 : _a.countFrame();
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
        this.drawGrowthCurve = () => {
            const canvas = document.getElementById('growth-curve');
            canvas.width = 1000;
            canvas.height = 100;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'orange';
                for (let x = 0; x < canvas.width; x++) {
                    const y = (canvas.height / 2) - ((canvas.height / 2.5) * (0, gpufunctions_js_1.growthFunction)(x / canvas.width, this.growthCenter, this.growthWidth));
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        };
        this.addEventListeners = () => {
            var _a, _b, _c;
            (_a = document.getElementById('growth-center')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
                this.growthCenter = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_b = document.getElementById('growth-width')) === null || _b === void 0 ? void 0 : _b.addEventListener('change', (e) => {
                this.growthWidth = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_c = document.getElementById('delta')) === null || _c === void 0 ? void 0 : _c.addEventListener('change', (e) => {
                this.dt = parseFloat(e.target.value);
            });
        };
        this.lastFrame = this.randomize(size);
        this.kernel = (0, kernel_js_1.generateKernel)([1, 0.7, 0.3], 0.2, 20, kernel_js_1.FunctionShape.POLYNOMIAL);
        this.update = (0, gpufunctions_js_1.createUpdateFunction)(size);
        this.render = (0, gpufunctions_js_1.createRenderFunction)(size);
        this.render(this.lastFrame);
        const canvas = this.render.canvas;
        (_a = document.getElementById('lenia-container')) === null || _a === void 0 ? void 0 : _a.appendChild(canvas);
        canvas.addEventListener('dblclick', (e) => {
            this.lastFrame = this.randomize(size);
        });
        this.addEventListeners();
        this.drawGrowthCurve();
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
