import { useEffect } from "react";

export const MapStyleLoader = () => {
	useEffect(() => {
		const script = document.createElement("script");
		script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
		script.async = true;
		script.onload = () => {
			if (window.tailwind) {
				window.tailwind.config = {
					darkMode: "class",
					theme: {
						extend: {
							colors: { primary: "#137fec", "background-light": "#f6f7f8", "background-dark": "#101922" },
							fontFamily: { display: ["Inter"] },
						},
					},
				};
			}
		};
		document.head.appendChild(script);
		const style = document.createElement("style");
		style.textContent = `
      .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      .blueprint-grid { background-image: radial-gradient(circle, #233648 1px, transparent 1px); background-size: 20px 20px; }
      .node-hover:hover { r: 8px; transition: all 0.2s ease; cursor: pointer; }
    `;
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(script);
			document.head.removeChild(style);
		};
	}, []);
	return null;
};
