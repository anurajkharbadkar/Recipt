/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        saffron: {
          50:  '#fff8f0',
          100: '#ffe8cc',
          200: '#ffcc99',
          300: '#ffaa66',
          400: '#ff8833',
          500: '#ff6600',
          600: '#e05500',
          700: '#c84400',
          800: '#a03300',
          900: '#7a2200',
        },
        navy: {
          50:  '#e8ecf0',
          100: '#c5cdd8',
          200: '#9aaab8',
          300: '#6f8799',
          400: '#4d6d81',
          500: '#2b5269',
          600: '#1e3d52',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--bg-color)',
        },
        gold: {
          400: '#ffd54f',
          500: '#ffca28',
          600: '#ffb300',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        devanagari: ['var(--font-noto)', 'Noto Sans Devanagari', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #C85000 0%, #FF8C00 50%, #FFB300 100%)',
        'gradient-navy': 'linear-gradient(135deg, #0d1e2c 0%, #142d3d 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
      boxShadow: {
        'glow-saffron': '0 0 20px rgba(255, 102, 0, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 179, 0, 0.3)',
        card: '0 4px 24px rgba(0,0,0,0.25)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
