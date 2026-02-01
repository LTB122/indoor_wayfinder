export const TopNavigation = () => (
	<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-6 py-3 z-50">
		<div className="flex items-center gap-8">
			<div className="flex items-center gap-4 text-primary">
				<div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
					<span className="material-symbols-outlined">map</span>
				</div>
				<h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Campus Map Editor</h2>
			</div>
			<nav className="flex items-center gap-6">
				<a className="text-primary text-sm font-semibold border-b-2 border-primary py-1" href="#">
					Map Editor
				</a>
				<a className="text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-primary transition-colors" href="#">
					Building Manager
				</a>
			</nav>
		</div>
		<div className="flex flex-1 justify-end gap-4 items-center">
			<div
				className="bg-slate-200 dark:bg-slate-700 aspect-square bg-cover rounded-full size-8"
				style={{
					backgroundImage:
						'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTqk3ShVeZ8KizqaRgItK0DFmK-VTH12rl67PC9HKvCo1JNHJalkrsYlSXcrf8oFgsae-GuYQFzzm7ghcOXhO6MHqrh__FoqLv1Y8scn3XiioJSlkzEjPUsKmRklVCDesVm4EefnlzKFNBOLbbooZ1xDg_R-TeDNYgDZcpidtePFmzJo8PSy2DtbLDCYl4unLVGn0DIld6vUxyFzIoCI1pI5w_kjTeQ8jf8Cj8Frq7Y9uUrrP5GNrvmakJ_8bDtf0s0vi-_4EBeLOv")',
				}}
			/>
		</div>
	</header>
);