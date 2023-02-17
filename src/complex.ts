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

export { Complex, complexAdd, complexDiv, complexMul, complexSub, eulerExp}