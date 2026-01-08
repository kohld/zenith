
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

function App() {
    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden">
            <Navbar />
            <Hero />
            <Features />
            <Footer />
        </div>
    );
}

export default App;
