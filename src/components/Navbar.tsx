

interface NavbarProps {
    currentView: 'dashboard' | 'orbital' | 'deepspace' | 'gateway' | 'weather';
    onViewChange: (view: 'dashboard' | 'orbital' | 'deepspace' | 'gateway' | 'weather') => void;
}

export const Navbar = ({ currentView, onViewChange }: NavbarProps) => {
    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-slate-900/80 backdrop-blur-md" aria-label="Main Navigation">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('dashboard'); }} className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className="self-center text-2xl font-bold whitespace-nowrap bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Zenith</span>
                </a>
                <div className="flex md:w-auto items-center gap-4" id="navbar-default">
                    <ul className="font-medium flex flex-row md:space-x-6 items-center gap-4 md:gap-0">
                        <li>
                            <button
                                onClick={() => onViewChange('orbital')}
                                className={`text-base md:text-lg font-semibold py-1 px-2 md:py-2 rounded md:p-0 transition-colors ${currentView === 'orbital' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
                                aria-current={currentView === 'orbital' ? 'page' : undefined}
                            >
                                <span className="md:hidden">Orbital</span>
                                <span className="hidden md:inline">Orbital Radar</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => onViewChange('weather')}
                                className={`text-base md:text-lg font-semibold py-1 px-2 md:py-2 rounded md:p-0 transition-colors ${currentView === 'weather' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}
                                aria-current={currentView === 'weather' ? 'page' : undefined}
                            >
                                <span className="md:hidden">Weather</span>
                                <span className="hidden md:inline">Space Weather</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => onViewChange('deepspace')}
                                className={`text-base md:text-lg font-semibold py-1 px-2 md:py-2 rounded md:p-0 transition-colors ${currentView === 'deepspace' ? 'text-purple-400' : 'text-slate-300 hover:text-white'}`}
                                aria-current={currentView === 'deepspace' ? 'page' : undefined}
                            >
                                <span className="md:hidden">DSN</span>
                                <span className="hidden md:inline">Deep Space Network</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => onViewChange('gateway')}
                                className={`text-base md:text-lg font-semibold py-1 px-2 md:py-2 rounded md:p-0 transition-colors ${currentView === 'gateway' ? 'text-rose-500' : 'text-slate-300 hover:text-white'}`}
                                aria-current={currentView === 'gateway' ? 'page' : undefined}
                            >
                                <span className="md:hidden">Launch</span>
                                <span className="hidden md:inline">Launch Gateway</span>
                            </button>
                        </li>
                        <li>
                            <div className="h-5 w-px bg-white/10 mx-2 hidden md:block"></div>
                        </li>
                        <li>
                            <a href="https://github.com/kohld/zenith" target="_blank" rel="noopener noreferrer" className="block py-1 px-2 text-gray-300 hover:text-white md:p-0 transition-colors" title="View on GitHub" aria-label="View Source Code on GitHub">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};
