"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGPUConvolution = void 0;
const index_js_1 = require("/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js");
const gpu = new index_js_1.GPU();
function createGPUConvolution(matrixSize) {
    const gpuConvolve = gpu.createKernel(function (matrix, m_Size, kernel, k_Size) {
        let sum = 0;
        for (let x = 0; x < k_Size; x++) {
            for (let y = 0; y < k_Size; y++) {
                let i = (this.thread.y) - (x - Math.floor(k_Size / 2));
                i = (i + m_Size) % m_Size;
                let j = (this.thread.x) - (y - Math.floor(k_Size / 2));
                j = (j + m_Size) % m_Size;
                sum += kernel[x][y] * matrix[i][j];
            }
        }
        return sum;
    }).setOutput([matrixSize, matrixSize]);
    return gpuConvolve;
}
exports.createGPUConvolution = createGPUConvolution;
