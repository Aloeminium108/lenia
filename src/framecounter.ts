class FrameCounter {

    timeStamp: number
    frameCount: number = 0

    constructor() {
        this.timeStamp = Date.now()
    }

    countFrame = () => {
        this.frameCount++

        const timeStamp = Date.now()

        if (timeStamp - this.timeStamp >= 1000) {
            this.timeStamp = timeStamp
            console.log(`FPS: ${this.frameCount}`)
            this.frameCount = 0
        }

    }

}

export { FrameCounter }