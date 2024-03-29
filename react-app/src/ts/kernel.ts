
function generateKernel(betas: number[], coreWidth: number, radius: number) {

    const b_rank = betas.length - 1

    const kernel_core = (distance: number) => {
        return (4 * distance * (1 - distance)) ** coreWidth
    }

    const kernelSkeleton = (distance: number) => {
        let beta = betas[Math.floor(distance * b_rank)]

        return beta * kernel_core((distance * (b_rank + 1)) % 1)
    }

    const points: number[][] = [];

    for(let x = 0; x < radius * 2 + 1; x++) {
        points[x] = [];
        for(let y = 0; y < radius * 2 + 1; y++) {

            const dx = x - radius
            const dy = y - radius

            const distance = Math.sqrt(dx ** 2 + dy ** 2)

            points[x][y] = distance <= radius ? kernelSkeleton(distance / radius) : 0
        }
    }

    normalize(points)

    return points

}

function normalize(kernel: number[][]) {

    let sum = 0

    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            sum += kernel[x][y]
        }
    }

    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            kernel[x][y] /= sum
        }
    }

}

function findScale(kernel: number[][]) {
    let max = 0

    for (let x = 0; x < kernel.length; x++) {
        for (let y = 0; y < kernel.length; y++) {
            max = kernel[x][y] > max ? kernel[x][y] : max
        }
    }

    return 255 / max
}

export { generateKernel, findScale }