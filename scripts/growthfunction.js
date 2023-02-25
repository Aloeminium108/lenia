"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionShape = exports.createGrowthFunction = void 0;
function createGrowthFunction(center, width, shape) {
    switch (shape) {
        case FunctionShape.RECTANGLE:
            return (value) => {
                return Math.abs(value - center) < width ? 1 : -1;
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
