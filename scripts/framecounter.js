"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameCounter = void 0;
class FrameCounter {
    constructor() {
        this.frameCount = 0;
        this.countFrame = () => {
            this.frameCount++;
            const timeStamp = Date.now();
            if (timeStamp - this.timeStamp >= 1000) {
                this.timeStamp = timeStamp;
                console.log(`FPS: ${this.frameCount}`);
                this.frameCount = 0;
            }
        };
        this.timeStamp = Date.now();
    }
}
exports.FrameCounter = FrameCounter;
