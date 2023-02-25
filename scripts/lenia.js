"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lenia = void 0;
const framecounter_js_1 = require("./framecounter.js");
const gpuconvolution_js_1 = require("./gpuconvolution.js");
class Lenia {
    constructor(size, 
    // Although the states of vectors in Lenia are, strictly speaking,
    // on the interval of [0, 1], an interval of [0, stateResolution]
    // is used here instead to avoid redundant calculations
    stateResolution, ctx, countFrames = false) {
        this.size = size;
        this.stateResolution = stateResolution;
        this.ctx = ctx;
        this.dt = 0.1;
        this.draw = () => {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    const index = (x + y * this.size) * 4;
                    this.image.data[index + 2] = this.points[x][y];
                    this.image.data[index + 3] = 255;
                }
            }
            this.ctx.putImageData(this.image, 0, 0);
        };
        this.update = () => {
            const convolution = this.gpuConvolution(this.points, this.size, this.kernel, this.kernel.length);
            console.log(convolution[64][64]);
            this.growthFunction.applyToMatrix(convolution);
            console.log(convolution[64][64]);
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    this.points[x][y] = Math.min(Math.max(this.points[x][y] + convolution[x][y] * this.dt, 0), this.stateResolution - 1);
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
                    const rand = Math.floor(Math.random() * this.stateResolution);
                    this.points[i][j] = rand;
                }
            }
        };
        this.image = ctx.createImageData(size, size);
        this.points = [];
        for (let i = 0; i < size; i++) {
            this.points[i] = [];
            for (let j = 0; j < size; j++) {
                const rand = Math.floor(Math.random() * stateResolution);
                this.points[i][j] = rand;
            }
        }
        this.growthFunction = new GrowthFunction(this.stateResolution * 2, 18, 1, -this.stateResolution, this.stateResolution);
        this.kernel = generateKernel([
            new GrowthFunction(0.1, 0, 2, 0, this.stateResolution),
        ], 20);
        this.gpuConvolution = (0, gpuconvolution_js_1.createGPUConvolution)(size);
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
function convolve(matrix, kernel) {
    const convolution = [];
    for (let x1 = 0; x1 < matrix.length; x1++) {
        convolution[x1] = [];
        for (let y1 = 0; y1 < matrix[x1].length; y1++) {
            let sum = 0;
            for (let i = 0; i < kernel.length; i++) {
                for (let j = 0; j < kernel[i].length; j++) {
                    let x = x1 - (i - Math.floor(kernel.length / 2));
                    x = (x + matrix.length) % matrix.length;
                    let y = y1 - (j - Math.floor(kernel[i].length / 2));
                    y = (y + matrix[x1].length) % matrix[x1].length;
                    sum += kernel[i][j] * matrix[x][y] / (Math.pow(kernel.length, 2));
                }
            }
            convolution[x1][y1] = sum;
        }
    }
    return convolution;
}
function generateKernel(growthFunctions, radius) {
    const points = [];
    for (let x = 0; x < radius * 2 + 1; x++) {
        points[x] = [];
        for (let y = 0; y < radius * 2 + 1; y++) {
            const dx = x - radius;
            const dy = y - radius;
            const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            let sum = 0;
            growthFunctions.forEach(func => {
                sum += func.apply(distance);
            });
            points[x][y] = sum;
        }
    }
    return points;
}
class GrowthFunction {
    constructor(a, b, c, h, max, min = -max) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.h = h;
        this.max = max;
        this.min = min;
        this.apply = (value) => {
            let result = (this.a * Math.pow(Math.E, (-(Math.pow((value - this.b), 2)) / this.c2))) + this.h;
            return Math.min(Math.max(result, this.min), this.max);
        };
        this.applyToMatrix = (matrix) => {
            for (let x = 0; x < matrix.length; x++) {
                for (let y = 0; y < matrix[x].length; y++) {
                    matrix[x][y] = this.apply(matrix[x][y]);
                }
            }
        };
        this.c2 = 2 * Math.pow(c, 2);
    }
}
