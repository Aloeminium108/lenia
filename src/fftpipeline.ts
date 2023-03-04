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

function createRender(matrixSize: number) {

    const render = gpu.createKernel(function (
        matrix: number[][][]
    ) {
        const point = matrix[this.thread.y][this.thread.x]
        this.color(0, 0, point[0], 255)
    })
        .setOutput([matrixSize, matrixSize])
        .setGraphical(true)
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
        .setConstants({ halfPoint: matrixSize / 2 })

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

    return clear

}

function createTestPipeline(matrixSize: number) {

    const test1 = gpu.createKernel(function(
        matrix: number[]
    ) {
        return matrix[this.thread.x] + 1
    })
        .setOutput([matrixSize])
        .setPipeline(true)
        .setImmutable(true)

    const test2 = gpu.createKernel(function(
        matrix: number[]
    ) {
        return matrix[this.thread.x] + 5
    })
        .setOutput([matrixSize])
        .setPipeline(true)
        .setImmutable(true)

    return { test1, test2 }

}

// ----------------------------------------------
// -------------- Inner functions ---------------
// ----------------------------------------------

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
    createTestPipeline,
    growthFunction,
    ctx
}