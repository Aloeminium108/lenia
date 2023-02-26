"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.growthFunction = exports.createRenderFunction = exports.createUpdateFunction = void 0;
const index_js_1 = require("/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js");
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('webgl2');
const gpu = new index_js_1.GPU({ canvas: canvas, context: ctx });
function growthFunction(value, center, width) {
    if (Math.abs(value - center) < 3.0 * width) {
        return 2 * (Math.pow((1 - (Math.pow((value - center), 2)) / (9 * Math.pow(width, 2))), 4)) - 1.0;
    }
    else {
        return -1;
    }
}
exports.growthFunction = growthFunction;
function createUpdateFunction(matrixSize) {
    gpu.addFunction(growthFunction);
    const update = gpu.createKernel(function (matrix, m_Size, kernel, k_Size, dt, center, width) {
        const radius = Math.floor(k_Size / 2);
        let sum = 0;
        for (let x = 0; x < k_Size; x++) {
            for (let y = 0; y < k_Size; y++) {
                let i = (this.thread.y) - (x - radius);
                i = (i + m_Size) % m_Size;
                let j = (this.thread.x) - (y - radius);
                j = (j + m_Size) % m_Size;
                sum += kernel[x][y] * matrix[i][j];
            }
        }
        return Math.min(Math.max((dt * growthFunction(sum, center, width) + matrix[this.thread.y][this.thread.x]), 0), 1);
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true);
    return update;
}
exports.createUpdateFunction = createUpdateFunction;
function createRenderFunction(matrixSize) {
    const render = gpu.createKernel(function (matrix) {
        this.color(0, 0, matrix[this.thread.x][this.thread.y], 255);
    })
        .setOutput([matrixSize, matrixSize])
        .setGraphical(true);
    return render;
}
exports.createRenderFunction = createRenderFunction;
