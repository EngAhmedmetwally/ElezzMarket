
"use client"

import * as React from "react"

type Language = "en" | "ar"

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type LanguageProviderState = {
  language: Language
  setLanguage: (language: Language) => void
  isRTL: boolean
}

const initialState: LanguageProviderState = {
  language: "en",
  setLanguage: () => null,
  isRTL: false,
}

const LanguageProviderContext =
  React.createContext<LanguageProviderState>(initialState)

export function LanguageProvider({
  children,
  defaultLanguage = "en",
  storageKey = "app-language",
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = React.useState<Language | null>(null)

  React.useEffect(() => {
    let storedItem: string | null = null;
    try {
      storedItem = localStorage.getItem(storageKey);
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }

    if (storedItem && (storedItem === 'en' || storedItem === 'ar')) {
      setLanguage(storedItem as Language)
    } else {
      setLanguage(defaultLanguage)
    }
  }, [storageKey, defaultLanguage]);

  React.useEffect(() => {
    if (language) {
      const root = window.document.documentElement
      root.classList.remove("en", "ar")
      root.classList.add(language)
      root.setAttribute("dir", language === "ar" ? "rtl" : "ltr")
      try {
        localStorage.setItem(storageKey, language)
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }
  }, [language, storageKey])

  if (!language) {
    return null; // or a loading component
  }

  const value = {
    language,
    setLanguage: (lang: Language) => setLanguage(lang),
    isRTL: language === "ar",
  }

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = React.useContext(LanguageProviderContext)

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider")

  return context
}
