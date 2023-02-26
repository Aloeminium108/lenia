import { IKernelRunShortcut, Texture } from "gpu.js"
import { FrameCounter } from "./framecounter.js"
import { createRenderFunction, createUpdateFunction } from "./gpulenia.js"
import { createGrowthFunction, FunctionShape } from "./growthfunction.js"
import { generateKernel } from "./kernel.js"

class Lenia {

    dt: number = 0.05

    points: number[][]

    kernel: number[][]

    update: IKernelRunShortcut
    render: IKernelRunShortcut

    lastFrame: Texture

    frameCounter?: FrameCounter

    constructor(
        private size: number, 
        private growthCenter: number,
        private growthWidth: number,
        countFrames: boolean = false
    ) {

        this.points = this.randomize(size)

        this.kernel = generateKernel([1], 0.3, 20, FunctionShape.POLYNOMIAL)

        this.update = createUpdateFunction(size)
        this.render = createRenderFunction(size)

        this.render(this.points)

        const canvas = this.render.canvas as HTMLCanvasElement
        document.body.appendChild(canvas)
        canvas.addEventListener('dblclick', (e) => {
            this.points = this.randomize(size)
        })

        this.lastFrame = this.update(
            this.points, 
            this.size, 
            this.kernel, 
            this.kernel.length, 
            this.dt,
            this.growthCenter,
            this.growthWidth
        ) as Texture

        this.frameCounter = countFrames ? new FrameCounter() : undefined

    }

    animate = () => {

        const frame = this.update(
            this.lastFrame, 
            this.size, 
            this.kernel, 
            this.kernel.length, 
            this.dt, 
            this.growthCenter,
            this.growthWidth
        ) as Texture

        this.render(frame)
        
        this.lastFrame?.delete()
        this.lastFrame = frame

        this.frameCounter?.countFrame()

        requestAnimationFrame(this.animate)
    }

    randomize = (size: number) => {

        let points: number[][] = []

        for(let i = 0; i < size; i++) {
            points[i] = [];
            for(let j = 0; j < size; j++) {
                const rand = Math.random()
                points[i][j] = rand
            }
        }

        return points

    }

}

export { Lenia }