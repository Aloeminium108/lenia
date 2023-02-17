import { Complex } from "./complex.js"

class Lenia {

    space: Complex[][]

    constructor(
        private size: number, 
        private stateResolution: number, 
        private ctx: CanvasRenderingContext2D
    ) {

        this.space = [];

        for(let i = 0; i < size; i++) {
            this.space[i] = [];
            for(let j = 0; j < size; j++) {

                const rand = Math.floor(Math.random() * stateResolution)

                this.space[i][j] = {
                    real: rand,
                    imag: 0
                }
            }
        }

    }

    draw = () => {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {

                this.ctx.fillStyle = `rgba(0, 0, ${this.space[x][y].real}, 1)`
                this.ctx.fillRect(x, y, 1, 1)

            }
        }
    }

    update = () => {
        
    }

    animate = () => {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.update()

        this.draw()

        requestAnimationFrame(this.animate)
    }

}

export { Lenia }