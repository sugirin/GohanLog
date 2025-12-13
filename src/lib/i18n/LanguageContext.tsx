import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from './translations';

// Recursive type helper to get path of nested keys (e.g. 'nav.record')
// Simplify for now: we know the structure. We can improve typing if needed.
// For now, let's use a simple key accessor or just typed return.

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ja');

    useEffect(() => {
        const saved = localStorage.getItem('app-language') as Language;
        if (saved && (saved === 'ja' || saved === 'en')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
    };

    const t = (path: string, params?: Record<string, string>): string => {
        const keys = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                return path;
            }
            current = current[key];
        }

        let result = current as string;
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, value);
            });
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
}
