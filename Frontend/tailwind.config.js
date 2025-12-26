/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Mode Backgrounds
        'dark-bg': '#0B0B0F',
        'dark-bg-alt': '#0E0E13',
        'dark-card': '#14141D',
        'dark-border': '#2A2A3A',
        
        // Text Colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#B8B8C5',
        'text-muted': '#8A8AA3',
        
        // Brand Purple-Pink
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#7C3AED', // Main Purple
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#EC4899', // Main Pink
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Neon Glow Colors
        'neon-purple': 'rgba(124, 58, 237, 0.25)',
        'neon-pink': 'rgba(236, 72, 153, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'neon-purple': '0 0 25px rgba(124, 58, 237, 0.4)',
        'neon-pink': '0 0 25px rgba(236, 72, 153, 0.4)',
        'neon-glow': '0 0 30px rgba(124, 58, 237, 0.3), 0 0 60px rgba(236, 72, 153, 0.2)',
      },
    },
  },
  plugins: [],
}
