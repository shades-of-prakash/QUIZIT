/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./output.css";
function start() {
	document.addEventListener("contextmenu", (e) => {
		if (!window.location.pathname.startsWith("/admin")) {
			e.preventDefault();
		}
	});
	// Prevent global copy events
	document.addEventListener("copy", (e) => {
		if (!window.location.pathname.startsWith("/admin")) {
			e.preventDefault();
		}
	});

	document.addEventListener("keydown", (e) => {
		const isAdmin = window.location.pathname.startsWith("/admin");
		const isCtrlOrCmd = e.ctrlKey || e.metaKey;
		const keyUpper = e.key.toUpperCase();

		// Prevent F12
		if (keyUpper === "F12" && !isAdmin) {
			e.preventDefault();
			return;
		}

		// Aggressively prevent ANY keyboard combination that uses Ctrl, Cmd, or Alt
		if ((isCtrlOrCmd || e.altKey) && !isAdmin) {
			e.preventDefault();
			return;
		}

		// Prevent Screenshot shortcuts (PrintScreen)
		if (e.key === "PrintScreen" && !isAdmin) {
			e.preventDefault();
			navigator.clipboard.writeText("").catch(() => {});
			return;
		}
	});

	// Some browsers fire PrintScreen on keyup instead
	document.addEventListener("keyup", (e) => {
		const isAdmin = window.location.pathname.startsWith("/admin");
		if (e.key === "PrintScreen" && !isAdmin) {
			e.preventDefault();
			navigator.clipboard.writeText("").catch(() => {});
		}
	});
	const root = createRoot(document.getElementById("root")!);
	root.render(<App />);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", start);
} else {
	start();
}
