<<<<<<< HEAD
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#E86328",
          orangeHover: "#D2541C",
          orangeLight: "#FFF4ED",
          navy: "#131926",
          navyDark: "#0E131F",
          navyText: "#182232",
          warmBg: "#F9F6F0",
          cardBg: "#FFFFFF",
          cardBorder: "#EAE5DC",
          cardBorderHover: "#DDD6C9",
          muted: "#717B8A",
          mutedLight: "#9BA3AF",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
=======
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#E86328",
          orangeHover: "#D2541C",
          orangeLight: "#FFF4ED",
          navy: "#131926",
          navyDark: "#0E131F",
          navyText: "#182232",
          warmBg: "#F9F6F0",
          cardBg: "#FFFFFF",
          cardBorder: "#EAE5DC",
          cardBorderHover: "#DDD6C9",
          muted: "#717B8A",
          mutedLight: "#9BA3AF",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
>>>>>>> 4ee991388fe8faf519ad93740373adace2ecb6d4
