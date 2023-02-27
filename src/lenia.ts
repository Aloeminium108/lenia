import { IKernelRunShortcut, KernelOutput, Texture } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'
import { FrameCounter } from "./framecounter.js"
import { createDrawFunction, createRenderFunction, createUpdateFunction, growthFunction } from "./gpufunctions.js"
import { findScale, generateKernel } from "./kernel.js"

class Lenia {

    dt: number = 0.05

    mousePressed: boolean = false
    brushSize: number = 10

    kernel: number[][]
    kernelScale: number

    update: IKernelRunShortcut
    draw: IKernelRunShortcut
    render: IKernelRunShortcut

    lastFrame: KernelOutput | number[][]

    frameCounter?: FrameCounter

    constructor(
        private size: number, 
        private growthCenter: number,
        private growthWidth: number,
        countFrames: boolean = false
    ) {

        this.lastFrame = this.randomize(size)

        this.kernel = generateKernel([0.3, 0.6], 4, 20)
        this.kernelScale = findScale(this.kernel)

        this.update = createUpdateFunction(size)
        this.draw = createDrawFunction(size)
        this.render = createRenderFunction(size)

        this.render(this.lastFrame)

        document.addEventListener('contextmenu', event => event.preventDefault())

        const canvas = this.render.canvas as HTMLCanvasElement
        document.getElementById('lenia-container')?.appendChild(canvas)

        canvas.onmousedown = (e) => {
            this.mousePressed = true

            let x = Math.floor((e.offsetX / (e.target as HTMLElement).offsetWidth) * this.size)
            let y = Math.floor((e.offsetY / (e.target as HTMLElement).offsetHeight) * this.size)

            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2)
        }

        canvas.onmousemove = (e) => {
            if (!this.mousePressed) return

            let x = Math.floor((e.offsetX / (e.target as HTMLElement).offsetWidth) * this.size)
            let y = Math.floor((e.offsetY / (e.target as HTMLElement).offsetHeight) * this.size)

            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2)
        }

        canvas.onmouseup = () => {
            this.mousePressed = false
        }

        canvas.onmouseleave = () => {
            this.mousePressed = false
        }

        canvas.onmouseenter = (e) => {
            if (e.buttons === 1 || e.buttons === 2) this.mousePressed = true
        }
        
        this.addEventListeners()

        this.drawGrowthCurve()
        this.drawKernel()

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
        )

        this.render(frame)
        
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

    clearField = (size: number) => {
        let points: number[][] = []

        for(let i = 0; i < size; i++) {
            points[i] = [];
            for(let j = 0; j < size; j++) {
                points[i][j] = 0
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

            ctx.strokeStyle = 'orange'
            ctx.lineWidth = 8

            ctx.beginPath()
            ctx.moveTo(0, (canvas.height / 2) - (-canvas.height / 2.5))

            for (let x = 0; x < canvas.width; x++) {

                const y = (canvas.height / 2) - ((canvas.height / 2.5) * growthFunction(x/canvas.width, this.growthCenter, this.growthWidth))

                ctx.lineTo(x, y)
            }

            ctx.stroke()

        }

    }

    private drawKernel = () => {
        const canvas = document.getElementById('kernel-display') as HTMLCanvasElement

        canvas.width = this.kernel.length
        canvas.height = this.kernel.length

        if (canvas) {
            const ctx = canvas.getContext('2d')!!

            const kernelImage = ctx.createImageData(this.kernel.length, this.kernel.length)

            const epsilon = 0.001

            for (let x = 0; x < this.kernel.length; x++) {
                for (let y = 0; y < this.kernel.length; y++) {
                    const index = (x + (y * this.kernel.length)) * 4

                    kernelImage.data[index] = this.kernel[x][y] * this.kernelScale
                    kernelImage.data[index + 1] = this.kernel[x][y] * this.kernelScale
                    kernelImage.data[index + 2] = this.kernel[x][y] * this.kernelScale
                    kernelImage.data[index + 3] = 255
                }
            }

            ctx.putImageData(kernelImage, 0, 0)

        }
        
    }

    private addEventListeners = () => {

        document.getElementById('growth-center')?.addEventListener('wheel', enableScrollWheel)
        document.getElementById('growth-center')?.addEventListener('input', (e) => {
            this.growthCenter = parseFloat((e.target as HTMLInputElement).value)
            this.drawGrowthCurve()
        })

        document.getElementById('growth-width')?.addEventListener('wheel', enableScrollWheel)
        document.getElementById('growth-width')?.addEventListener('input', (e) => {
            this.growthWidth = parseFloat((e.target as HTMLInputElement).value)
            this.drawGrowthCurve()
        })

        document.getElementById('delta')?.addEventListener('wheel', enableScrollWheel)
        document.getElementById('delta')?.addEventListener('input', (e) => {
            this.dt = parseFloat((e.target as HTMLInputElement).value) ** 2
        })

        document.getElementById('brush-size')?.addEventListener('wheel', enableScrollWheel)
        document.getElementById('brush-size')?.addEventListener('input', (e) => {
            this.brushSize = parseFloat((e.target as HTMLInputElement).value)
        })

        document.getElementById('scramble')?.addEventListener('click', () => {
            this.lastFrame = this.randomize(this.size)
        })

        document.getElementById('clear')?.addEventListener('click', () => {
            this.lastFrame = this.clearField(this.size)
        })
        
    }

}

function enableScrollWheel(e: WheelEvent) {
    if (e.deltaY < 0) {
        (e.target as HTMLInputElement).stepUp()
    } else {
        (e.target as HTMLInputElement).stepDown()
    }

    e.preventDefault()
    e.stopPropagation()

    const event = new Event('input', {bubbles: true, cancelable: true})
    e.target?.dispatchEvent(event)
}

export { Lenia }