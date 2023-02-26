"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lenia_js_1 = require("./lenia.js");
const SPACE_SIZE = 512;
const canvas = document.querySelector('canvas');
if (canvas) {
    canvas.width = SPACE_SIZE;
    canvas.height = SPACE_SIZE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const lenia = new lenia_js_1.Lenia(SPACE_SIZE, ctx, true);
        canvas.addEventListener('dblclick', (e) => {
            lenia.randomize();
        });
        lenia.animate();
    }
}
