/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Orbitron"', '"Inter"', 'sans-serif'],
      },
      colors: {
        neon: {
          purple: '#b026ff',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          pink: '#f472b6',
        },
        void: {
          950: '#05050a',
          900: '#0b0b14',
          800: '#12121f',
          700: '#1c1c2e',
        },
      },
      boxShadow: {
        neon: '0 0 12px rgba(176, 38, 255, 0.55), 0 0 32px rgba(99, 102, 241, 0.25)',
        'neon-sm': '0 0 8px rgba(176, 38, 255, 0.45)',
        'neon-inset': 'inset 0 0 12px rgba(139, 92, 246, 0.25)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { textShadow: '0 0 8px rgba(176,38,255,.7), 0 0 24px rgba(99,102,241,.4)' },
          '50%': { textShadow: '0 0 16px rgba(176,38,255,1), 0 0 40px rgba(99,102,241,.7)' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'fade-up': 'fadeUp .35s ease-out both',
      },
    },
  },
  plugins: [],
};
