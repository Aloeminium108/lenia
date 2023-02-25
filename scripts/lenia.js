"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lenia = void 0;
const framecounter_js_1 = require("./framecounter.js");
const gpuconvolution_js_1 = require("./gpuconvolution.js");
const growthfunction_js_1 = require("./growthfunction.js");
const kernel_js_1 = require("./kernel.js");
class Lenia {
    constructor(size, 
    // Although the states of vectors in Lenia are, strictly speaking,
    // on the interval of [0, 1], an interval of [0, stateResolution]
    // is used here instead to avoid redundant calculations
    ctx, countFrames = false) {
        this.size = size;
        this.ctx = ctx;
        this.dt = 0.1;
        this.draw = () => {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    const index = (x + y * this.size) * 4;
                    this.image.data[index + 2] = Math.floor(this.points[x][y] * 255);
                    this.image.data[index + 3] = 255;
                }
            }
            this.ctx.putImageData(this.image, 0, 0);
        };
        this.update = () => {
            const convolution = this.gpuConvolution(this.points, this.size, this.kernel, this.kernel.length);
            console.log(convolution[128][128]);
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    convolution[x][y] = this.growthFunction(convolution[x][y]);
                }
            }
            console.log(convolution[128][128]);
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    this.points[x][y] = Math.min(Math.max(this.points[x][y] + convolution[x][y] * this.dt, 0), 1);
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
        this.randomize = () => {
            for (let i = 0; i < this.size; i++) {
                this.points[i] = [];
                for (let j = 0; j < this.size; j++) {
                    const rand = Math.random();
                    this.points[i][j] = rand;
                }
            }
        };
        this.image = ctx.createImageData(size, size);
        this.points = [];
        for (let i = 0; i < size; i++) {
            this.points[i] = [];
            for (let j = 0; j < size; j++) {
                const rand = Math.random();
                this.points[i][j] = rand;
            }
        }
        this.growthFunction = (0, growthfunction_js_1.createGrowthFunction)(0.15, 0.02, growthfunction_js_1.FunctionShape.RECTANGLE);
        this.kernel = (0, kernel_js_1.generateKernel)([1, 0.5], 0.2, 20, growthfunction_js_1.FunctionShape.RECTANGLE);
        this.gpuConvolution = (0, gpuconvolution_js_1.createGPUConvolution)(size);
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
