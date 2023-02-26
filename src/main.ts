import { Lenia } from "./lenia.js"

const SPACE_SIZE = 512

const canvas = document.querySelector('canvas')

if (canvas) {
    canvas.width = SPACE_SIZE
    canvas.height = SPACE_SIZE

    const ctx = canvas.getContext("2d")

    if (ctx) {
        const lenia = new Lenia(SPACE_SIZE, ctx, true)
        canvas.addEventListener('dblclick', (e) => {
            lenia.randomize()
        })
        lenia.animate()
    }
}