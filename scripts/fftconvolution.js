import { complexAdd, complexDiv, complexMul, complexSub, eulerExp } from "./complex.js";
function FFTConvolution(vector, kernel) {
    const fftKernel = FFT(kernel.reverse());
    const fftMatrix = FFT(vector);
    const output = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
        output[i] = complexMul(fftKernel[i], fftMatrix[i]);
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
        const factor = complexDiv(eulerExp(angle * -k), 2);
        const y0 = vector[k];
        const y1 = vector[k + N / 2];
        vector[k] = complexDiv(complexAdd(y0, y1), 2);
        vector[k + N / 2] = complexMul(complexSub(y0, y1), factor);
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
        const factor = complexMul(eulerExp(angle * k), odd[k]);
        vector[k] = complexAdd(even[k], factor);
        vector[k + N / 2] = complexSub(even[k], factor);
    }
}
export { FFTConvolution };
