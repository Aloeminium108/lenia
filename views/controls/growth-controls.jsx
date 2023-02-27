const React = require('react')

function GrowthControls () {
    return (
        <div>
            <canvas id='growth-curve'></canvas>
            <div>
                <label htmlFor="growth-center">Center</label>
                <input type="range" id="growth-center" name="growth-center" min="0" max="1" defaultValue="0.15" step="0.01" />
            </div>
            <div>
                <label htmlFor="growth-width">Width</label>
                <input type="range" id="growth-width" name="growth-width" min="0" max="0.15" defaultValue="0.02" step="0.001" />
            </div>
        </ div>
    )
}  

module.exports = GrowthControls