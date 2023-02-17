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
export { complexAdd, complexDiv, complexMul, complexSub, eulerExp };
