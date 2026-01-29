import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../translations/en';
import hi from '../translations/hi';

type Language = 'en' | 'hi' | 'es' | 'fr' | 'de';

type Translations = typeof en;

const translations: Record<string, Translations> = {
  en,
  hi,
  // Add more languages here as needed
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const defaultLanguage: Language = 'en';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage, fallback to browser language or default
    const savedLang = localStorage.getItem('appLanguage') as Language | null;
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    
    // Get browser language (first 2 characters)
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      return browserLang;
    }
    
    return defaultLanguage;
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  // Get translations for current language, fallback to English if not available
  const t = translations[language] || translations[defaultLanguage];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
