import { GPU } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('webgl2')!!

const gpu = new GPU({canvas: canvas, context: ctx })
gpu.addFunction(kernel_core)
gpu.addFunction(growthFunction)
gpu.addFunction(bitReverse)

gpu.addFunction(complexAdd, { argumentTypes: {a: 'Array(2)', b: 'Array(2)'}, returnType: 'Array(2)' })
gpu.addFunction(complexSub, { argumentTypes: {a: 'Array(2)', b: 'Array(2)'}, returnType: 'Array(2)' })
gpu.addFunction(complexMul, { argumentTypes: {a: 'Array(2)', b: 'Array(2)'}, returnType: 'Array(2)' })
gpu.addFunction(complexDiv, { argumentTypes: {a: 'Array(2)', b: 'Float'}, returnType: 'Array(2)' })
gpu.addFunction(eulerExp, { argumentTypes: {x: 'Float'}, returnType: 'Array(2)' })

gpu.addFunction(colorInterpolation,
    { argumentTypes: { 
        distance: 'Float',
        midPoint: 'Float',
        minColor: 'Array(3)',
        maxColor: 'Array(3)',
        midColor: 'Array(3)',
        reference: 'Array(3)'
    }, returnType: 
        'Array(3)'
    })
gpu.addFunction(MSHtoRGB,
    { argumentTypes: { 
        color: 'Array(3)',
        reference: 'Array(3)'
    }, returnType: 
        'Array(3)'
    })
gpu.addFunction(XYZtoRGB,
    { argumentTypes: { 
        color: 'Array(3)'
    }, returnType: 
        'Array(3)'
    })
gpu.addFunction(LABtoXYZ,
    { argumentTypes: { 
        color: 'Array(3)',
        reference: 'Array(3)'
    }, returnType: 
        'Array(3)'
    })
gpu.addFunction(MSHtoLAB,
    { argumentTypes: { 
        color: 'Array(3)'
    }, returnType: 
        'Array(3)'
    })

function createBitReverse(matrixSize: number) {
    if (Math.log2(matrixSize) % 1 > 0) {
        throw new RangeError('Matrix size must be a power of 2')
    }

    const bitReverseVertical = gpu.createKernel(function(
        matrix: number[][][]
    ) {
        const index = bitReverse(this.thread.x, this.constants.logN as number)
        const value: number[] = matrix[this.thread.y][index]
        return [value[0], value[1]]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ logN: Math.log2(matrixSize) })
        .setArgumentTypes({ matrix: 'Array2D(2)' })


    const bitReverseHorizontal = gpu.createKernel(function(
        matrix: number[][][]
    ) {
        const index = bitReverse(this.thread.y, this.constants.logN as number)
        const value = matrix[index][this.thread.x]
        return [value[0], value[1]]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ logN: Math.log2(matrixSize) })
        .setArgumentTypes({ matrix: 'Array2D(2)' })

    return { bitReverseVertical, bitReverseHorizontal }
}

function createFFTShift(matrixSize: number) {

    const FFTShift = gpu.createKernel(function (
        matrix: number[][][]
    ) {
        if (this.thread.y >= this.constants.halfPoint) {
            if (this.thread.x >= this.constants.halfPoint) {
                // QUADRANT 1
                return matrix[this.thread.y - (this.constants.halfPoint as number)][this.thread.x - (this.constants.halfPoint as number)]
            } else {
                // QUADRANT 4
                return matrix[this.thread.y - (this.constants.halfPoint as number)][this.thread.x + (this.constants.halfPoint as number)]
            }
        } else {
            if (this.thread.x >= this.constants.halfPoint) {
                // QUADRANT 2
                return matrix[this.thread.y + (this.constants.halfPoint as number)][this.thread.x - (this.constants.halfPoint as number)]
            } else {
                // QUADRANT 3
                return matrix[this.thread.y + (this.constants.halfPoint as number)][this.thread.x + (this.constants.halfPoint as number)]
            }
        }
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ halfPoint: matrixSize / 2 })
        .setArgumentTypes({ matrix: 'Array2D(2)' })


    return FFTShift

}

function createFFTPass(matrixSize: number) {
    if (Math.log2(matrixSize) % 1 > 0) {
        throw new RangeError('Matrix size must be a power of 2')
    }

    const FFTPassVertical = gpu.createKernel(function(
        matrix: number[][][],
        pass: number,
    ) {
        const halfPoint = pass >> 1
        
        if (this.thread.x % pass < halfPoint) {

            const x0 = matrix[this.thread.y][this.thread.x]
            const x1 = matrix[this.thread.y][this.thread.x + halfPoint]

            const factor = eulerExp(this.constants.angle as number * (this.thread.x % pass) / pass)
            const product = complexMul(x1, factor)

            return complexAdd(x0, product)

        } else {

            const x0 = matrix[this.thread.y][this.thread.x - halfPoint]
            const x1 = matrix[this.thread.y][this.thread.x]

            const factor = eulerExp(this.constants.angle as number * ((this.thread.x % pass) - halfPoint) / pass)
            const product = complexMul(x1, factor)

            return complexSub(x0, product)
        } 

    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ angle: -2 * Math.PI })
        .setArgumentTypes({ matrix: 'Array2D(2)', pass: 'Integer'})


    const FFTPassHorizontal = gpu.createKernel(function(
        matrix: number[][][],
        pass: number,
    ) {
        const halfPoint = pass >> 1
        
        if (this.thread.y % pass < halfPoint) {

            const x0 = matrix[this.thread.y][this.thread.x]
            const x1 = matrix[this.thread.y + halfPoint][this.thread.x]

            const factor = eulerExp(this.constants.angle as number * (this.thread.y % pass) / pass)
            const product = complexMul(x1, factor)

            return complexAdd(x0, product)

        } else {

            const x0 = matrix[this.thread.y - halfPoint][this.thread.x]
            const x1 = matrix[this.thread.y][this.thread.x]

            const factor = eulerExp(this.constants.angle as number * ((this.thread.y % pass) - halfPoint) / pass)
            const product = complexMul(x1, factor)

            return complexSub(x0, product)
        } 

    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ angle: -2 * Math.PI })
        .setArgumentTypes({ matrix: 'Array2D(2)', pass: 'Integer'})

    
    const invFFTPassVertical = gpu.createKernel(function(
        matrix: number[][][],
        pass: number,
    ) {
        const halfPoint = pass >> 1
        
        if (this.thread.x % pass < halfPoint) {

            const y0 = matrix[this.thread.y][this.thread.x]
            const y1 = matrix[this.thread.y][this.thread.x + halfPoint]

            return complexDiv(complexAdd(y0, y1), 2)

        } else {

            const y0 = matrix[this.thread.y][this.thread.x - halfPoint]
            const y1 = matrix[this.thread.y][this.thread.x]

            const factor = complexDiv(eulerExp(this.constants.angle as number * ((this.thread.x % pass) - halfPoint) / pass), 2)

            return complexMul(factor, complexSub(y0, y1))
        } 

    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ angle: 2 * Math.PI })
        .setArgumentTypes({ matrix: 'Array2D(2)', pass: 'Integer'})
    

    const invFFTPassHorizontal = gpu.createKernel(function(
        matrix: number[][][],
        pass: number,
    ) {
        const halfPoint = pass >> 1
        
        if (this.thread.y % pass < halfPoint) {

            const y0 = matrix[this.thread.y][this.thread.x]
            const y1 = matrix[this.thread.y + halfPoint][this.thread.x]

            return complexDiv(complexAdd(y0, y1), 2)

        } else {

            const y0 = matrix[this.thread.y - halfPoint][this.thread.x]
            const y1 = matrix[this.thread.y][this.thread.x]

            const factor = complexDiv(eulerExp(this.constants.angle as number * ((this.thread.y % pass) - halfPoint) / pass), 2)

            return complexMul(factor, complexSub(y0, y1))
        } 

    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setConstants({ angle: 2 * Math.PI })
        .setArgumentTypes({ matrix: 'Array2D(2)', pass: 'Integer'})
    

    return { FFTPassVertical, FFTPassHorizontal, invFFTPassVertical, invFFTPassHorizontal}

}

function createPointwiseAdd(matrixSize: number) {

    const pointwiseMul = gpu.createKernel(function (
        matrixA: number[][][],
        matrixB: number[][][]
    ) {
        const value = complexAdd(matrixA[this.thread.y][this.thread.x], matrixB[this.thread.y][this.thread.x])
        return [
            Math.min(Math.max(value[0], 0), 1),
            0
        ]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setArgumentTypes({ matrixA: 'Array2D(2)', matrixB: 'Array2D(2)' })
    
    return pointwiseMul

}

function createPointwiseMul(matrixSize: number) {

    const pointwiseMul = gpu.createKernel(function (
        matrixA: number[][][],
        matrixB: number[][][]
    ) {
        return complexMul(
            matrixA[this.thread.y][this.thread.x], 
            matrixB[this.thread.y][this.thread.x]
        )
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setArgumentTypes({ matrixA: 'Array2D(2)', matrixB: 'Array2D(2)' })
    
    return pointwiseMul

}

function createMatrixMul(matrixSize: number) {

    const matrixMul = gpu.createKernel(function (
        matrix: number[][][],
        x: number
    ) {
        return complexMul(matrix[this.thread.y][this.thread.x], [x, 0])
    })        
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setArgumentTypes({ matrix: 'Array2D(2)', x: 'Float' })

    return matrixMul

}

function createApplyGrowth(matrixSize: number) {
    const applyGrowth = gpu.createKernel(function (
        matrix: number[][][],
        center: number,
        width: number,
        dt: number
    ) {
        const point = matrix[this.thread.y][this.thread.x]
        return [
            dt * growthFunction(point[0], center, width), 
            point[1]
        ]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setArgumentTypes({ 
            matrix: 'Array2D(2)', 
            center: 'Float', 
            width: 'Float', 
            dt: 'Float' 
        })
    
    return applyGrowth
}

function createRender(
    matrixSize: number,
    midPoint: number,
    minColor: number[], 
    maxColor: number[], 
    midColor: number[],
    reference: number[]
) {

    const render = gpu.createKernel(function (
        matrix: number[][][]
    ) {
        const point = matrix[this.thread.y][this.thread.x]
        const color = colorInterpolation(
            point[0],
            this.constants.midPoint as number,
            this.constants.minColor as number[],
            this.constants.maxColor as number[],
            this.constants.midColor as number[],
            this.constants.reference as number[],
        )
        this.color(color[0]/255, color[1]/255, color[2]/255, 255)
    })
        .setOutput([matrixSize, matrixSize])
        .setGraphical(true)
        .setConstants({
            midPoint: midPoint,
            minColor: minColor, 
            maxColor: maxColor, 
            midColor: midColor,
            reference: reference
        })
        .setConstantTypes({
            midPoint: 'Float',
            minColor: 'Array(3)', 
            maxColor: 'Array(3)', 
            midColor: 'Array(3)',
            reference: 'Array(3)'
        })
        .setArgumentTypes({ matrix: 'Array2D(2)' })
    
    return render

}

function createDraw(matrixSize: number) {

    const draw = gpu.createKernel(function (
        matrix: number[][][], 
        x: number,
        y: number,
        radius: number,
        brush: number
    ) {
        const distX = x - this.thread.x
        const distY = y - this.thread.y
        const distance = Math.sqrt(distX ** 2 + distY ** 2)

        return distance <= radius ? [brush, 0] : matrix[this.thread.y][this.thread.x]

    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)
        .setArgumentTypes({ 
            matrix: 'Array2D(2)',
            x: 'Float',
            y: 'Float',
            radius: 'Float',
            brush: 'Float' 
        })

    return draw
   
}

function createGenerateKernel(matrixSize: number) {

    const generateKernel = gpu.createKernel(function (
        betas: number[],
        b_rank: number,
        coreWidth: number, 
        radius: number
    ) {
    
        const dx = this.thread.x - (this.constants.halfPoint as number)
        const dy = this.thread.y - (this.constants.halfPoint as number)

        const distance = Math.sqrt(dx ** 2 + dy ** 2) / radius

        if (distance < 1) {
            const beta = betas[Math.floor(distance * b_rank)]
            const output = beta * kernel_core((distance * (b_rank + 1)) % 1, coreWidth)
            return [output, 0]
        } else {
            return [0, 0]
        }
    
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setConstants({ halfPoint: (matrixSize / 2) })

    return generateKernel

}

function createRandomize(matrixSize: number) {

    const randomize = gpu.createKernel(function() {
        const rand = Math.random()
        return [rand, 0]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)

    return randomize

}

function createClear(matrixSize: number) {

    const clear = gpu.createKernel(function() {
        return [0, 0]
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)

    return clear

}

// ----------------------------------------------
// -------------- Inner functions ---------------
// ----------------------------------------------

function colorInterpolation(
    distance: number, 
    midPoint: number,
    minColor: number[], 
    maxColor: number[], 
    midColor: number[],
    reference: number[]
) {

    let M1 = [0, 0, 0]
    let M2 = [0, 0, 0]

    let interp = distance

    if (interp < midPoint) {
        M1 = minColor
        M2 = midColor
        interp /= midPoint
    } else {
        M1 = midColor
        M2 = maxColor
        interp -= midPoint
        interp /= (1 - midPoint)
    }


    const color = [
        (1 - interp) * M1[0] + interp * M2[0],
        (1 - interp) * M1[1] + interp * M2[1],
        (1 - interp) * M1[2] + interp * M2[2],
    ]

    return MSHtoRGB(color, reference)
}

function MSHtoRGB(color: number[], reference: number[]) {
    return XYZtoRGB(LABtoXYZ(MSHtoLAB(color), reference))
}

function RGBtoMSH(color: number[], reference: number[]) {
    return LABtoMSH(XYZtoLAB(RGBtoXYZ(color), reference))
}

function RGBtoXYZ(color: number[]): number[] {
    let R = ( color[0] / 255 )
    let G = ( color[1] / 255 )
    let B = ( color[2] / 255 )

    R = R > 0.04045 ? 
        ((R + 0.055) / 1.055) ** 2.4 :
        R / 12.92

    G = G > 0.04045 ?
        ((G + 0.055) / 1.055) ** 2.4 :
        G / 12.92
    
    B = B > 0.04045 ?
        ((B + 0.055) / 1.055) ** 2.4 :
        B / 12.92

    R *= 100
    G *= 100
    B *= 100

    return [
        R * 0.4124 + G * 0.3576 + B * 0.1805,
        R * 0.2126 + G * 0.7152 + B * 0.0722,
        R * 0.0193 + G * 0.1192 + B * 0.9505
    ]
}

function XYZtoRGB(color: number[]): number[] {
    const X = color[0] / 100
    const Y = color[1] / 100
    const Z = color[2] / 100
    
    let R = X *  3.2406 + Y * -1.5372 + Z * -0.4986
    let G = X * -0.9689 + Y *  1.8758 + Z *  0.0415
    let B = X *  0.0557 + Y * -0.2040 + Z *  1.0570

    R = R > 0.0031308 ?
        1.055 * (R ** (1 / 2.4)) - 0.055 :
        R * 12.92
    
    G = G > 0.0031308 ?
        1.055 * (G ** (1 / 2.4)) - 0.055 :
        G * 12.92
    
    B = B > 0.0031308 ?
        1.055 * (B ** (1 / 2.4)) - 0.055 :
        B * 12.92
    
    return [
        R * 255,
        G * 255,
        B * 255
    ]
}

function XYZtoLAB(color: number[], reference: number[]): number[] {
    let X = color[0] / reference[0]
    let Y = color[1] / reference[1]
    let Z = color[2] / reference[2]

    X = X > 0.008856 ?
        X ** (1/3) :
        (7.787 * X) + (16 / 116)
        
    Y = Y > 0.008856 ?
        Y ** (1/3) :
        (7.787 * Y) + (16 / 116)

    Z = Z > 0.008856 ?
        Z ** (1/3) :
        (7.787 * Z) + (16 / 116)

    return [
        (116 * Y) - 16,
        500 * (X - Y),
        200 * (Y - Z)
    ]
}

function LABtoXYZ(color: number[], reference: number[]): number[] {
    
    let Y = (color[0] + 16) / 116
    let X = color[1] / 500 + Y
    let Z = Y - color[2] / 200

    X = X ** 3 > 0.008856 ?
        X ** 3 :
        (X - 16 / 116) / 7.787
    
    Y = Y ** 3 > 0.008856 ?
        Y ** 3 :
        (Y - 16 / 116) / 7.787

    Z = Z ** 3 > 0.008856 ?
        Z ** 3 :
        (Z - 16 / 116) / 7.787


    return [
        X * reference[0],
        Y * reference[1],
        Z * reference[2]
    ]
}

function LABtoMSH(color: number[]): number[] {
    const M = Math.sqrt(color[0] ** 2 + color[1] ** 2 + color[2] ** 2)

    const factor1 = color[1] < 0 || color[2] < 0 ?
        -1 :
        1

    const factor2 = color[1] > 0 && color[2] < 0 ?
        -1 :
        1

    return [
        M,
        Math.acos(color[0] / M) * factor1 * factor2,
        Math.atan(color[2] / color[1])
    ]
}

function MSHtoLAB(color: number[]): number[] {
    return [
        color[0] * Math.cos(color[1]),
        color[0] * Math.sin(color[1]) * Math.cos(color[2]),
        color[0] * Math.sin(color[1]) * Math.sin(color[2])
    ]
}

function kernel_core(distance: number, coreWidth: number) {
    return (4 * distance * (1 - distance)) ** coreWidth
}

function growthFunction(value: number, center: number, width: number) {
    if (Math.abs(value - center) < 3.0 * width) {
        return 2 * ((1 - ((value - center) ** 2) / (9 * width ** 2)) ** 4) - 1.0
    } else {
        return -1
    }
}

function bitReverse(index: number, n: number) {

    let result = 0;

    for (let i = n; i > 0; i--) {
        result = result << 1
        result += index & 1
        index = index >> 1
    }

    return result;

}

function complexAdd(a: number[], b: number[]) {
    return [
        a[0] + b[0],
        a[1] + b[1]
    ]
}

function complexSub(a: number[], b: number[]) {
    return [
        a[0] - b[0],
        a[1] - b[1]
    ]
}

function complexMul(a: number[], b: number[]) {
    return [
        (a[0] * b[0]) - (a[1] * b[1]),
        (a[1] * b[0]) + (a[0] * b[1])
    ]
}

function complexDiv(a: number[], b: number) {
    return [
        a[0] / b,
        a[1] / b
    ]
}

function eulerExp(x: number) {
    return [Math.cos(x), Math.sin(x)]
}

export { 
    createBitReverse, 
    createFFTShift,
    createFFTPass, 
    createApplyGrowth, 
    createPointwiseAdd,
    createPointwiseMul,
    createMatrixMul,
    createRender,
    createDraw,
    createGenerateKernel,
    createRandomize,
    createClear,
    growthFunction,
    RGBtoMSH,
    ctx
}