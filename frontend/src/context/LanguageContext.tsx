'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import axios from 'axios';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token, refreshUser } = useUser();
  const [language, setLanguage] = useState('vi');
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    if (user?.preferredLanguage) {
      setLanguage(user.preferredLanguage);
      loadTranslations(user.preferredLanguage);
    } else {
      const savedLang = localStorage.getItem('language') || 'vi';
      setLanguage(savedLang);
      loadTranslations(savedLang);
    }
  }, [user]);

const loadTranslations = async (lang: string) => {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (!res.ok) {
      console.warn(`Không tìm thấy file ${lang}.json, dùng object rỗng`);
      setTranslations({});
      return;
    }
    const text = await res.text(); // lấy text thay vì json trực tiếp
    if (!text.trim()) {
      console.warn(`File ${lang}.json rỗng, dùng object rỗng`);
      setTranslations({});
      return;
    }
    const data = JSON.parse(text); // parse thủ công để bắt lỗi rõ hơn
    setTranslations(data);
  } catch (error) {
    console.error('Lỗi tải translations:', error);
    setTranslations({}); // fallback an toàn
  }
};

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    await loadTranslations(lang);

    if (user && token) {
      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/preferences`,
          { preferredLanguage: lang },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (refreshUser) refreshUser();
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};