import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/tailwind-datepicker-react/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        eerieblack: "#1C1C1C",
        raisinblack: "#232323",
        light: "#E0E0E0",
        charleston: "#2A2A2A",
        primary: "#37996b",
        primarydark: "#32805c",
        fadedgrey: "#525252",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
  mode: "jit",
};

export default config;
