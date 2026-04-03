import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/tailwind-datepicker-react/dist/**/*.js",
  ],
  theme: {
    extend: {
      keyframes: {
        dataWave: {
          '0%, 100%': { height: '1rem' },
          '50%': { height: '4rem' },
        },
        warpSpin: {
          '0%': { transform: 'rotate(0deg) scale(1)', opacity: '1' },
          '50%': { transform: 'rotate(180deg) scale(0.5)', opacity: '0.5' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
        glitch: {
          '0%, 100%': { clipPath: 'inset(50% 0 30% 0)', transform: 'translate(0)' },
          '20%': { clipPath: 'inset(15% 0 65% 0)', transform: 'translate(-2px, 2px)' },
          '40%': { clipPath: 'inset(40% 0 20% 0)', transform: 'translate(2px, -2px)' },
          '60%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(-2px, -2px)' },
          '80%': { clipPath: 'inset(10% 0 80% 0)', transform: 'translate(2px, 2px)' },
        },
        scanLaser: {
          '0%, 100%': { top: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '50%': { top: '100%' },
          '90%': { opacity: '1' },
        },
        dataFlash: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        scanLaser: 'scanLaser 2.5s ease-in-out infinite',
        dataFlash: 'dataFlash 0.8s steps(2, start) infinite',
        warpSpin: 'warpSpin 4s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
        glitch: 'glitch 3s linear infinite',
      },
      colors: {
        eerieblack: "#1C1C1C",
        raisinblack: "#232323",
        light: "#E0E0E0",
        charleston: "#2A2A2A",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        primarydark: "#32805c",
        fadedgrey: "#525252",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
  mode: "jit",
};

export default config;