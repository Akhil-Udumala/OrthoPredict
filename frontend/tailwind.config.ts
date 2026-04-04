import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(189 16% 83%)",
        input: "hsl(185 22% 96%)",
        ring: "hsl(185 74% 33%)",
        background: "hsl(180 18% 97%)",
        foreground: "hsl(197 33% 12%)",
        primary: {
          DEFAULT: "hsl(187 71% 31%)",
          foreground: "hsl(180 20% 98%)",
        },
        secondary: {
          DEFAULT: "hsl(188 24% 92%)",
          foreground: "hsl(197 33% 15%)",
        },
        muted: {
          DEFAULT: "hsl(184 22% 93%)",
          foreground: "hsl(199 18% 40%)",
        },
        accent: {
          DEFAULT: "hsl(164 59% 43%)",
          foreground: "hsl(180 20% 98%)",
        },
        destructive: {
          DEFAULT: "hsl(6 76% 50%)",
          foreground: "hsl(0 0% 98%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100% / 0.88)",
          foreground: "hsl(197 33% 12%)",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        soft: "0 24px 60px -28px rgba(15, 56, 66, 0.28)",
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "mesh-glow":
          "radial-gradient(circle at 20% 20%, rgba(93, 221, 195, 0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(56, 189, 248, 0.14), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.7), rgba(237, 246, 246, 0.9))",
      },
    },
  },
  plugins: [],
};

export default config;
