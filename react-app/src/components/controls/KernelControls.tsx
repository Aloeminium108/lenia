import React, { useState } from "react"

function BetaSlider() {
    return (
        <div>
            <input 
                type="range" 
                className='beta-slider' 
                min="0" 
                max="1" 
                defaultValue="1" 
                step="0.01" 
            />
        </div>
    )
}

function KernelControls() {

    const [betaSliders, setBetaSliders] = useState([<BetaSlider key={0}/>])

    const addBetaSlider = () => {
        if (betaSliders.length < 8) {
            setBetaSliders(betaSliders.concat(<BetaSlider key={betaSliders.length} />))
        }
    }

    const delBetaSlider = () => {
        if (betaSliders.length > 1) {
            setBetaSliders(betaSliders.slice(0, -1))
        }
    }

    return (
        <div>
            <canvas id='kernel-display'></canvas>
            <div id='beta-sliders'>
                {betaSliders}
            </div>
            <div>
                <button id='add-beta' type='button' onClick={addBetaSlider}>+</button>
                <button id='del-beta' type='button' onClick={delBetaSlider}>-</button>
            </div>
            <div>
                <button id='generate-kernel' type='button'>Generate Kernel</button>
            </div>
        </ div>
    )
}  

export default KernelControls