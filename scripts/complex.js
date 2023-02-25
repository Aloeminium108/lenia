"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realToComplex = exports.eulerExp = exports.complexSub = exports.complexMul = exports.complexDiv = exports.complexAdd = void 0;
function complexAdd(a, b) {
    return {
        real: a.real + b.real,
        imag: a.imag + b.imag
    };
}
exports.complexAdd = complexAdd;
function complexSub(a, b) {
    return {
        real: a.real - b.real,
        imag: a.imag - b.imag
    };
}
exports.complexSub = complexSub;
function complexMul(a, b) {
    return {
        real: (a.real * b.real) - (a.imag * b.imag),
        imag: (a.imag * b.real) + (b.imag * a.real)
    };
}
exports.complexMul = complexMul;
function complexDiv(a, b) {
    return {
        real: a.real / b,
        imag: a.imag / b
    };
}
exports.complexDiv = complexDiv;
function eulerExp(x) {
    return {
        real: Math.cos(x),
        imag: Math.sin(x)
    };
}
exports.eulerExp = eulerExp;
function realToComplex(matrix) {
    const output = [];
    for (let x = 0; x < matrix.length; x++) {
        output[x] = [];
        for (let y = 0; y < matrix[x].length; y++) {
            output[x][y] = {
                real: matrix[x][y],
                imag: 0
            };
        }
    }
    return output;
}
exports.realToComplex = realToComplex;
