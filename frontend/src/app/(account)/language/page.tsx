'use client';

import { useLanguage } from '@/context/LanguageContext';
import { CheckIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文 (Trung Quốc)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Nhật Bản)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Hàn Quốc)', flag: '🇰🇷' },
  { code: 'fr', name: 'Français (Pháp)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (Đức)', flag: '🇩🇪' },
  { code: 'es', name: 'Español (Tây Ban Nha)', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский (Nga)', flag: '🇷🇺' },
];

export default function LanguagePage() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ngôn ngữ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`
              flex items-center justify-between p-4 rounded-lg border-2 transition-all
              ${language === lang.code
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-gray-900 dark:text-white">{lang.name}</span>
            </div>
            {language === lang.code && (
              <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}