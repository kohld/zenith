
import { Launch } from '../../lib/definitions';
import { getStatusColor } from './utils';

interface UpcomingLaunchesProps {
    launches: Launch[];
    onSelectLaunch: (launch: Launch) => void;
}

export const UpcomingLaunches = ({ launches, onSelectLaunch }: UpcomingLaunchesProps) => {
    return (
        <div className="flex-grow space-y-4">
            {launches.slice(1, 6).map((launch) => (
                <div
                    key={launch.id}
                    onClick={() => onSelectLaunch(launch)}
                    className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-mono text-cyan-500/80">
                            {new Date(launch.net).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            {(launch.webcast_live || (launch.vidURLs?.length ?? 0) > 0 || (launch.vid_urls?.length ?? 0) > 0) && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Live
                                </div>
                            )}
                            <div className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getStatusColor(launch.status.id)}`}>
                                {launch.status.abbrev}
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate" title={launch.name}>
                        {launch.name}
                    </h4>

                    <div className="text-sm text-slate-400 mt-1 truncate">
                        {launch.launch_service_provider.name}
                    </div>

                    {launch.mission?.type && (
                        <div className="mt-2 text-[10px] w-fit px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 uppercase tracking-wide">
                            {launch.mission.type}
                        </div>
                    )}

                    <div className="mt-3 flex items-center text-xs text-slate-500">
                        <span className="truncate max-w-[200px]">{launch.pad.name}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
