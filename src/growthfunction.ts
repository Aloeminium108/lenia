
function createGrowthFunction(center: number, width: number, shape: FunctionShape): (value: number) => number {

    switch (shape as FunctionShape) {
        case FunctionShape.RECTANGLE:
            return (value: number) => {
                return Math.abs(value - center) < width ? 1 : -1
            }

        default: 
            return (value: number) => {
                return Math.abs(value - center) < width ? 1 : -1
            }
    }

}

enum FunctionShape {
    RECTANGLE,
    POLYNOMIAL,
    EXPONENTIAL
}

export { createGrowthFunction, FunctionShape }