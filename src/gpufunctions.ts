import { GPU } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('webgl2')!!

const gpu = new GPU({canvas: canvas, context: ctx })

function growthFunction(value: number, center: number, width: number) {
    if (Math.abs(value - center) < 3.0 * width) {
        return 2 * ((1 - ((value - center) ** 2) / (9 * width ** 2)) ** 4) - 1.0
    } else {
        return -1
    }
}

function createUpdateFunction(matrixSize: number) {

    gpu.addFunction(growthFunction)

    const update = gpu.createKernel(function (
            matrix: number[][], 
            m_Size: number, 
            kernel: number[][], 
            k_Size: number, 
            dt: number,
            center: number,
            width: number
        ) {

        const radius = Math.floor(k_Size/2)
    
        let sum = 0
    
        for (let x = 0; x < k_Size; x++) {
            for (let y = 0; y < k_Size; y++) {
    
                let i = (this.thread.y) - (x - radius)
                i = (i + m_Size) % m_Size
    
                let j = (this.thread.x) - (y - radius)
                j = (j + m_Size) % m_Size
    
                sum += kernel[x][y] * matrix[i][j]
    
            }
        }
    
        return Math.min(Math.max((dt * growthFunction(sum, center, width) + matrix[this.thread.y][this.thread.x]), 0), 1)
    
    })
        .setOutput([matrixSize, matrixSize])
        .setPipeline(true)
        .setImmutable(true)

    return update

}

function createRenderFunction(matrixSize: number) {

    const render = gpu.createKernel(function (matrix: number[][]) {
        this.color(0, 0, matrix[this.thread.x][this.thread.y], 255)
    })
        .setOutput([matrixSize, matrixSize])
        .setGraphical(true)

    return render
    
}

function createDrawFunction(matrixSize: number) {

    const draw = gpu.createKernel(function (
        matrix: number[][], 
        x: number,
        y: number,
        radius: number,
        brush: number
    ) {
        const distX = x - this.thread.y
        const distY = y - this.thread.x
        const distance = Math.sqrt(distX ** 2 + distY ** 2)

        return distance <= radius ? brush : matrix[this.thread.y][this.thread.x]

    }).setOutput([matrixSize, matrixSize])

    return draw
   
}

export { createUpdateFunction, createRenderFunction, growthFunction, createDrawFunction }
