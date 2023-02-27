"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findScale = exports.generateKernel = void 0;
function generateKernel(betas, coreWidth, radius) {
    const b_rank = betas.length - 1;
    const kernel_core = (distance) => {
        return Math.pow((4 * distance * (1 - distance)), coreWidth);
    };
    const kernelSkeleton = (distance) => {
        let beta = betas[Math.floor(distance * b_rank)];
        return beta * kernel_core((distance * (b_rank + 1)) % 1);
    };
    const points = [];
    for (let x = 0; x < radius * 2 + 1; x++) {
        points[x] = [];
        for (let y = 0; y < radius * 2 + 1; y++) {
            const dx = x - radius;
            const dy = y - radius;
            const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            points[x][y] = distance <= radius ? kernelSkeleton(distance / radius) : 0;
        }
    }
    normalize(points);
    return points;
}
exports.generateKernel = generateKernel;
function normalize(kernel) {
    let sum = 0;
    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            sum += kernel[x][y];
        }
    }
    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            kernel[x][y] /= sum;
        }
    }
}
function findScale(kernel) {
    let max = 0;
    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            max = kernel[x][y] > max ? kernel[x][y] : max;
        }
    }
    return 255 / max;
}
exports.findScale = findScale;
