function iterativeFFT(array: number[]) {

    const N = array.length
    const logN = Math.log2(N)

    let output = bitReverseIndices(array)

    for (let n = 2; n <= N; n *= 2) {

        const halfPoint = n >> 1
        const angle = -2 * Math.PI / n
        const pass: Complex[] = Array(N)

        for (let i = 0; i < N; i++) {

            if (i % n < halfPoint) {

                const factor = eulerExp(angle * (i % n))

                const x0 = output[i]
                const x1 = complexMul(output[i + halfPoint], factor)

                pass[i] = complexAdd(x0, x1)
                pass[i + halfPoint] = complexSub(x0, x1)
            } 

        }

        output = [...pass]

    }


    return output
}

function bitReverseIndices(array: number[]) {

    const N = array.length
    const logN = Math.log2(N)

    if (logN % 1 > 0) {
        console.log("Vector must be of length that is a power of 2")
        return []
    } 

    let output: Complex[] = []

    array.forEach((value, index) => {
        output[bitReverse(index, logN)] = { real: value, imag: 0 }
    })

    return output

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

interface Complex {
    real: number,
    imag: number
}

function complexAdd(a: Complex, b: Complex): Complex {
    return {
        real: a.real + b.real,
        imag: a.imag + b.imag
    }
}

function complexSub(a: Complex, b: Complex): Complex {
    return {
        real: a.real - b.real,
        imag: a.imag - b.imag
    }
}

function complexMul(a: Complex, b: Complex): Complex {
    return {
        real: (a.real * b.real) - (a.imag * b.imag),
        imag: (a.imag * b.real) + (b.imag * a.real)
    }
}

function complexDiv(a: Complex, b: number): Complex {
    return {
        real: a.real / b,
        imag: a.imag / b
    }
}

function eulerExp(x: number): Complex {
    return {
        real: Math.cos(x),
        imag: Math.sin(x)
    }
}

export { bitReverse, bitReverseIndices, iterativeFFT }