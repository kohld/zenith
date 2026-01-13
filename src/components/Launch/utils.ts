export const getStatusColor = (statusId: number) => {
    switch (statusId) {
        case 1: // Go
        case 3: // Success
            return "bg-green-500/20 text-green-400 border-green-500/30";
        case 2: // TBD
            return "bg-orange-500/20 text-orange-400 border-orange-500/30";
        case 8: // TBC
            return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        case 4: // Failure
        case 6: // Hold
            return "bg-red-500/20 text-red-400 border-red-500/30";
        default:
            return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
};
