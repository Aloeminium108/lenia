const React = require('react')
const Def = require('./default')

function home () {
    return (
        <Def>
            <div id='lenia-container'></div>
            <script src="./bundle.js"></script>
         </Def>
    )
}  

module.exports = home