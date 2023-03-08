import React from 'react';
import './styles/App.css';
import BrushSize from './components/controls/BrushSize';
import ClearButton from './components/controls/ClearButton';
import DeltaControls from './components/controls/DeltaControls';
import GrowthControls from './components/controls/GrowthControls';
import KernelControls from './components/controls/KernelControls';
import ResetButton from './components/controls/ResetButton';
import { KernelParams, Lenia } from './ts/lenia';
import LeniaContainer from './components/Lenia';

class App extends React.Component {

    lenia?: Lenia

    componentDidMount() {
        if (!this.lenia) {
            this.lenia = new Lenia(
                512, 
                0.15, 
                0.02, 
                new KernelParams([1.0, 0.7, 0.3], 4, 40),
                true
            )
        }

        this.lenia.animate()
    }

    render() {
        return (
            <>
                <div className='control-panel'>
                    <KernelControls />
                    <GrowthControls />
                </div>

                <LeniaContainer />
            
                <div className='control-panel'>
                    <DeltaControls />
                    <BrushSize />
                    <ResetButton />
                    <ClearButton />
                </div>
            </>
        )
    }
}

export default App;
