import { Complex } from "./complex.js"
import { FrameCounter } from "./framecounter.js"

class Lenia {

    image: ImageData
    points: Complex[][]

    frameCounter?: FrameCounter

    constructor(
        private size: number, 
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

    animate = () => {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.update()

        this.draw()

        this.frameCounter?.countFrame()

        requestAnimationFrame(this.animate)
    }

}

export { Lenia }