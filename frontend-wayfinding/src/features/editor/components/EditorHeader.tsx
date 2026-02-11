import Link from "next/link";

interface EditorHeaderProps {
    mapName?: string;
    lastSaved?: string;
    onSave?: () => void;
    onPublish?: () => void;
}

export const EditorHeader = ({ mapName = "Untitled Map", lastSaved, onSave }: EditorHeaderProps) => {
    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30">
            {/* LEFT: BACK BUTTON & BREADCRUMB */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/maps" 
                    className="flex items-center justify-center size-8 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Back to Dashboard"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
            </div>

            {/* MIDDLE: ACTION TOOLS (Undo/Redo) - Optional */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-lg">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-orange-200 uppercase tracking-wider">
                            Editor Mode
                        </span>
                        <span className="text-xs text-slate-400">Last saved: {lastSaved || "Just now"}</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">{mapName}</h2>
                </div>
            </div>

            {/* RIGHT: SAVE ACTIONS */}
            <div className="flex items-center gap-3">
                
            </div>
        </header>
    );
};