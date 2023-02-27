const React = require('react')
const Def = require('./default')
const Lenia = require('./lenia')
const GrowthControl = require('./controls/growth-controls')
const DeltaControls = require('./controls/delta-controls')
const ResetButton = require('./controls/reset-button')

function home () {
    return (
        <Def>

            <div className='control-panel'>
                <DeltaControls />
                <GrowthControl />
            </div>

            <Lenia />
            
            <div className='control-panel'>
                <ResetButton />
            </div>

            <script src="./bundle.js"></script>
         </Def>
    )
}  

module.exports = home