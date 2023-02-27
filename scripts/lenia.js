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
        this.mousePressed = false;
        this.brushSize = 15;
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
            var _a, _b, _c, _d;
            (_a = document.getElementById('growth-center')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
                this.growthCenter = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_b = document.getElementById('growth-width')) === null || _b === void 0 ? void 0 : _b.addEventListener('change', (e) => {
                this.growthWidth = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_c = document.getElementById('delta')) === null || _c === void 0 ? void 0 : _c.addEventListener('change', (e) => {
                this.dt = Math.pow(parseFloat(e.target.value), 2);
            });
            (_d = document.getElementById('scramble')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
                this.lastFrame = this.randomize(this.size);
            });
        };
        this.lastFrame = this.randomize(size);
        this.kernel = (0, kernel_js_1.generateKernel)([1, 0.7, 0.3], 0.1, 20, kernel_js_1.FunctionShape.POLYNOMIAL);
        this.update = (0, gpufunctions_js_1.createUpdateFunction)(size);
        this.draw = (0, gpufunctions_js_1.createDrawFunction)(size);
        this.render = (0, gpufunctions_js_1.createRenderFunction)(size);
        this.render(this.lastFrame);
        document.addEventListener('contextmenu', event => event.preventDefault());
        const canvas = this.render.canvas;
        (_a = document.getElementById('lenia-container')) === null || _a === void 0 ? void 0 : _a.appendChild(canvas);
        canvas.onmousedown = (e) => {
            this.mousePressed = true;
            let x = Math.floor((e.offsetX / e.target.offsetWidth) * this.size);
            let y = Math.floor((e.offsetY / e.target.offsetHeight) * this.size);
            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2);
        };
        canvas.onmousemove = (e) => {
            if (!this.mousePressed)
                return;
            let x = Math.floor((e.offsetX / e.target.offsetWidth) * this.size);
            let y = Math.floor((e.offsetY / e.target.offsetHeight) * this.size);
            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2);
        };
        canvas.onmouseup = (e) => {
            this.mousePressed = false;
        };
        this.addEventListeners();
        this.drawGrowthCurve();
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
