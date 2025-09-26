/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,tsx,jsx,ts,html}"],
	theme: {
		extend: {
			colors: {
				accent: "var(--accent-color)",
				codebg: "var(--code-bg-color)",
				accentLight: "var(--accent-light-color)",
			},
			fontFamily: {
				geist: "var(--font-geist)",
			},
			screens: {
				xs: "420px",
				sm: "640px",
				md: "900px",
				lg: "1024px",
				xl: "1280px",
				"1.5xl": "1440px",
				"2xl": "1536px",
				"3xl": "1800px",
			},
		},
	},
	plugins: [],
};
