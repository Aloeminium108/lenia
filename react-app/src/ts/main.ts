import { KernelParams, Lenia } from "./lenia.js"

const SPACE_SIZE = 512

const lenia = new Lenia(
    SPACE_SIZE, 
    0.15, 
    0.02, 
    new KernelParams([1.0, 0.7, 0.3], 4, 40),
    true)

lenia.animate()