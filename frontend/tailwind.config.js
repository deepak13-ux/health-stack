export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F9FC",
        softblue: "#EAF5FF",
        bluebd: "#C9E5FA",
        primary: { DEFAULT: "#1768AC", hover: "#12558E" },
        lime: { DEFAULT: "#D9F279", ink: "#334513" },
        ink: "#17324D",
        muted: "#52677B",
        line: "#DCE6EE",
        control: "#7A8FA3",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
