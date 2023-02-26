import { GPU } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'

const gpu = new GPU()

function createGPUConvolution(matrixSize: number) {

    const gpuConvolve = gpu.createKernel(function (matrix: number[][], m_Size: number, kernel: number[][], k_Size: number) {

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
    
        return sum
    
    }).setOutput([matrixSize, matrixSize])

    return gpuConvolve

}

export { createGPUConvolution }
