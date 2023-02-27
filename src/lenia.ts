import { IKernelRunShortcut, Texture } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'
import { FrameCounter } from "./framecounter.js"
import { createRenderFunction, createUpdateFunction, growthFunction } from "./gpufunctions.js"
import { FunctionShape, generateKernel } from "./kernel.js"

class Lenia {

    dt: number = 0.05

    kernel: number[][]

    update: IKernelRunShortcut
    render: IKernelRunShortcut

    lastFrame: Texture | number[][]

    frameCounter?: FrameCounter

    constructor(
        private size: number, 
        private growthCenter: number,
        private growthWidth: number,
        countFrames: boolean = false
    ) {

        this.lastFrame = this.randomize(size)

        this.kernel = generateKernel([1, 0.7, 0.3], 0.2, 20, FunctionShape.POLYNOMIAL)

        this.update = createUpdateFunction(size)
        this.render = createRenderFunction(size)

        this.render(this.lastFrame)

        const canvas = this.render.canvas as HTMLCanvasElement
        document.getElementById('lenia-container')?.appendChild(canvas)
        
        this.addEventListeners()

        this.drawGrowthCurve()

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

        this.render(this.lastFrame)
        
        if (this.lastFrame instanceof Texture) this.lastFrame.delete()
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

    private drawGrowthCurve = () => {
        const canvas = document.getElementById('growth-curve') as HTMLCanvasElement

        canvas.width = 1000
        canvas.height = 100

        if (canvas) {
            const ctx = canvas.getContext('2d')!!

            ctx.fillStyle = 'orange'

            for (let x = 0; x < canvas.width; x++) {

                const y = (canvas.height / 2) - ((canvas.height / 2.5) * growthFunction(x/canvas.width, this.growthCenter, this.growthWidth))

                ctx.fillRect(x, y, 2, 2)
            }
        }

    }

    private addEventListeners = () => {

        document.getElementById('growth-center')?.addEventListener('change', (e) => {
            this.growthCenter = parseFloat((e.target as HTMLInputElement).value)
            this.drawGrowthCurve()
        })

        document.getElementById('growth-width')?.addEventListener('change', (e) => {
            this.growthWidth = parseFloat((e.target as HTMLInputElement).value)
            this.drawGrowthCurve()
        })

        document.getElementById('delta')?.addEventListener('change', (e) => {
            this.dt = parseFloat((e.target as HTMLInputElement).value) ** 2
        })

        document.getElementById('scramble')?.addEventListener('click', () => {
            this.lastFrame = this.randomize(this.size)
        })
        
    }

}

export { Lenia }