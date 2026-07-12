/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces – deep, premium "operating system" feel
        ink: {
          950: '#080A0F',
          900: '#0B0E14',
          850: '#10141C',
          800: '#141922',
          750: '#1A2029',
          700: '#222A36',
          600: '#2C3644',
        },
        // Primary brand accent – growth / money / real estate
        brand: {
          50: '#E6FFF6',
          100: '#B8FDE6',
          200: '#7DF7CE',
          300: '#3EEBB2',
          400: '#12D99A',
          500: '#00C389',
          600: '#00A374',
          700: '#00805B',
          800: '#046048',
        },
        // Secondary accent – premium gold
        gold: {
          300: '#FFD879',
          400: '#F7C14B',
          500: '#EFA92B',
          600: '#D48A16',
        },
        // Platform brand colors (used in charts / badges)
        instagram: '#E4477E',
        tiktok: '#22D3EE',
        youtube: '#FF5A5A',
        facebook: '#5B8DEF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(0,195,137,0.3), 0 8px 40px -8px rgba(0,195,137,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
