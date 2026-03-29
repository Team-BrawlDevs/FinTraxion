/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Page wash — cool white with a hint of blue */
        background: '#F5F9FF',
        surface: '#FFFFFF',
        /** Primary brand blues */
        primary: '#2563EB',
        'primary-light': '#DBEAFE',
        'primary-dark': '#1D4ED8',
        'primary-muted': '#93C5FD',
        /** Secondary accents (still harmonize with blue UI) */
        accent: '#0EA5E9',
        'accent-light': '#E0F2FE',
        warning: '#D97706',
        'warning-light': '#FEF3C7',
        danger: '#DC2626',
        'danger-light': '#FEE2E2',
        success: '#059669',
        'success-light': '#D1FAE5',
        /** Text */
        ink: '#172554',
        muted: '#64748B',
        edge: {
          DEFAULT: 'rgba(37, 99, 235, 0.12)',
          strong: 'rgba(29, 78, 216, 0.22)',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.06) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(37, 99, 235, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 1px 0 rgba(37, 99, 235, 0.1), 0 4px 14px rgba(37, 99, 235, 0.08)',
      },
    },
  },
  plugins: [],
}
