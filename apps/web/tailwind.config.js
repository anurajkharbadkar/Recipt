/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  // The app's own theme toggle (Sidebar.tsx) adds/removes a literal `dark`/
  // `light` class on <html>, but without this, Tailwind's default `media`
  // strategy makes every `dark:` utility follow the OS color scheme instead
  // — so picking "Dark Mode" in-app while the OS is set to light silently did
  // nothing for any element using a `dark:` class. `class` mode makes every
  // existing `dark:` utility in the app finally track the real toggle.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Colors
        saffron: {
          50:  '#FAF7F0',
          100: '#F7F0E8',
          200: '#F3E6D5',
          300: '#F0D8A0',
          400: '#E8C878',
          500: '#C89B3C',
          600: '#603000',
          700: '#502000',
          800: '#401800',
          900: '#301000',
        },
        royal: {
          50:  '#f0f5fa',
          100: '#dbe6f4',
          200: '#b8cde8',
          500: '#1d5fa8',
          600: '#0F3870',
          700: '#0a2750',
          800: '#061a36',
          900: '#030e20',
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
          300: '#F0D8A0',
          400: '#E8C878',
          500: '#C89B3C',
          600: '#A97C24',
        },
        success: {
          500: '#159447',
          600: '#117a3a',
        },
        // Theme-aware foreground token
        theme: {
          fg: 'rgb(var(--fg-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        devanagari: ['var(--font-noto)', 'Noto Sans Devanagari', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #502000 0%, #603000 50%, #C89B3C 100%)',
        'gradient-royal': 'linear-gradient(135deg, #0F3870 0%, #1d5fa8 50%, #C89B3C 100%)',
        'gradient-premium': 'linear-gradient(135deg, #120D08 0%, #29190B 50%, #C89B3C 100%)',
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
        'glow-saffron': '0 0 20px rgba(89, 46, 9, 0.35)',
        'glow-gold': '0 0 20px rgba(210, 164, 109, 0.35)',
        card: '0 4px 24px rgba(0,0,0,0.25)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
