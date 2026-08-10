import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The store's accent colour. Change this one value to re-skin the site.
        brand: {
          50: '#f2f7f5',
          100: '#dfece7',
          200: '#bfd9cf',
          300: '#93bdae',
          400: '#659c89',
          500: '#47806e',
          600: '#356658',
          700: '#2b5249',
          800: '#25423b',
          900: '#213832',
          950: '#0f1f1b',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
