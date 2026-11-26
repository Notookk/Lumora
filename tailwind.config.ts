import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
        display: ['Lumora Display', 'Michroma', 'sans-serif'],
      },
      colors: {
        ink: '#07101d',
        frost: 'rgba(12, 18, 32, 0.48)',
        ice: '#b9dcff',
      },
    },
  },
  plugins: [],
} satisfies Config;
