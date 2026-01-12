

export const Footer = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 py-8">
            <div className="container mx-auto px-4 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} Zenith Project. Open Source under <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">MIT License</a>.</p>
            </div>
        </footer>
    );
};
