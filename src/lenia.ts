import { IKernelRunShortcut, KernelOutput, Texture } from '/home/alice/Documents/NCState/lenia/node_modules/gpu.js/src/index.js'
import { FrameCounter } from "./framecounter.js"
import { createApplyGrowth, createBitReverse, createClear, createDraw, createFFTPass, createGenerateKernel, createMatrixMul, createPointwiseAdd, createPointwiseMul, createRandomize, createRender, createTestPipeline, growthFunction } from './fftpipeline.js'

class Lenia {

    dt: number = 0.05

    mousePressed: boolean = false
    brushSize: number = 10

    kernel: Texture

    lastFrame: Texture

    frameCounter?: FrameCounter

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

            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2) as Texture
        }

        canvas.onmousemove = (e) => {
            if (!this.mousePressed) return

            let x = Math.floor((e.offsetX / (e.target as HTMLElement).offsetWidth) * this.size)
            let y = Math.floor((e.offsetY / (e.target as HTMLElement).offsetHeight) * this.size)

            this.lastFrame = this.draw(this.lastFrame, x, this.size - y, this.brushSize, e.buttons % 2) as Texture
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

        this.frameCounter = countFrames ? new FrameCounter() : undefined

        // Trying to figure out how in the hell pipeline and immutable work
        const { test1, test2 } = createTestPipeline(4)
        test1([0, 1, 2, 3])
        console.log(test1.texture.toArray())
        test1(test1.texture)
        console.log(test1.texture.toArray())
        test2(test1.texture)
        console.log(test1.texture.toArray())
        console.log(test2.texture.toArray())

    }

    animate = () => {
        if (this.frameCounter!!.frameCount < 3) {

            let frame = this.convolve(this.lastFrame, this.kernel)
            
            frame = this.applyGrowth(frame, this.growthCenter, this.growthWidth, this.dt) as Texture
            
            frame = this.pointwiseAdd(frame, this.lastFrame) as Texture

            this.lastFrame.delete()
            this.lastFrame = frame

            this.render(this.lastFrame)

        }

        this.frameCounter?.countFrame()

        requestAnimationFrame(this.animate)
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

    private fft2d = (matrix: Texture) => {

        let texture = this.bitReverseVertical(matrix) as Texture

        for (let n = 2; n <= this.size; n *= 2) {
            texture = this.FFTPassVertical(texture, n) as Texture
        }

        texture = this.bitReverseHorizontal(texture) as Texture

        for (let n = 2; n <= this.size; n *= 2) {
            texture = (this.FFTPassHorizontal(texture, n)) as Texture
        }

        return texture as Texture

    }

    private invfft2d = (matrix: Texture) => {

        let texture = matrix

        for (let n = this.size; n >= 2; n /= 2) {
            texture = this.invFFTPassHorizontal(texture, n) as Texture
        }

        texture = this.bitReverseHorizontal(texture) as Texture

        for (let n = this.size; n >= 2; n /= 2) {
            texture = this.invFFTPassVertical(texture, n) as Texture
        }

        texture = this.bitReverseVertical(texture) as Texture

        return texture

    }

    private convolve = (matrix: Texture, kernel: Texture) => {

        let texture = this.fft2d(matrix) as Texture

        texture = this.pointwiseMul(texture, kernel) as Texture

        texture = this.invfft2d(texture) as Texture

        return texture

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