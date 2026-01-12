
import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SkyMap } from './components/SkyView/SkyMap';
import { DeepSpaceView } from './components/DeepSpace/DeepSpaceView';
import { Footer } from './components/Footer';

function App() {
    const [view, setView] = useState<'orbital' | 'deepspace'>('orbital');

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden flex flex-col">
            <Navbar currentView={view} onViewChange={setView} />
            <main className="flex-grow flex flex-col justify-center pt-20">
                {view === 'orbital' ? (
                    <SkyMap />
                ) : (
                    <DeepSpaceView />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default App;
