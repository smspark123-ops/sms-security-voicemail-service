
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        maroon: {
          DEFAULT: '#7a1f3d',
          dark: '#641731',
          light: '#8b2242',
          50: '#fbf4f7',
        },
        ink: '#1d1d1f',
        canvas: '#f5f5f7',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)',
        float: '0 8px 30px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
}
