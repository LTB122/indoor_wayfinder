export const ToolsPanel = () => (
	<aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col p-4 gap-6">
		{/* (Giữ nguyên nội dung ToolsPanel cũ) */}
		<div className="flex flex-col gap-2">
			<h1 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest opacity-50">Tools</h1>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white shadow-sm cursor-pointer">
					<span className="material-symbols-outlined text-xl">near_me</span>
					<p className="text-sm font-medium">Select Tool</p>
				</div>
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#192633] cursor-pointer transition-colors">
					<span className="material-symbols-outlined text-xl">add_circle</span>
					<p className="text-sm font-medium">Add Node</p>
				</div>
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#192633] cursor-pointer transition-colors">
					<span className="material-symbols-outlined text-xl">conversion_path</span>
					<p className="text-sm font-medium">Add Edge</p>
				</div>
			</div>
		</div>
		<div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
			<div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
				<span>LAT: 42.3601 N</span>
				<span>LON: 71.0589 W</span>
			</div>
		</div>
	</aside>
);
