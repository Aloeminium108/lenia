"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KernelParams = exports.Lenia = void 0;
const framecounter_js_1 = require("./framecounter.js");
const fftpipeline_js_1 = require("./fftpipeline.js");
//const ext = ctx.getExtension('GMAN_webgl_memory')
const referenceXYZ = {
    A: [111.144, 100, 35.2],
    B: [99.178, 100, 84.3493],
    C: [97.285, 100, 116.145],
    D50: [96.720, 100, 81.427],
    D55: [95.799, 100, 90.926],
    D65: [94.811, 100, 107.304],
    D75: [94.416, 100, 120.641],
    E: [100, 100, 100],
    F1: [94.791, 100, 103.191],
    F2: [103.280, 100, 69.026],
    F3: [108.968, 100, 51.965],
    F4: [114.961, 100, 40.963],
    F5: [93.369, 100, 98.636],
    F6: [102.148, 100, 62.074],
    F7: [95.792, 100, 107.687],
    F8: [97.115, 100, 81.135],
    F9: [102.116, 100, 67.826],
    F10: [99.001, 100, 83.134],
    F11: [103.866, 100, 65.627],
    F12: [111.428, 100, 40.353],
};
class Lenia {
    constructor(size, growthCenter, growthWidth, kernelParams, countFrames = false) {
        var _a;
        this.size = size;
        this.growthCenter = growthCenter;
        this.growthWidth = growthWidth;
        this.kernelParams = kernelParams;
        this.dt = 0.05;
        this.mousePressed = false;
        this.brushSize = 10;
        this.termSignal = false;
        this.animate = () => {
            var _a;
            let pass;
            let frame = this.convolve(this.lastFrame, this.kernel);
            pass = this.applyGrowth(frame, this.growthCenter, this.growthWidth, this.dt);
            frame.delete();
            frame = pass;
            pass = this.pointwiseAdd(frame, this.lastFrame);
            frame.delete();
            frame = pass;
            this.lastFrame.delete();
            this.lastFrame = frame;
            this.render(this.lastFrame);
            // if (ext) {
            //     const info = ext.getMemoryInfo()
            //     console.log("this.lastFrame rendered:", info.resources.texture)
            // }
            (_a = this.frameCounter) === null || _a === void 0 ? void 0 : _a.countFrame();
            if (!this.termSignal) {
                requestAnimationFrame(this.animate);
            }
        };
        this.fft2d = (matrix) => {
            let pass;
            let texture = matrix.clone();
            pass = this.bitReverseVertical(texture);
            texture.delete();
            texture = pass;
            for (let n = 2; n <= this.size; n *= 2) {
                pass = this.FFTPassVertical(texture, n);
                texture.delete();
                texture = pass;
            }
            pass = this.bitReverseHorizontal(texture);
            texture.delete();
            texture = pass;
            for (let n = 2; n <= this.size; n *= 2) {
                pass = (this.FFTPassHorizontal(texture, n));
                texture.delete();
                texture = pass;
            }
            return texture;
        };
        this.invfft2d = (matrix) => {
            let pass;
            let texture = matrix;
            for (let n = this.size; n >= 2; n /= 2) {
                pass = this.invFFTPassHorizontal(texture, n);
                texture.delete();
                texture = pass;
            }
            pass = this.bitReverseHorizontal(texture);
            texture.delete();
            texture = pass;
            for (let n = this.size; n >= 2; n /= 2) {
                pass = this.invFFTPassVertical(texture, n);
                texture.delete();
                texture = pass;
            }
            pass = this.bitReverseVertical(texture);
            texture.delete();
            texture = pass;
            return texture;
        };
        this.convolve = (matrix, kernel) => {
            let pass;
            let texture = this.FFTShift(matrix);
            pass = this.fft2d(texture);
            texture.delete();
            texture = pass;
            pass = this.pointwiseMul(texture, kernel);
            texture.delete();
            texture = pass;
            pass = this.invfft2d(texture);
            texture.delete();
            texture = pass;
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
        this.drawKernel = () => {
            const canvas = document.getElementById('kernel-display');
            canvas.width = this.kernelParams.radius * 2;
            canvas.height = this.kernelParams.radius * 2;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const kernelPixels = this.kernelImage.toArray();
                const offset = this.size / 2 - this.kernelParams.radius;
                for (let x = 0; x < canvas.width; x++) {
                    for (let y = 0; y < canvas.height; y++) {
                        const color = (0, fftpipeline_js_1.colorInterpolation)(Math.pow(kernelPixels[y + offset][x + offset][0], this.colorParams.exponent), this.colorParams.midPoint, this.colorParams.minColor, this.colorParams.midColor, this.colorParams.maxColor, this.colorParams.reference);
                        ctx.fillStyle = `rgb(
                        ${Math.floor(color[0])},
                        ${Math.floor(color[1])},
                        ${Math.floor(color[2])}
                    )`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
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
                this.lastFrame.delete();
                this.lastFrame = this.randomize();
            });
            (_k = document.getElementById('clear')) === null || _k === void 0 ? void 0 : _k.addEventListener('click', () => {
                this.lastFrame.delete();
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
        this.regenerateKernel = () => {
            this.kernelImage.delete();
            this.kernelImage = this.generateKernel(this.kernelParams.betas, this.kernelParams.bRank, this.kernelParams.coreWidth, this.kernelParams.radius);
            const normalizationFactor = this.findNormalization((this.kernelImage).toArray());
            this.kernel.delete();
            this.kernel = this.fft2d(this.matrixMul(this.kernelImage, normalizationFactor));
            this.drawKernel();
        };
        const { FFTPassVertical, FFTPassHorizontal, invFFTPassVertical, invFFTPassHorizontal } = (0, fftpipeline_js_1.createFFTPass)(size);
        this.FFTPassVertical = FFTPassVertical;
        this.FFTPassHorizontal = FFTPassHorizontal;
        this.invFFTPassVertical = invFFTPassVertical;
        this.invFFTPassHorizontal = invFFTPassHorizontal;
        const { bitReverseVertical, bitReverseHorizontal } = (0, fftpipeline_js_1.createBitReverse)(size);
        this.bitReverseVertical = bitReverseVertical;
        this.bitReverseHorizontal = bitReverseHorizontal;
        this.FFTShift = (0, fftpipeline_js_1.createFFTShift)(size);
        this.pointwiseAdd = (0, fftpipeline_js_1.createPointwiseAdd)(size);
        this.pointwiseMul = (0, fftpipeline_js_1.createPointwiseMul)(size);
        this.matrixMul = (0, fftpipeline_js_1.createMatrixMul)(size);
        this.applyGrowth = (0, fftpipeline_js_1.createApplyGrowth)(size);
        const reference = referenceXYZ.B;
        this.colorParams = {
            midPoint: 0.5,
            minColor: (0, fftpipeline_js_1.RGBtoMSH)([2, 16, 68], reference),
            midColor: (0, fftpipeline_js_1.RGBtoMSH)([93, 6, 255], reference),
            maxColor: (0, fftpipeline_js_1.RGBtoMSH)([255, 255, 255], reference),
            reference: reference,
            exponent: 1
        };
        this.render = (0, fftpipeline_js_1.createRender)(size, this.colorParams);
        this.draw = (0, fftpipeline_js_1.createDraw)(size);
        this.randomize = (0, fftpipeline_js_1.createRandomize)(size);
        this.clear = (0, fftpipeline_js_1.createClear)(size);
        this.generateKernel = (0, fftpipeline_js_1.createGenerateKernel)(size);
        this.kernelImage = this.generateKernel(this.kernelParams.betas, this.kernelParams.bRank, this.kernelParams.coreWidth, this.kernelParams.radius);
        const normalizationFactor = this.findNormalization((this.kernelImage).toArray());
        this.kernel = this.fft2d(this.matrixMul(this.kernelImage, normalizationFactor));
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
        this.addEventListeners();
        this.drawGrowthCurve();
        this.drawKernel();
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
class KernelParams {
    constructor(_betas, _coreWidth, _radius) {
        this._betas = _betas;
        this._coreWidth = _coreWidth;
        this._radius = _radius;
        this._bRank = _betas.length - 1;
    }
    get betas() {
        return this._betas;
    }
    get bRank() {
        return this._bRank;
    }
    get coreWidth() {
        return this._coreWidth;
    }
    get radius() {
        return this._radius;
    }
}
exports.KernelParams = KernelParams;
