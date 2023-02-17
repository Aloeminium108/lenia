import { Complex, complexAdd, complexDiv, complexMul, complexSub, eulerExp } from "./complex.js"

function FFT2DConvolution(matrix: Complex[][], kernel: Complex[][]) {
    const fftMatrix = FFT2D(matrix)
    const fftKernel = FFT2D(kernel)

    const output = new Array(matrix.length)

    for (let x = 0; x < matrix.length; x++) {
        output[x] = []
        for (let y = 0; y < matrix[x].length; y++) {
            output[x][y] = complexMul(fftMatrix[x][y], fftKernel[x][y])
        }
    }

    return inverseFFT2D(output)

}

function FFT2D(matrix: Complex[][]) {

    let fftMatrix: Complex[][] = []

    matrix.forEach(column => {
        fftMatrix.push(FFT(column))
    })

    let transposeMatrix: Complex[][] = []

    for (let x = 0; x < fftMatrix.length; x++) {
        transposeMatrix[x] = []
    }

    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            transposeMatrix[y][x] = fftMatrix[x][y]
        }
    }
 
    fftMatrix = []

    transposeMatrix.forEach(column => {
        fftMatrix.push(FFT(column))
    })

    let output: Complex[][] = []

    for (let x = 0; x < fftMatrix.length; x++) {
        output[x] = []
    }

    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            output[y][x] = fftMatrix[x][y]
        }
    }

    return output

}

function inverseFFT2D(matrix: Complex[][]) {

    let transposeMatrix: Complex[][] = []

    for (let x = 0; x < matrix.length; x++) {
        transposeMatrix[x] = []
    }

    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[x].length; y++) {
            transposeMatrix[y][x] = matrix[x][y]
        }
    }

    let fftMatrix: Complex[][] = []

    transposeMatrix.forEach(column => {
        fftMatrix.push(inverseFFT(column))
    })

    transposeMatrix = []

    for (let x = 0; x < fftMatrix.length; x++) {
        transposeMatrix[x] = []
    }

    for (let x = 0; x < fftMatrix.length; x++) {
        for (let y = 0; y < fftMatrix[x].length; y++) {
            transposeMatrix[y][x] = fftMatrix[x][y]
        }
    }

    let output: Complex[][] = []

    transposeMatrix.forEach(column => {
        output.push(inverseFFT(column))
    })

    return output
}

function FFTConvolution(vector: Complex[], kernel: Complex[]) {
    const fftKernel = FFT(kernel.reverse())
    const fftMatrix = FFT(vector)

    const output = new Array(vector.length)

    for (let i = 0; i < vector.length; i++) {
        output[i] = complexMul(fftKernel[i], fftMatrix[i])
    }

    return inverseFFT(output)
}

function inverseFFT(vector: Complex[]) {

    const N = vector.length

    if (Math.log2(N) % 1 > 0) {
        console.log("Vector must be of length that is a power of 2")
        return []
    } 

    const output: Complex[] = [...vector]
    
    _inverseFFTRecursive(output)

    return output

}

function _inverseFFTRecursive(vector: Complex[]) {

    const N = vector.length

    if (N <= 1) return

    const angle = -2 * Math.PI / N

    for (let k = 0; k < N / 2; k++) {
        const factor = complexDiv(eulerExp(angle * -k), 2)
        const y0 = vector[k]
        const y1 = vector[k + N / 2]
        vector[k] = complexDiv(complexAdd(y0, y1), 2)
        vector[k + N / 2] = complexMul(complexSub(y0, y1), factor)
    }

    const lower: Array<Complex> = new Array(N / 2)
    const upper: Array<Complex> = new Array(N / 2)

    for (let i = 0; i < N / 2; i++) {
        lower[i] = vector[i]
        upper[i] = vector[i + N / 2]
    }

    _inverseFFTRecursive(lower)
    _inverseFFTRecursive(upper)

    for (let i = 0; i < N / 2; i++) {
        vector[2 * i] = lower[i]
        vector[2 * i + 1] = upper[i]
    }
}

function FFT(vector: Complex[]) {

    const N = vector.length

    if (Math.log2(N) % 1 > 0) {
        console.log("Vector must be of length that is a power of 2")
        return []
    } 

    const output: Complex[] = [...vector]
    
    _FFTRecursive(output)

    return output

}

function _FFTRecursive(vector: Array<Complex>) {

    const N = vector.length

    if (N <= 1) return

    const even: Array<Complex> = new Array(N / 2)
    const odd: Array<Complex> = new Array(N / 2)

    for (let i = 0; i < N / 2; i++) {
        even[i] = vector[2 * i]
        odd[i] = vector[2 * i + 1]
    }

    _FFTRecursive(even)
    _FFTRecursive(odd)

    const angle = -2 * Math.PI / N

    for (let k = 0; k < N / 2; k++) {
        const factor = complexMul(eulerExp(angle * k), odd[k])
        vector[k] = complexAdd(even[k], factor)
        vector[k + N / 2] = complexSub(even[k], factor)
    }
}

export { FFT2D, inverseFFT2D, FFT2DConvolution }


