"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionShape = exports.generateKernel = void 0;
function generateKernel(betas, coreWidth, radius, shape) {
    const b_rank = betas.length - 1;
    const kernel_core = generateCore(coreWidth, shape);
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
function generateCore(coreWidth, shape) {
    switch (shape) {
        case FunctionShape.RECTANGLE:
        case FunctionShape.POLYNOMIAL:
            const alpha = 4;
            return (distance) => {
                return Math.pow((4 * distance * (1 - distance)), alpha);
            };
        default:
            return (value) => {
                return Math.abs(value - 0.5) < coreWidth ? 1 : 0;
            };
    }
}
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
var FunctionShape;
(function (FunctionShape) {
    FunctionShape[FunctionShape["RECTANGLE"] = 0] = "RECTANGLE";
    FunctionShape[FunctionShape["POLYNOMIAL"] = 1] = "POLYNOMIAL";
    FunctionShape[FunctionShape["EXPONENTIAL"] = 2] = "EXPONENTIAL";
})(FunctionShape || (FunctionShape = {}));
exports.FunctionShape = FunctionShape;
