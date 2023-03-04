import { IKernelRunShortcut, KernelOutput, Texture } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'
import { FrameCounter } from "./framecounter.js"
import { createApplyGrowth, createBitReverse, createClear, createDraw, createFFTPass, createGenerateKernel, createMatrixMul, createPointwiseAdd, createPointwiseMul, createRandomize, createRender, ctx, growthFunction } from './fftpipeline.js'

//const ext = ctx.getExtension('GMAN_webgl_memory')

class Lenia {

    dt: number = 0.05

    mousePressed: boolean = false
    brushSize: number = 10

    kernel: Texture

    lastFrame: Texture

    frameCounter?: FrameCounter

    private termSignal: boolean = false

    private FFTPassVertical: IKernelRunShortcut
    private FFTPassHorizontal: IKernelRunShortcut
    private invFFTPassVertical: IKernelRunShortcut
    private invFFTPassHorizontal: IKernelRunShortcut

    private bitReverseVertical: IKernelRunShortcut
    private bitReverseHorizontal: IKernelRunShortcut

    private pointwiseAdd: IKernelRunShortcut
    private pointwiseMul: IKernelRunShortcut
    private matrixMul: IKernelRunShortcut

    private applyGrowth: IKernelRunShortcut

    private render: IKernelRunShortcut
    private draw: IKernelRunShortcut

    private randomize: IKernelRunShortcut
    private clear: IKernelRunShortcut

    private generateKernel: IKernelRunShortcut

    constructor(
        private size: number, 
        private growthCenter: number,
        private growthWidth: number,
        countFrames: boolean = false
    ) {

        const {FFTPassVertical, FFTPassHorizontal, invFFTPassVertical, invFFTPassHorizontal} = createFFTPass(size)
        this.FFTPassVertical = FFTPassVertical
        this.FFTPassHorizontal = FFTPassHorizontal
        this.invFFTPassVertical = invFFTPassVertical
        this.invFFTPassHorizontal = invFFTPassHorizontal

        const {bitReverseVertical, bitReverseHorizontal} = createBitReverse(size)
        this.bitReverseVertical = bitReverseVertical
        this.bitReverseHorizontal = bitReverseHorizontal
        
        this.pointwiseAdd = createPointwiseAdd(size)
        this.pointwiseMul = createPointwiseMul(size)
        this.matrixMul = createMatrixMul(size)

        this.applyGrowth = createApplyGrowth(size)

        this.render = createRender(size)
        this.draw = createDraw(size)

        this.randomize = createRandomize(size)
        this.clear = createClear(size)
        this.generateKernel = createGenerateKernel(size)

        const kernel = this.generateKernel(
            [1.0, 0.7, 0.3],
            2,
            0.1,
            80
        )

        const normalizationFactor = this.findNormalization((kernel as Texture).toArray() as [][][])

        this.kernel = this.fft2d(this.matrixMul(kernel, normalizationFactor) as Texture)

        this.lastFrame = this.randomize() as Texture

        document.addEventListener('contextmenu', event => event.preventDefault())

        const canvas = this.render.canvas as HTMLCanvasElement
        document.getElementById('lenia-container')?.appendChild(canvas)

        canvas.onmousedown = (e) => {
            this.mousePressed = true

            let x = Math.floor((e.offsetX / (e.target as HTMLElement).offsetWidth) * this.size)
            let y = Math.floor((e.offsetY / (e.target as HTMLElement).offsetHeight) * this.size)

            const newFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2) as Texture
            this.lastFrame.delete()
            this.lastFrame = newFrame
        }

        canvas.onmousemove = (e) => {
            if (!this.mousePressed) return

            let x = Math.floor((e.offsetX / (e.target as HTMLElement).offsetWidth) * this.size)
            let y = Math.floor((e.offsetY / (e.target as HTMLElement).offsetHeight) * this.size)

            const newFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2) as Texture
            this.lastFrame.delete()
            this.lastFrame = newFrame
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

        canvas.ondblclick = () => {
            this.termSignal = true
        }

        this.addEventListeners()

        this.drawGrowthCurve()

        this.frameCounter = countFrames ? new FrameCounter() : undefined

    }

    animate = () => {

        let pass: Texture

        let frame = this.convolve(this.lastFrame, this.kernel)
        
        pass = this.applyGrowth(frame, this.growthCenter, this.growthWidth, this.dt) as Texture
        frame.delete()
        frame = pass
        
        pass = this.pointwiseAdd(frame, this.lastFrame) as Texture
        frame.delete()
        frame = pass

        this.lastFrame.delete()
        this.lastFrame = frame

        this.render(this.lastFrame)

        // if (ext) {
        //     const info = ext.getMemoryInfo()
        //     console.log("this.lastFrame rendered:", info.resources.texture)
        // }

        this.frameCounter?.countFrame()

        if (!this.termSignal) {
            requestAnimationFrame(this.animate)
        }

    }

    private fft2d = (matrix: Texture) => {

        let pass: Texture
        let texture = matrix.clone()
        pass = this.bitReverseVertical(texture) as Texture
        texture.delete()
        texture = pass

        for (let n = 2; n <= this.size; n *= 2) {
            pass = this.FFTPassVertical(texture, n) as Texture
            texture.delete()
            texture = pass
        }

        pass = this.bitReverseHorizontal(texture) as Texture
        texture.delete()
        texture = pass

        for (let n = 2; n <= this.size; n *= 2) {
            pass = (this.FFTPassHorizontal(texture, n)) as Texture
            texture.delete()
            texture = pass
        }

        return texture as Texture

    }

    private invfft2d = (matrix: Texture) => {

        let pass: Texture
        let texture = matrix

        for (let n = this.size; n >= 2; n /= 2) {
            pass = this.invFFTPassHorizontal(texture, n) as Texture
            texture.delete()
            texture = pass
        }

        pass = this.bitReverseHorizontal(texture) as Texture
        texture.delete()
        texture = pass

        for (let n = this.size; n >= 2; n /= 2) {
            pass = this.invFFTPassVertical(texture, n) as Texture
            texture.delete()
            texture = pass
        }

        pass = this.bitReverseVertical(texture) as Texture
        texture.delete()
        texture = pass

        return texture

    }

    private convolve = (matrix: Texture, kernel: Texture) => {

        let pass: Texture
        let texture = this.fft2d(matrix) as Texture

        pass = this.pointwiseMul(texture, kernel) as Texture
        texture.delete()
        texture = pass

        pass = this.invfft2d(texture) as Texture
        texture.delete()
        texture = pass

        return texture

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
            this.lastFrame.delete()
            this.lastFrame = this.randomize() as Texture
        })

        document.getElementById('clear')?.addEventListener('click', () => {
            this.lastFrame = this.clear() as Texture
        })
        
    }

    private findNormalization = (kernel: number[][][]) => {

        let sum = 0
    
        for (let y = 0; y < kernel.length; y++) {
            for (let x = 0; x < kernel.length; x++) {
                sum += kernel[y][x][0]
            }
        }
    
        return 1 / sum
    
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