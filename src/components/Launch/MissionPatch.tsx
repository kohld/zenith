
import { MissionPatch as MissionPatchType } from '../../lib/definitions';

interface MissionPatchProps {
    patch?: MissionPatchType;
    missionName: string;
    className?: string;
}

export const MissionPatch = ({ patch, missionName, className = "" }: MissionPatchProps) => {
    if (!patch?.image_url) {
        // Fallback or empty state
        return null;
    }

    return (
        <div className={`relative group ${className}`}>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-700"></div>

            <img
                src={patch.image_url}
                alt={`${missionName} Mission Patch`}
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
            />
        </div>
    );
};
