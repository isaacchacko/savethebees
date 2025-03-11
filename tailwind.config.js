module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", // Include src directory if used
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [],
      },
      dropShadow: {
        glow: [
          "0 0 10px rgba(96, 165, 250, 0.3)",
          "0 0 20px rgba(96, 165, 250, 0.2)",
          "0 0 30px rgba(96, 165, 250, 0.1)"
        ]
      },
    },
  },
  plugins: [
  ],
};
