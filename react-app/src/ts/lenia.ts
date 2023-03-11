import { IKernelRunShortcut, Texture } from 'gpu.js'
import { FrameCounter } from "./framecounter"
import { colorInterpolation, ColorParams, createApplyGrowth, createBitReverse, createClear, createDraw, createFFTPass, createFFTShift, createGenerateKernel, createMatrixMul, createPointwiseAdd, createPointwiseMul, createRandomize, createRender, ctx, growthFunction, RGBtoMSH } from './fftpipeline'

//const ext = ctx.getExtension('GMAN_webgl_memory')

const referenceXYZ = {
    A: [111.144, 100, 35.2],
    B: [99.178, 100, 84.3493],
    C: [97.285, 100, 116.145],
    D50: [96.720, 100, 81.427],
    D55: [95.799, 100, 90.926],
    D65: [94.811, 100, 107.304],
    D75: [94.416, 100, 120.641],
    E: [100, 100, 100],
    F1: [94.791, 100, 103.191],
    F2: [103.280, 100, 69.026],
    F3: [108.968, 100, 51.965],
    F4: [114.961, 100, 40.963],
    F5: [93.369, 100, 98.636],
    F6: [102.148, 100, 62.074],
    F7: [95.792, 100, 107.687],
    F8: [97.115, 100, 81.135],
    F9: [102.116, 100, 67.826],
    F10: [99.001, 100, 83.134],
    F11: [103.866, 100, 65.627],
    F12: [111.428, 100, 40.353],
}

class Lenia {

    private lastFrame: Texture

    private kernel: Texture
    private kernelImage: Texture

    private colorParams: ColorParams

    private dt: number = 0.05

    private mousePressed: boolean = false
    private brushSize: number = 10

    private frameCounter?: FrameCounter

    private termSignal: boolean = false

    private FFTPassVertical: IKernelRunShortcut
    private FFTPassHorizontal: IKernelRunShortcut
    private invFFTPassVertical: IKernelRunShortcut
    private invFFTPassHorizontal: IKernelRunShortcut

    private bitReverseVertical: IKernelRunShortcut
    private bitReverseHorizontal: IKernelRunShortcut

    private FFTShift: IKernelRunShortcut

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
        private kernelParams: KernelParams,
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

        this.FFTShift = createFFTShift(size)
        
        this.pointwiseAdd = createPointwiseAdd(size)
        this.pointwiseMul = createPointwiseMul(size)
        this.matrixMul = createMatrixMul(size)

        this.applyGrowth = createApplyGrowth(size)

        const reference = referenceXYZ.B

        this.colorParams = {
            midPoint: 0.5,
            minColor: RGBtoMSH([2, 16, 68], reference),
            midColor: RGBtoMSH([93, 6, 255], reference),
            maxColor: RGBtoMSH([255, 255, 255], reference),
            reference: reference,
            exponent: 1
        }

        this.render = createRender(
            size,
            this.colorParams
        )

        this.draw = createDraw(size)

        this.randomize = createRandomize(size)
        this.clear = createClear(size)
        this.generateKernel = createGenerateKernel(size)

        this.kernelImage = this.generateKernel(
            this.kernelParams.betas,
            [0],
            this.kernelParams.bRank,
            this.kernelParams.coreWidth,
            this.kernelParams.radius
        ) as Texture

        const normalizationFactor = this.findNormalization((this.kernelImage).toArray() as [][][])

        this.kernel = this.fft2d(this.matrixMul(this.kernelImage, normalizationFactor) as Texture)

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

        this.addEventListeners()

        this.drawGrowthCurve()
        this.drawKernel()

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

        let texture = this.FFTShift(matrix) as Texture

        pass = this.fft2d(texture) as Texture
        texture.delete()
        texture = pass

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

    private drawKernel = () => {
        const canvas = document.getElementById('kernel-display') as HTMLCanvasElement

        canvas.width = this.kernelParams.radius * 2
        canvas.height = this.kernelParams.radius * 2

        if (canvas) {
            const ctx = canvas.getContext('2d')!!
            const kernelPixels = this.kernelImage.toArray() as number[][][]

            const offset = this.size / 2 - this.kernelParams.radius

            for (let x = 0; x < canvas.width; x++) {
                for (let y = 0; y < canvas.height; y++) {
                    const color = colorInterpolation(
                        kernelPixels[y + offset][x + offset][0] ** this.colorParams.exponent,
                        this.colorParams.midPoint,
                        this.colorParams.minColor,
                        this.colorParams.midColor,
                        this.colorParams.maxColor,
                        this.colorParams.reference
                    )
                    ctx.fillStyle = `rgb(
                        ${Math.floor(color[0])},
                        ${Math.floor(color[1])},
                        ${Math.floor(color[2])}
                    )`
                    ctx.fillRect(x, y, 1, 1)
                }
            }
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
            this.lastFrame.delete()
            this.lastFrame = this.clear() as Texture
        })

        document.getElementById('generate-kernel')?.addEventListener('click', () => {
            const sliders = document.querySelectorAll('.beta-slider') as NodeListOf<HTMLInputElement>
            const betas: number[] = []
            sliders.forEach(slider => {
                betas.push(parseFloat(slider.value))
            })

            this.kernelParams.betas = betas

            const coreWidth = document.getElementById('core-width') as HTMLInputElement
            this.kernelParams.coreWidth = parseFloat(coreWidth.value) ** 2

            this.regenerateKernel()
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

    private regenerateKernel = () => {
        this.kernelImage.delete()

        const betas1 = this.kernelParams.betas.slice(0, 4)
        let betas2 = this.kernelParams.betas.slice(4)
        if (betas2.length < 1) {
            betas2 = [0]
        }

        this.kernelImage = this.generateKernel(
            betas1,
            betas2,
            this.kernelParams.bRank,
            this.kernelParams.coreWidth,
            this.kernelParams.radius
        ) as Texture

        const normalizationFactor = this.findNormalization(this.kernelImage.toArray() as [][][])

        this.kernel.delete()
        this.kernel = this.fft2d(this.matrixMul(this.kernelImage, normalizationFactor) as Texture)

        this.drawKernel()
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

class KernelParams {

    private _bRank: number

    constructor(
        private _betas: number[],
        private _coreWidth: number,
        private _radius: number
    ) {
        this._bRank = _betas.length
    }

    public get betas() {
        return this._betas
    }

    public set betas(betas: number[]) {
        this._betas = betas
        this._bRank = betas.length
    }

    public get bRank() {
        return this._bRank
    }

    public get coreWidth() {
        return this._coreWidth
    }

    public set coreWidth(coreWidth) {
        this._coreWidth = coreWidth
    }
 
    public get radius() {
        return this._radius
    }

}



export { Lenia, KernelParams }