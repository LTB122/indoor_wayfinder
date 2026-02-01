// InspectorPanel bây giờ nhận props `node` để hiển thị
export const InspectorPanel = ({ data, type }: { data: any; type: "node" | "edge" | null }) => {
    // 1. Nếu chưa chọn gì thì hiển thị màn hình chờ
    if (!data || !type) {
        return (
            <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">touch_app</span>
                <p className="text-sm">Click vào một địa điểm hoặc đường nối để xem chi tiết</p>
            </aside>
        );
    }

    return (
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* HEADER: Tiêu đề thay đổi tùy theo Node hay Edge */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{type === "node" ? "Node Details" : "Edge Properties"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">ID: {data.id}</span>
                </div>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-1">{type === "node" ? data.name : "Path Connection"}</h2>
                {type === "node" && data.description && <p className="text-slate-500 dark:text-[#92adc9] text-xs mt-1">{data.description}</p>}
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* ============================== */}
                {/* TRƯỜNG HỢP 1: HIỂN THỊ NODE    */}
                {/* ============================== */}
                {type === "node" ? (
                    <>
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-lg">domain</span>
                                Chi tiết
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Chỉnh sửa thông tin
                            </button>
                        </div>

                        {/* Coordinates */}
                        <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-50 dark:bg-[#192633] border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-mono uppercase">Tọa độ X</span>
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{data.x}</span>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-[#233648]"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-mono uppercase">Tọa độ Y</span>
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{data.y}</span>
                            </div>
                        </div>

                        {/* Aliases Section (Đã sửa lỗi hiển thị) */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Aliases</h3>
                                <button className="text-primary text-xs font-bold hover:underline">+ Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.aliases && data.aliases.length > 0 ? (
                                    data.aliases.map((alias: string, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#233648] text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                        >
                                            <span>{alias}</span>
                                            <span className="material-symbols-outlined text-xs cursor-pointer opacity-60 hover:opacity-100">close</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No aliases</span>
                                )}
                            </div>
                        </div>

                        {/* Flags (Chỉ hiện nếu có dữ liệu flags) */}
                        {data.flags && (
                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Accessibility</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">accessible</span>Wheelchair
                                        </span>
                                        <input
                                            checked={data.flags.wheelchair}
                                            readOnly
                                            type="checkbox"
                                            className="rounded text-primary focus:ring-primary bg-transparent"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* ============================== */
                    /* TRƯỜNG HỢP 2: HIỂN THỊ EDGE    */
                    /* ============================== */
                    <>
                        <div className="flex flex-col gap-4">
                            {/* Thông tin kết nối */}
                            <div className="p-4 bg-slate-50 dark:bg-[#192633] rounded border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs text-slate-500">Type</span>
                                    <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{data.type}</span>
                                </div>
                                <div className="h-px bg-slate-200 dark:bg-[#233648] my-2"></div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-500">Start Node</span>
                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{data.start_node_id}</span>
                                </div>
                                <div className="flex justify-center text-slate-400 my-1">
                                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">End Node</span>
                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{data.end_node_id}</span>
                                </div>
                            </div>

                            {/* Thông số kỹ thuật */}
                            <div className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-[#192633]">
                                <span className="text-sm font-medium dark:text-slate-300">Weight</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold font-mono">{data.weight}</span>
                                    <span className="text-xs text-slate-400">m</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-[#192633]">
                                <span className="text-sm font-medium dark:text-slate-300">Bidirectional</span>
                                <input
                                    type="checkbox"
                                    checked={data.bidirectional}
                                    readOnly
                                    className="rounded border-slate-300 text-primary h-4 w-4 bg-transparent"
                                />
                            </div>

                            {/* Waypoints / Polyline Section */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Waypoints</span>
                                    {data.polyline && data.polyline.length > 0 && (
                                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                            {data.polyline.length} points
                                        </span>
                                    )}
                                </div>

                                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
                                    {data.polyline && data.polyline.length > 0 ? (
                                        // Trường hợp có điểm gấp khúc: Hiển thị danh sách đẹp
                                        <div className="flex flex-col gap-2 relative">
                                            {/* Đường kẻ nối mờ mờ làm nền */}
                                            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-600 z-0"></div>

                                            {data.polyline.map((point: { x: number; y: number }, index: number) => (
                                                <div key={index} className="flex items-center gap-3 relative z-10">
                                                    {/* Số thứ tự hình tròn */}
                                                    <div className="flex-none size-5 rounded-full bg-white dark:bg-slate-700 border border-primary/30 flex items-center justify-center shadow-sm">
                                                        <span className="text-[9px] font-bold text-primary">{index + 1}</span>
                                                    </div>

                                                    {/* Tọa độ được format gọn gàng */}
                                                    <div className="flex-1 flex items-center gap-2 text-xs bg-white dark:bg-slate-700 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-600 shadow-sm font-mono text-slate-600 dark:text-slate-300">
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-[9px] text-slate-400 uppercase">X:</span>
                                                            <span>{point.x}</span>
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-500">|</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-[9px] text-slate-400 uppercase">Y:</span>
                                                            <span>{point.y}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Trường hợp đường thẳng: Hiển thị thông báo đẹp hơn
                                        <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-xs">
                                            <span className="material-symbols-outlined text-sm opacity-70">straight</span>
                                            <span>Đường thẳng trực tiếp</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-dashed border-slate-300 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200">
                            <span className="material-symbols-outlined text-lg">delete</span>
                            <span className="text-xs font-semibold">Remove Connection</span>
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};
