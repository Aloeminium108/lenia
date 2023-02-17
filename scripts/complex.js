function complexAdd(a, b) {
    return {
        real: a.real + b.real,
        imag: a.imag + b.imag
    };
}
function complexSub(a, b) {
    return {
        real: a.real - b.real,
        imag: a.imag - b.imag
    };
}
function complexMul(a, b) {
    return {
        real: (a.real * b.real) - (a.imag * b.imag),
        imag: (a.imag * b.real) + (b.imag * a.real)
    };
}
function complexDiv(a, b) {
    return {
        real: a.real / b,
        imag: a.imag / b
    };
}
function eulerExp(x) {
    return {
        real: Math.cos(x),
        imag: Math.sin(x)
    };
}
function realToComplex(matrix) {
    const output = [];
    for (let x = 0; x < matrix.length; x++) {
        output[x] = [];
        for (let y = 0; y < matrix[x].length; y++) {
            output[x][y] = {
                real: matrix[x][y],
                imag: 0
            };
        }
    }
    return output;
}
export { complexAdd, complexDiv, complexMul, complexSub, eulerExp, realToComplex };
