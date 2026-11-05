const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/renderer/**/*.{js,ts,jsx,tsx}'),
    './apps/desktop/index.html',
    './apps/desktop/src/renderer/**/*.{js,ts,jsx,tsx}',
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090E17',
          900: '#060A10',
          800: '#090E17',
          700: '#0D1420',
        },
        graphite: {
          DEFAULT: '#111B2A',
          card: '#111B2A',
          subtle: '#142032',
          hover: '#18273D',
        },
        slateBorder: {
          DEFAULT: '#29364A',
          light: '#1D2A3C',
          muted: '#243144',
        },
        cyanBrand: {
          DEFAULT: '#37C8F2',
          hover: '#29B2DC',
          glow: 'rgba(55, 200, 242, 0.15)',
          deep: '#0F4D63',
        },
        violetBrand: {
          DEFAULT: '#A58BFA',
          hover: '#906DF8',
          glow: 'rgba(165, 139, 250, 0.15)',
        },
        severity: {
          critical: '#DC2626',
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#38BDF8',
          info: '#94A3B8',
          success: '#22C55E',
        },
        textMain: '#F1F5F9',
        textMuted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(55, 200, 242, 0.15)',
        'cyan-glow-lg': '0 0 25px rgba(55, 200, 242, 0.25)',
        'violet-glow': '0 0 15px rgba(165, 139, 250, 0.15)',
      },
    },
  },
  plugins: [],
};
