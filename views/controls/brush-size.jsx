const React = require('react')

function BrushSize () {
    return (
        <div>
            <div>
                <label htmlFor="brush-size">Brush Size</label>
                <input type="range" id="brush-size" name="brush-size" min="1" max="100" defaultValue="10" step="1" />
            </div>
        </ div>
    )
}  

module.exports = BrushSize