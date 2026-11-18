/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          sidebar: '#1E1638', // Dark purple/slate vertical icon navigation bar
          sidebarHover: '#2A1F4E',
          sidebarActive: '#3B2D6B',
          purple: '#6D28D9',
          emerald: '#10B981',
          emeraldDark: '#059669',
          emeraldLight: '#E6F9F2',
          surface: '#FFFFFF',
          bg: '#F4F6FA',
          border: '#E8EDF5',
          textMuted: '#64748B',
          textHeading: '#0F172A',
        },
        finance: {
          dark: '#0B0F19',
          card: '#111827',
          surface: '#161F30',
          border: '#1F293D',
          hover: '#1D283A',
          green: '#10B981',
          red: '#EF4444',
          gold: '#F59E0B',
          cyan: '#06B6D4',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
