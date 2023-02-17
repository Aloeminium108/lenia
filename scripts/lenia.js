class Lenia {
    constructor(size, stateResolution, ctx) {
        this.size = size;
        this.stateResolution = stateResolution;
        this.ctx = ctx;
        this.draw = (ctx) => {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    ctx.fillStyle = `rgba(0, 0, ${this.space[x][y].real}, 1)`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        };
        this.animate = () => {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            requestAnimationFrame(this.animate);
        };
        this.space = [];
        for (let i = 0; i < size; i++) {
            this.space[i] = [];
            for (let j = 0; j < size; j++) {
                const rand = Math.floor(Math.random() * stateResolution);
                this.space[i][j] = {
                    real: rand,
                    imag: 0
                };
            }
        }
    }
}
export { Lenia };
