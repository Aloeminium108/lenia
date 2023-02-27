const React = require('react')

function DeltaControls () {
    return (
        <div>
            <div>
                <label htmlFor="delta">delta-T</label>
                <input type="range" id="delta" name="delta" min="0" max="1" defaultValue="0.225" step="0.005" />
            </div>
        </ div>
    )
}  

module.exports = DeltaControls