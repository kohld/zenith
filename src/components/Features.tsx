

const FeatureCard = ({ title, description, iconPath }: { title: string; description: string; iconPath: string }) => (
    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors group">
        <div className="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path>
            </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

export const Features = () => {
    return (
        <section className="py-20 bg-slate-800/50">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Lightning Fast"
                        description="Powered by Vite, your app loads instantly and updates in real-time."
                        iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                    <FeatureCard
                        title="Modern Design"
                        description="Tailwind CSS v3 configured for premium, responsive layouts out of the box."
                        iconPath="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                    <FeatureCard
                        title="Deploy Anywhere"
                        description="Ready for GitHub Pages with a pre-configured workflow."
                        iconPath="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                </div>
            </div>
        </section>
    );
};
