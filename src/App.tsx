
import { Navbar } from './components/Navbar';
import { SkyMap } from './components/SkyView/SkyMap';
import { Footer } from './components/Footer';

function App() {
    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden flex flex-col">
            <Navbar />
            <main className="flex-grow flex flex-col justify-center pt-20">
                <SkyMap />
            </main>
            <Footer />
        </div>
    );
}

export default App;
