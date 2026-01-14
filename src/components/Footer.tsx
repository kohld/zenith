
export const Footer = () => {
    return (
        <footer className="w-full border-t border-white/5 bg-slate-900/50 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

                {/* Left: Copyright */}
                <div className="flex items-center text-xs text-slate-600 uppercase tracking-widest font-bold order-3 md:order-1">
                    <span>&copy; {new Date().getFullYear()} Zenith</span>
                </div>

                {/* Center: Slogan */}
                <div className="text-center md:flex-1 md:px-4 order-1 md:order-2 flex flex-col items-center gap-3">
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                    <p className="font-sans italic text-slate-300 font-light tracking-wide text-base sm:text-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                        Mankind was born on Earth. It was never meant to die here.
                    </p>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                </div>

                {/* Right: Links */}
                <div className="flex items-center gap-6 text-xs text-slate-600 uppercase tracking-widest font-bold order-2 md:order-3">
                    <a href="https://github.com/kohld/zenith" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Project</a>
                    <a href="https://github.com/kohld" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
};
