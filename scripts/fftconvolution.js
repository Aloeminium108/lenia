"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFT2DConvolution = exports.inverseFFT2D = exports.FFT2D = void 0;
const complex_js_1 = require("./complex.js");
function FFT2DConvolution(matrix, kernel) {
    const fftMatrix = FFT2D(matrix);
    const fftKernel = FFT2D(kernel);
    const output = new Array(matrix.length);
    for (let x = 0; x < matrix.length; x++) {
        output[x] = [];
        for (let y = 0; y < matrix[x].length; y++) {
            output[x][y] = (0, complex_js_1.complexMul)(fftMatrix[x][y], fftKernel[x][y]);
        }
    }
    return inverseFFT2D(output);
}
exports.FFT2DConvolution = FFT2DConvolution;
function FFT2D(matrix) {
    let fftMatrix = [];
    matrix.forEach(column => {
        fftMatrix.push(FFT(column));
    });
    let transposeMatrix = [];
    for (let x = 0; x < fftMatrix.length; x++) {
        transposeMatrix[x] = [];
    }
    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            transposeMatrix[y][x] = fftMatrix[x][y];
        }
    }
    fftMatrix = [];
    transposeMatrix.forEach(column => {
        fftMatrix.push(FFT(column));
    });
    let output = [];
    for (let x = 0; x < fftMatrix.length; x++) {
        output[x] = [];
    }
    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            output[y][x] = fftMatrix[x][y];
        }
    }
    return output;
}
exports.FFT2D = FFT2D;
function inverseFFT2D(matrix) {
    let transposeMatrix = [];
    for (let x = 0; x < matrix.length; x++) {
        transposeMatrix[x] = [];
    }
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[x].length; y++) {
            transposeMatrix[y][x] = matrix[x][y];
        }
    }
    let fftMatrix = [];
    transposeMatrix.forEach(column => {
        fftMatrix.push(inverseFFT(column));
    });
    transposeMatrix = [];
    for (let x = 0; x < fftMatrix.length; x++) {
        transposeMatrix[x] = [];
    }
    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            transposeMatrix[y][x] = fftMatrix[x][y];
        }
    }
    let output = [];
    transposeMatrix.forEach(column => {
        output.push(inverseFFT(column));
    });
    return output;
}
exports.inverseFFT2D = inverseFFT2D;
function FFTConvolution(vector, kernel) {
    const fftKernel = FFT(kernel.reverse());
    const fftMatrix = FFT(vector);
    const output = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
        output[i] = (0, complex_js_1.complexMul)(fftKernel[i], fftMatrix[i]);
    }
    return inverseFFT(output);
}
function inverseFFT(vector) {
    const N = vector.length;
    if (Math.log2(N) % 1 > 0) {
        console.log("Vector must be of length that is a power of 2");
        return [];
    }
    const output = [...vector];
    _inverseFFTRecursive(output);
    return output;
}
function _inverseFFTRecursive(vector) {
    const N = vector.length;
    if (N <= 1)
        return;
    const angle = -2 * Math.PI / N;
    for (let k = 0; k < N / 2; k++) {
        const factor = (0, complex_js_1.complexDiv)((0, complex_js_1.eulerExp)(angle * -k), 2);
        const y0 = vector[k];
        const y1 = vector[k + N / 2];
        vector[k] = (0, complex_js_1.complexDiv)((0, complex_js_1.complexAdd)(y0, y1), 2);
        vector[k + N / 2] = (0, complex_js_1.complexMul)((0, complex_js_1.complexSub)(y0, y1), factor);
    }
    const lower = new Array(N / 2);
    const upper = new Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
        lower[i] = vector[i];
        upper[i] = vector[i + N / 2];
    }
    _inverseFFTRecursive(lower);
    _inverseFFTRecursive(upper);
    for (let i = 0; i < N / 2; i++) {
        vector[2 * i] = lower[i];
        vector[2 * i + 1] = upper[i];
    }
}
function FFT(vector) {
    const N = vector.length;
    if (Math.log2(N) % 1 > 0) {
        console.log("Vector must be of length that is a power of 2");
        return [];
    }
    const output = [...vector];
    _FFTRecursive(output);
    return output;
}
function _FFTRecursive(vector) {
    const N = vector.length;
    if (N <= 1)
        return;
    const even = new Array(N / 2);
    const odd = new Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
        even[i] = vector[2 * i];
        odd[i] = vector[2 * i + 1];
    }
    _FFTRecursive(even);
    _FFTRecursive(odd);
    const angle = -2 * Math.PI / N;
    for (let k = 0; k < N / 2; k++) {
        const factor = (0, complex_js_1.complexMul)((0, complex_js_1.eulerExp)(angle * k), odd[k]);
        vector[k] = (0, complex_js_1.complexAdd)(even[k], factor);
        vector[k + N / 2] = (0, complex_js_1.complexSub)(even[k], factor);
    }
}
