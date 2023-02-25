
function createGrowthFunction(center: number, width: number, shape: FunctionShape): (value: number) => number {

    switch (shape as FunctionShape) {
        case FunctionShape.RECTANGLE:
            return (value: number) => {
                return Math.abs(value - center) < width ? 1 : -1
            }

        case FunctionShape.POLYNOMIAL:
            const alpha = 4
            const sigma = 9 * (width ** 2)
            return (value: number) => {
                if (Math.abs(value - center) < 3.0 * width) {
                    return 2 * ((1 - ((value - center) ** 2) / sigma) ** alpha) - 1.0
                } else {
                    return -1
                }
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