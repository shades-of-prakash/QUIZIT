/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,tsx,jsx,ts,html}"],
	theme: {
		extend: {
			colors: {
				accent: "var(--accent-color)",
				codebg: "var(--code-bg-color)",
			},
		},
	},
	plugins: [],
};
