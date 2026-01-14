
import { useEffect, useState } from 'react';
import { Launch, LaunchData } from '../../lib/definitions';
import { LaunchDetailModal } from './LaunchDetailModal';
import { LaunchHero } from './LaunchHero';
import { UpcomingLaunches } from './UpcomingLaunches';

export const LaunchGateway = () => {
    const [launches, setLaunches] = useState<Launch[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextLaunch, setNextLaunch] = useState<Launch | null>(null);
    const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/launches.json`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data: LaunchData) => {
                const upcoming = data.launches.filter(l => new Date(l.net).getTime() > Date.now());
                setLaunches(upcoming);
                if (upcoming.length > 0) {
                    setNextLaunch(upcoming[0]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load launches", err);
                setLoading(false);
            });
    }, []);

    // Countdown Timer
    useEffect(() => {
        if (!nextLaunch) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const launchTime = new Date(nextLaunch.net).getTime();
            const distance = launchTime - now;

            if (distance < 0) {
                // Launch passed
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextLaunch]);

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-2 border-cyan-500 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent mb-6">
                Launch Gateway
            </h2>

            <div className="flex flex-col lg:flex-row gap-8 w-full">
                {/* HERO: Next Launch */}
                <div className="lg:w-2/3 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Next Mission</h3>
                    <LaunchHero nextLaunch={nextLaunch} timeLeft={timeLeft} />
                </div>

                {/* SIDEBAR: Upcoming List */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upcoming Schedule</h3>
                    <UpcomingLaunches launches={launches} onSelectLaunch={setSelectedLaunch} />
                </div>
            </div >

            {/* MODAL */}
            {selectedLaunch && <LaunchDetailModal launch={selectedLaunch} onClose={() => setSelectedLaunch(null)} />}
        </div >
    );
};
