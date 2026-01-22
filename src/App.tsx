
import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { OrbitalRadar } from './components/OrbitalRadar/OrbitalRadar';
import { DeepSpaceView } from './components/DeepSpace/DeepSpaceView';
import { LaunchGateway } from './components/Launch/LaunchGateway';
import { SpaceWeather } from './components/Weather/SpaceWeather';
import { Footer } from './components/Footer';

function App() {
    const [view, setView] = useState<'dashboard' | 'orbital' | 'deepspace' | 'gateway' | 'weather'>('dashboard');

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden flex flex-col">
            <Navbar currentView={view} onViewChange={setView} />
            <main className="flex-grow flex flex-col justify-start pt-20">
                {view === 'dashboard' ? (
                    <Dashboard onViewChange={setView} />
                ) : view === 'orbital' ? (
                    <OrbitalRadar />
                ) : view === 'deepspace' ? (
                    <DeepSpaceView />
                ) : view === 'gateway' ? (
                    <LaunchGateway />
                ) : (
                    <SpaceWeather />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default App;
