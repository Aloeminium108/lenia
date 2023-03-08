import React, { useState } from "react"

function BetaSlider(data: {key: number}) {
    return (
        <div key={`beta-slider-${data.key}`}>
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

    return (
        <div>
            <canvas id='kernel-display'></canvas>
            <div id='beta-sliders'>
                
            </div>
            <div>
                <button id='add-beta' type='button'>+</button>
                <button id='del-beta' type='button'>-</button>
            </div>
            <div>
                <button id='generate-kernel' type='button'>Generate Kernel</button>
            </div>
        </ div>
    )
}  

export default KernelControls