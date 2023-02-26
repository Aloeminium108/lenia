const React = require('react')
const Def = require('./default')
const Lenia = require('./lenia')
const GrowthControl = require('./controls/growth-controls')

function home () {
    return (
        <Def>

            <div className='control-panel'>
                <GrowthControl />
            </div>

            <Lenia />
            
            <div className='control-panel'>

            </div>

         </Def>
    )
}  

module.exports = home