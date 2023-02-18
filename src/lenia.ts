import { Complex, complexMul } from "./complex.js"
import { FFT2D, inverseFFT2D } from "./fftconvolution.js"
import { FrameCounter } from "./framecounter.js"

class Lenia {

    dt: number = 0.2

    image: ImageData
    points: Complex[][]

    kernel: Complex[][]
    growthFunction: GrowthFunction

    frameCounter?: FrameCounter

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

                this.points[i][j] = {
                    real: rand,
                    imag: 0
                }
            }
        }

        this.growthFunction = new GrowthFunction(stateResolution)
        this.growthFunction.addBell(this.stateResolution * 1.3, 48, 16, -this.stateResolution)
        //this.growthFunction.addBell(this.stateResolution / 2, 32, 16, 0)

        let kernelSkeleton = new GrowthFunction(stateResolution)
        kernelSkeleton.addBell(0.003, 16, 1, 0)
        kernelSkeleton.addBell(0.007, 1, 1, 0)
        this.kernel = this.generateKernel(kernelSkeleton, 128)

        this.frameCounter = countFrames ? new FrameCounter() : undefined

    }

    draw = () => {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {

                const index = (x + y * this.size) * 4

                this.image.data[index + 2] = this.points[x][y].real
                this.image.data[index + 3] = 255

            }
        }

        this.ctx.putImageData(this.image, 0, 0)
    }

    update = () => {
        const convolution = this.convolve()
        this.growthFunction.applyToMatrix(convolution)
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.points[x][y] = {
                    real: Math.min(Math.max(this.points[x][y].real + convolution[x][y].real * this.dt, 0), this.stateResolution - 1),
                    imag: 0
                }
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

                this.points[i][j] = {
                    real: rand,
                    imag: 0
                }
            }
        }
    }

    // Generates Fourier transform of kernel from a growth function
    generateKernel = (growthFunction: GrowthFunction, radius: number) => {

        const points: Complex[][] = [];

        for(let x = 0; x < radius * 2; x++) {
            points[x] = [];
            for(let y = 0; y < radius * 2; y++) {

                const dx = x - radius
                const dy = y - radius

                const distance = Math.sqrt(dx ** 2 + dy ** 2)

                points[x][y] = {
                    real: growthFunction.apply(distance),
                    imag: 0
                }
            }

            for (let i = 0; i < this.size - radius * 2; i++) {
                points[x].push({real: 0, imag: 0})
            }
        }

        for (let x = radius * 2; x < this.size; x++) {
            points[x] = []
            for (let y = 0; y < this.size; y++) {
                points[x][y] = {
                    real: 0,
                    imag:0
                }
            }
        }

        return FFT2D(points)

    }

    convolve = () => {
        const frequencyMatrix = FFT2D(this.points)

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                frequencyMatrix[x][y] = complexMul(frequencyMatrix[x][y], this.kernel[x][y])
            }
        }

        return inverseFFT2D(frequencyMatrix)
    }

}

class GrowthFunction {

    bells: Bell[] = []

    constructor(private stateResolution: number, bells: Bell[] = []) {}

    addBell = (a: number, b: number, c: number, h: number) => {
        this.bells.push({
            a: a,
            b: b,
            c2: 2 * c ** 2,
            h: h
        })
    }

    apply = (value: number) => {
        let sum = 0

        this.bells.forEach(bell => {
            sum += (bell.a * Math.E ** (-((value - bell.b) ** 2) / bell.c2)) + bell.h
        })

        return Math.min(Math.max(sum, -this.stateResolution), this.stateResolution)
    }

    // Slightly faster application function for just one bell
    applyFirstBell = (value: number) => {
        let result = (this.bells[0].a * Math.E ** -((value - this.bells[0].b) ** 2 / (this.bells[0].c2))) + this.bells[0].h

        return Math.min(Math.max(result, -this.stateResolution), this.stateResolution)
    }

    applyToMatrix = (matrix: Complex[][]) => {
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                matrix[x][y].real = this.apply(matrix[x][y].real)
            }
        }
    }

    applyFirstBellToMatrix = (matrix: Complex[][]) => {
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                matrix[x][y].real = this.applyFirstBell(matrix[x][y].real)
            }
        }
    }

}

interface Bell {
    a: number,
    b: number,
    // To avoid redundant calculations, 2 * c ** 2 
    // should be stored ahead of time.
    c2: number,
    h: number
}

export { Lenia }