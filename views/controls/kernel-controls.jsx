const React = require('react')

function BetaSlider(key) {
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
    return (
        <div>
            <canvas id='kernel-display'></canvas>
            <div id='beta-sliders'>
                <BetaSlider />
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

module.exports = KernelControls