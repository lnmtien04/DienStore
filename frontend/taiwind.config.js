module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'w-6', 'h-6', 'text-white', 'shadow-md',
    'bg-yellow-500', 'bg-blue-500', 'bg-purple-500',
    'bg-green-500', 'bg-orange-500',
    'text-yellow-500', 'text-blue-500', 'text-purple-500',
    'text-green-500', 'text-orange-500',
    'bg-yellow-50', 'bg-blue-50', 'bg-purple-50',
    'bg-green-50', 'bg-orange-50',
  ],
  theme: {
    extend: {
      // Mở rộng maxWidth
      maxWidth: {
        '8xl': '90rem', // 1440px
        '9xl': '100rem', // 1600px
      },
      // Mở rộng màu sắc
      colors: {
        'dark-background': '#000005',
        'dark-background-secondary': '#111827',
        'dark-background-tertiary': '#1F2937',
        'dark-text': '#F0F8FF',
        'dark-title': '#FFFFFF',
        'dark-note': '#D1D5DB',
        'dark-note-tertiary': '#9CA3AF',
        'dark-border': '#374151',
        'dark-alt-text-1': '#3B82F6',
        'dark-alt-text-2': '#2563EB',
        'dark-alt-text-5': '#6B7280',
        'light-background': '#F9FAFB',
        'light-background-secondary': '#FFFFFF',
        'light-background-tertiary': '#E5E7EB',
        'light-background-quaternary': '#F3F4F6',
        'light-text': '#1F2937',
        'light-title': '#000000',
        'light-note': '#6B7280',
        'light-note-secondary': '#9CA3AF',
        'light-border': '#E5E7EB',
        'light-alt-text-1': '#3B82F6',
        'light-alt-text-2': '#2563EB',
        'light-alt-text-5': '#4B5563',
      },
    },
  },
  plugins: [],
};