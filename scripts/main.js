"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lenia_js_1 = require("./lenia.js");
const SPACE_SIZE = 512;
const lenia = new lenia_js_1.Lenia(SPACE_SIZE, 0.15, 0.02, new lenia_js_1.KernelParams([1.0, 0.7, 0.3], 4, 40), true);
lenia.animate();
