import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0a0c10',
          900: '#070809',
          800: '#0e1117',
          700: '#141821',
          600: '#1c222e',
          500: '#2a313f',
        },
        amber: {
          DEFAULT: '#f0a830',
          bright: '#ffc861',
          dim: '#b87d1f',
        },
        signal: {
          thrive: '#43d17a',
          stable: '#5fb8d6',
          setback: '#e8a23d',
          peril: '#e5564b',
        },
        fog: {
          DEFAULT: '#c3cad6',
          muted: '#7e889a',
          faint: '#525c6e',
        },
      },
      fontFamily: {
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.24em',
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(195,202,214,0.06), 0 24px 60px -34px rgba(0,0,0,0.9)',
        amber: '0 0 0 1px rgba(240,168,48,0.4), 0 0 32px -8px rgba(240,168,48,0.45)',
      },
      keyframes: {
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'flash-amber': {
          '0%': { boxShadow: '0 0 0 0 rgba(240,168,48,0)' },
          '30%': { boxShadow: '0 0 0 1px rgba(255,200,97,0.9), 0 0 36px -6px rgba(240,168,48,0.6)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240,168,48,0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'scan': 'scan 6s linear infinite',
        'blink': 'blink 1.1s step-end infinite',
        'flash-amber': 'flash-amber 1.6s ease-out',
        'spin-slow': 'spin-slow 1.1s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
