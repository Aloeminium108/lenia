"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lenia = void 0;
const framecounter_js_1 = require("./framecounter.js");
const fftpipeline_js_1 = require("./fftpipeline.js");
class Lenia {
    constructor(size, growthCenter, growthWidth, countFrames = false) {
        var _a;
        this.size = size;
        this.growthCenter = growthCenter;
        this.growthWidth = growthWidth;
        this.dt = 0.05;
        this.mousePressed = false;
        this.brushSize = 10;
        this.termSignal = false;
        this.animate = () => {
            var _a;
            if (this.frameCounter.frameCount < 2) {
                let frame = this.convolve(this.lastFrame, this.kernel);
                frame = this.applyGrowth(frame, this.growthCenter, this.growthWidth, this.dt);
                frame = this.pointwiseAdd(frame, this.lastFrame);
                this.lastFrame.delete();
                this.lastFrame = frame;
                this.render(this.lastFrame);
            }
            (_a = this.frameCounter) === null || _a === void 0 ? void 0 : _a.countFrame();
            if (!this.termSignal) {
                requestAnimationFrame(this.animate);
            }
        };
        this.fft2d = (matrix) => {
            let pass;
            let texture = this.bitReverseVertical(matrix);
            for (let n = 2; n <= this.size; n *= 2) {
                texture = this.FFTPassVertical(pass = texture, n);
                pass.delete();
            }
            texture = this.bitReverseHorizontal(texture);
            for (let n = 2; n <= this.size; n *= 2) {
                texture = (this.FFTPassHorizontal(pass = texture, n));
                pass.delete();
            }
            return texture;
        };
        this.invfft2d = (matrix) => {
            let pass;
            let texture = matrix;
            for (let n = this.size; n >= 2; n /= 2) {
                texture = this.invFFTPassHorizontal(pass = texture, n);
                pass.delete();
            }
            texture = this.bitReverseHorizontal(texture);
            for (let n = this.size; n >= 2; n /= 2) {
                texture = this.invFFTPassVertical(pass = texture, n);
                pass.delete();
            }
            texture = this.bitReverseVertical(texture);
            return texture;
        };
        this.convolve = (matrix, kernel) => {
            let texture = this.fft2d(matrix);
            texture = this.pointwiseMul(texture, kernel);
            texture = this.invfft2d(texture);
            return texture;
        };
        this.drawGrowthCurve = () => {
            const canvas = document.getElementById('growth-curve');
            canvas.width = 1000;
            canvas.height = 100;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(0, (canvas.height / 2) - (-canvas.height / 2.5));
                for (let x = 0; x < canvas.width; x++) {
                    const y = (canvas.height / 2) - ((canvas.height / 2.5) * (0, fftpipeline_js_1.growthFunction)(x / canvas.width, this.growthCenter, this.growthWidth));
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        };
        this.addEventListeners = () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            (_a = document.getElementById('growth-center')) === null || _a === void 0 ? void 0 : _a.addEventListener('wheel', enableScrollWheel);
            (_b = document.getElementById('growth-center')) === null || _b === void 0 ? void 0 : _b.addEventListener('input', (e) => {
                this.growthCenter = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_c = document.getElementById('growth-width')) === null || _c === void 0 ? void 0 : _c.addEventListener('wheel', enableScrollWheel);
            (_d = document.getElementById('growth-width')) === null || _d === void 0 ? void 0 : _d.addEventListener('input', (e) => {
                this.growthWidth = parseFloat(e.target.value);
                this.drawGrowthCurve();
            });
            (_e = document.getElementById('delta')) === null || _e === void 0 ? void 0 : _e.addEventListener('wheel', enableScrollWheel);
            (_f = document.getElementById('delta')) === null || _f === void 0 ? void 0 : _f.addEventListener('input', (e) => {
                this.dt = Math.pow(parseFloat(e.target.value), 2);
            });
            (_g = document.getElementById('brush-size')) === null || _g === void 0 ? void 0 : _g.addEventListener('wheel', enableScrollWheel);
            (_h = document.getElementById('brush-size')) === null || _h === void 0 ? void 0 : _h.addEventListener('input', (e) => {
                this.brushSize = parseFloat(e.target.value);
            });
            (_j = document.getElementById('scramble')) === null || _j === void 0 ? void 0 : _j.addEventListener('click', () => {
                this.lastFrame = this.randomize();
            });
            (_k = document.getElementById('clear')) === null || _k === void 0 ? void 0 : _k.addEventListener('click', () => {
                this.lastFrame = this.clear();
            });
        };
        this.findNormalization = (kernel) => {
            let sum = 0;
            for (let y = 0; y < kernel.length; y++) {
                for (let x = 0; x < kernel.length; x++) {
                    sum += kernel[y][x][0];
                }
            }
            return 1 / sum;
        };
        const { FFTPassVertical, FFTPassHorizontal, invFFTPassVertical, invFFTPassHorizontal } = (0, fftpipeline_js_1.createFFTPass)(size);
        this.FFTPassVertical = FFTPassVertical;
        this.FFTPassHorizontal = FFTPassHorizontal;
        this.invFFTPassVertical = invFFTPassVertical;
        this.invFFTPassHorizontal = invFFTPassHorizontal;
        const { bitReverseVertical, bitReverseHorizontal } = (0, fftpipeline_js_1.createBitReverse)(size);
        this.bitReverseVertical = bitReverseVertical;
        this.bitReverseHorizontal = bitReverseHorizontal;
        this.pointwiseAdd = (0, fftpipeline_js_1.createPointwiseAdd)(size);
        this.pointwiseMul = (0, fftpipeline_js_1.createPointwiseMul)(size);
        this.matrixMul = (0, fftpipeline_js_1.createMatrixMul)(size);
        this.applyGrowth = (0, fftpipeline_js_1.createApplyGrowth)(size);
        this.render = (0, fftpipeline_js_1.createRender)(size);
        this.draw = (0, fftpipeline_js_1.createDraw)(size);
        this.randomize = (0, fftpipeline_js_1.createRandomize)(size);
        this.clear = (0, fftpipeline_js_1.createClear)(size);
        this.generateKernel = (0, fftpipeline_js_1.createGenerateKernel)(size);
        const kernel = this.generateKernel([1.0, 0.7, 0.3], 2, 0.1, 80);
        const normalizationFactor = this.findNormalization(kernel.toArray());
        this.kernel = this.fft2d(this.matrixMul(kernel, normalizationFactor));
        this.lastFrame = this.randomize();
        document.addEventListener('contextmenu', event => event.preventDefault());
        const canvas = this.render.canvas;
        (_a = document.getElementById('lenia-container')) === null || _a === void 0 ? void 0 : _a.appendChild(canvas);
        canvas.onmousedown = (e) => {
            this.mousePressed = true;
            let x = Math.floor((e.offsetX / e.target.offsetWidth) * this.size);
            let y = Math.floor((e.offsetY / e.target.offsetHeight) * this.size);
            const newFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2);
            this.lastFrame.delete();
            this.lastFrame = newFrame;
        };
        canvas.onmousemove = (e) => {
            if (!this.mousePressed)
                return;
            let x = Math.floor((e.offsetX / e.target.offsetWidth) * this.size);
            let y = Math.floor((e.offsetY / e.target.offsetHeight) * this.size);
            const newFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2);
            this.lastFrame.delete();
            this.lastFrame = newFrame;
        };
        canvas.onmouseup = () => {
            this.mousePressed = false;
        };
        canvas.onmouseleave = () => {
            this.mousePressed = false;
        };
        canvas.onmouseenter = (e) => {
            if (e.buttons === 1 || e.buttons === 2)
                this.mousePressed = true;
        };
        canvas.ondblclick = () => {
            this.termSignal = true;
        };
        this.addEventListeners();
        this.drawGrowthCurve();
        this.frameCounter = countFrames ? new framecounter_js_1.FrameCounter() : undefined;
    }
}
exports.Lenia = Lenia;
function enableScrollWheel(e) {
    var _a;
    if (e.deltaY < 0) {
        e.target.stepUp();
    }
    else {
        e.target.stepDown();
    }
    e.preventDefault();
    e.stopPropagation();
    const event = new Event('input', { bubbles: true, cancelable: true });
    (_a = e.target) === null || _a === void 0 ? void 0 : _a.dispatchEvent(event);
}
