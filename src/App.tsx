
import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { OrbitalRadar } from './components/OrbitalRadar/OrbitalRadar';
import { DeepSpaceView } from './components/DeepSpace/DeepSpaceView';
import { LaunchGateway } from './components/Launch/LaunchGateway';
import { Footer } from './components/Footer';

function App() {
    const [view, setView] = useState<'orbital' | 'deepspace' | 'gateway'>('orbital');

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden flex flex-col">
            <Navbar currentView={view} onViewChange={setView} />
            <main className="flex-grow flex flex-col justify-start pt-20">
                {view === 'orbital' ? (
                    <OrbitalRadar />
                ) : view === 'deepspace' ? (
                    <DeepSpaceView />
                ) : (
                    <LaunchGateway />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default App;
