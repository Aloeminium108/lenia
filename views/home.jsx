const React = require('react')
const Def = require('./default')

function home () {
    return (
        <Def>
            <canvas></canvas>
            <script src="./bundle.js"></script>
         </Def>
    )
}  

module.exports = home