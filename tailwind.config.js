/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f7f5',
          100: '#edecea',
          200: '#d9d7d2',
          300: '#c0bdb5',
          400: '#a5a196',
          500: '#918c7e',
          600: '#847e72',
          700: '#6e695f',
          800: '#5b5750',
          900: '#4b4843',
          950: '#282623',
        },
        paper: {
          50: '#fdfcfb',
          100: '#f9f7f4',
          200: '#f3efe8',
          300: '#e8e2d6',
          400: '#d9d0be',
          500: '#c9bca3',
        },
        accent: {
          rust: '#c45a3b',
          teal: '#2d6a6a',
          gold: '#b8953f',
          navy: '#2c3e50',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

