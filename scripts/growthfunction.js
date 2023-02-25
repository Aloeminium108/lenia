"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionShape = exports.createGrowthFunction = void 0;
function createGrowthFunction(center, width, shape) {
    switch (shape) {
        case FunctionShape.RECTANGLE:
            return (value) => {
                return Math.abs(value - center) < width ? 1 : -1;
            };
        case FunctionShape.POLYNOMIAL:
            const alpha = 4;
            const sigma = 9 * (Math.pow(width, 2));
            return (value) => {
                if (Math.abs(value - center) < 3.0 * width) {
                    return 2 * (Math.pow((1 - (Math.pow((value - center), 2)) / sigma), alpha)) - 1.0;
                }
                else {
                    return -1;
                }
            };
        default:
            return (value) => {
                return Math.abs(value - center) < width ? 1 : -1;
            };
    }
}
exports.createGrowthFunction = createGrowthFunction;
var FunctionShape;
(function (FunctionShape) {
    FunctionShape[FunctionShape["RECTANGLE"] = 0] = "RECTANGLE";
    FunctionShape[FunctionShape["POLYNOMIAL"] = 1] = "POLYNOMIAL";
    FunctionShape[FunctionShape["EXPONENTIAL"] = 2] = "EXPONENTIAL";
})(FunctionShape || (FunctionShape = {}));
exports.FunctionShape = FunctionShape;
