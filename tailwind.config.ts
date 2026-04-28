import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "error-container": "#93000a",
        "secondary": "#b6c4ff",
        "on-secondary-fixed": "#001551",
        "primary-fixed-dim": "#ffb3af",
        "on-primary": "#68000e",
        "inverse-primary": "#bf0024",
        "surface-container-lowest": "#1b0909",
        "surface-container": "#2f1a19",
        "on-secondary-container": "#e4e7ff",
        "on-surface": "#ffdad8",
        "background": "#210e0d",
        "surface-variant": "#462f2e",
        "surface": "#210e0d",
        "on-secondary": "#002780",
        "surface-tint": "#ffb3af",
        "on-tertiary-fixed-variant": "#544600",
        "on-tertiary": "#3a3000",
        "surface-container-low": "#2a1615",
        "secondary-fixed": "#dce1ff",
        "on-error-container": "#ffdad6",
        "on-primary-fixed": "#410006",
        "on-surface-variant": "#e9bcb9",
        "error": "#ffb4ab",
        "tertiary-fixed-dim": "#e9c400",
        "on-tertiary-fixed": "#221b00",
        "surface-bright": "#4b3332",
        "outline": "#b08784",
        "secondary-fixed-dim": "#b6c4ff",
        "surface-container-highest": "#462f2e",
        "surface-dim": "#210e0d",
        "primary-fixed": "#ffdad8",
        "primary": "#ffb3af",
        "surface-container-high": "#3a2423",
        "on-tertiary-container": "#4c3e00",
        "on-primary-fixed-variant": "#930019",
        "on-background": "#ffdad8",
        "primary-container": "#ff5357",
        "outline-variant": "#5f3e3d",
        "on-secondary-fixed-variant": "#0039b3",
        "tertiary": "#e9c400",
        "secondary-container": "#0356ff",
        "on-primary-container": "#5c000b",
        "inverse-on-surface": "#412a29",
        "inverse-surface": "#ffdad8",
        "tertiary-container": "#c9a900",
        "on-error": "#690005",
        "tertiary-fixed": "#ffe16d"
      },
      fontFamily: {
        "label-caps": ["Space Grotesk", "sans-serif"],
        "h3-bout": ["Lexend", "sans-serif"],
        "h2-stadium": ["Lexend", "sans-serif"],
        "transcript-mono": ["Space Grotesk", "monospace"],
        "body-bold": ["Inter", "sans-serif"],
        "h1-heavy": ["Lexend", "sans-serif"],
        "body-main": ["Inter", "sans-serif"],
        "lexend": ["Lexend", "sans-serif"]
      },
      animation: {
        'ring-shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' }
        }
      }
    },
  },
  plugins: [],
};
export default config;
