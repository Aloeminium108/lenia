import { IKernelRunShortcut } from "gpu.js"
import { FrameCounter } from "./framecounter.js"
import { createGPUConvolution } from "./gpuconvolution.js"

class Lenia {

    dt: number = 0.1

    image: ImageData
    points: number[][]

    kernel: number[][]
    growthFunction: GrowthFunction

    frameCounter?: FrameCounter

    gpuConvolution: IKernelRunShortcut

    constructor(
        private size: number, 
        // Although the states of vectors in Lenia are, strictly speaking,
        // on the interval of [0, 1], an interval of [0, stateResolution]
        // is used here instead to avoid redundant calculations
        private stateResolution: number, 
        private ctx: CanvasRenderingContext2D,
        countFrames: boolean = false
    ) {

        this.image = ctx.createImageData(size, size)

        this.points = [];

        for(let i = 0; i < size; i++) {
            this.points[i] = [];
            for(let j = 0; j < size; j++) {
                const rand = Math.floor(Math.random() * stateResolution)
                this.points[i][j] = rand
            }
        }

        this.growthFunction = new GrowthFunction(this.stateResolution * 2, 18, 1, -this.stateResolution, this.stateResolution)

        this.kernel = generateKernel([
                new GrowthFunction(0.1, 0, 2, 0, this.stateResolution),
            ],
            20
        )

        this.gpuConvolution = createGPUConvolution(size)

        this.frameCounter = countFrames ? new FrameCounter() : undefined

    }

    draw = () => {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {

                const index = (x + y * this.size) * 4

                this.image.data[index + 2] = this.points[x][y]
                this.image.data[index + 3] = 255

            }
        }

        this.ctx.putImageData(this.image, 0, 0)
    }

    update = () => {

        const convolution = this.gpuConvolution(this.points, this.size, this.kernel, this.kernel.length) as number[][]

        console.log(convolution[64][64])

        this.growthFunction.applyToMatrix(convolution)

        console.log(convolution[64][64])

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.points[x][y] = Math.min(Math.max(this.points[x][y] + convolution[x][y] * this.dt, 0), this.stateResolution - 1)
            }
        }
    }

    animate = () => {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.update()

        this.draw()

        this.frameCounter?.countFrame()

        requestAnimationFrame(this.animate)
    }

    randomize = () => {
        for(let i = 0; i < this.size; i++) {
            this.points[i] = [];
            for(let j = 0; j < this.size; j++) {

                const rand = Math.floor(Math.random() * this.stateResolution)

                this.points[i][j] = rand
            }
        }
    }

}


function convolve(matrix: number[][], kernel: number[][]) {

    const convolution: number[][] = []

    for (let x1 = 0; x1 < matrix.length; x1++) {
        convolution[x1] = []
        for (let y1 = 0; y1 < matrix[x1].length; y1++) {

            let sum = 0

            for (let i = 0; i < kernel.length; i++) {
                for (let j = 0; j < kernel[i].length; j++) {
                    
                    let x = x1 - (i - Math.floor(kernel.length / 2))  
                    x = (x + matrix.length) % matrix.length

                    let y = y1 - (j - Math.floor(kernel[i].length / 2))  
                    y = (y + matrix[x1].length) % matrix[x1].length

                    sum += kernel[i][j] * matrix[x][y] / (kernel.length ** 2)

                }
            }

            convolution[x1][y1] = sum
            
        }
    }

    return convolution
}

function generateKernel(growthFunctions: GrowthFunction[], radius: number) {

    const points: number[][] = [];

    for(let x = 0; x < radius * 2 + 1; x++) {
        points[x] = [];
        for(let y = 0; y < radius * 2 + 1; y++) {

            const dx = x - radius
            const dy = y - radius

            const distance = Math.sqrt(dx ** 2 + dy ** 2)

            let sum = 0

            growthFunctions.forEach(func => {
                sum += func.apply(distance)
            })

            points[x][y] = sum
        }
    }

    return points

}


class GrowthFunction {

    c2: number

    constructor(
        public a: number, 
        public b: number,
        public c: number,
        public h: number,
        public max: number,
        public min = -max
    ) {
        this.c2 = 2 * c ** 2
    }


    apply = (value: number) => {
        let result = (this.a * Math.E ** (-((value - this.b) ** 2) / this.c2)) + this.h

        return Math.min(Math.max(result, this.min), this.max)
    }

    applyToMatrix = (matrix: number[][]) => {
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                matrix[x][y] = this.apply(matrix[x][y])
            }
        }
    }

}

export { Lenia }