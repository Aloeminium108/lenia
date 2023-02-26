import { IKernelRunShortcut } from "gpu.js"
import { FrameCounter } from "./framecounter.js"
import { createGPUConvolution } from "./gpuconvolution.js"
import { createGrowthFunction, FunctionShape } from "./growthfunction.js"
import { generateKernel } from "./kernel.js"

class Lenia {

    dt: number = 0.05

    image: ImageData
    points: number[][]

    kernel: number[][]
    growthFunction: (value: number) => number

    frameCounter?: FrameCounter

    gpuConvolution: IKernelRunShortcut

    constructor(
        private size: number, 
        private ctx: CanvasRenderingContext2D,
        countFrames: boolean = false
    ) {

        this.image = ctx.createImageData(size, size)

        this.points = [];

        for(let i = 0; i < size; i++) {
            this.points[i] = [];
            for(let j = 0; j < size; j++) {
                const rand = Math.random()
                this.points[i][j] = rand
            }
        }

        this.growthFunction = createGrowthFunction(0.15, 0.02, FunctionShape.POLYNOMIAL)

        this.kernel = generateKernel([1], 0.3, 10, FunctionShape.POLYNOMIAL)

        this.gpuConvolution = createGPUConvolution(size)

        this.frameCounter = countFrames ? new FrameCounter() : undefined

    }

    draw = () => {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {

                const index = (x + y * this.size) * 4

                this.image.data[index + 2] = Math.floor(this.points[x][y] * 255)
                this.image.data[index + 3] = 255

            }
        }

        this.ctx.putImageData(this.image, 0, 0)
    }

    update = () => {

        const convolution = this.gpuConvolution(this.points, this.size, this.kernel, this.kernel.length) as number[][]

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                convolution[x][y] = this.growthFunction(convolution[x][y])
            }
        }

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.points[x][y] = Math.min(Math.max(this.points[x][y] + convolution[x][y] * this.dt, 0), 1)
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

                const rand = Math.random()

                this.points[i][j] = rand
            }
        }
    }

}

export { Lenia }