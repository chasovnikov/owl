/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        accent: {
          DEFAULT: '#5B6AF0',
          end: '#9B6BFF',
        },
        fumi: {
          50:  '#F0F1FE',
          100: '#E1E4FD',
          200: '#C3C8FB',
          300: '#9BA5F8',
          400: '#7882F4',
          500: '#5B6AF0',
          600: '#4452E8',
          700: '#3540D4',
          800: '#2B34AC',
          900: '#252D87',
        },
        surface: {
          0: '#F3F3F8',
          1: '#FFFFFF',
        }
      },
      borderRadius: {
        'xs': '0.5rem',
        'sm': '0.75rem',
        DEFAULT: '1rem',
        'lg': '1.25rem',
        'xl': '1.5rem',
      },
      boxShadow: {
        'xs': '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        'sm': '0 2px 10px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'md': '0 6px 24px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)',
        'lg': '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        'accent': '0 4px 16px rgba(91,106,240,0.30)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.35s ease forwards',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
