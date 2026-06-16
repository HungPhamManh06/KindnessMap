import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { translateText } from '../i18n/dictionary';

const LANGUAGE_STORAGE_KEY = 'kindness_language';
const SUPPORTED_LANGUAGES = ['vi', 'en'];

const LanguageContext = createContext(null);

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'vi';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(stored) ? stored : 'vi';
};

const SKIP_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];

const shouldSkipNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TEXT_TAGS.has(parent.tagName)) return true;
  if (parent.closest('[data-no-i18n="true"]')) return true;
  return false;
};

const translateTextNode = (node, language) => {
  if (shouldSkipNode(node)) return;
  const current = node.textContent;
  if (!current || !current.trim()) return;

  const original = node.__kindnessOriginalText;
  const translatedOriginal = original ? translateText(original, language) : null;

  if (!original || (current !== original && current !== translatedOriginal)) {
    node.__kindnessOriginalText = current;
  }

  const next = translateText(node.__kindnessOriginalText, language);
  if (current !== next) node.textContent = next;
};

const getAttrStoreName = (attr) => `data-kindness-original-${attr.replace(/[^a-z0-9]/gi, '-')}`;

const translateElementAttributes = (element, language) => {
  if (element.closest?.('[data-no-i18n="true"]')) return;

  TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
    if (!element.hasAttribute(attr)) return;
    const current = element.getAttribute(attr);
    if (!current || !current.trim()) return;

    const storeName = getAttrStoreName(attr);
    const original = element.getAttribute(storeName);
    const translatedOriginal = original ? translateText(original, language) : null;

    if (!original || (current !== original && current !== translatedOriginal)) {
      element.setAttribute(storeName, current);
    }

    const next = translateText(element.getAttribute(storeName), language);
    if (current !== next) element.setAttribute(attr, next);
  });
};

const translateTree = (root, language) => {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, language);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TEXT_TAGS.has(node.tagName) || node.closest?.('[data-no-i18n="true"]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
      return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, language);
    if (node.nodeType === Node.ELEMENT_NODE) translateElementAttributes(node, language);
    node = walker.nextNode();
  }
};

const DOMTranslationBridge = ({ language }) => {
  const isTranslatingRef = useRef(false);
  const frameRef = useRef(null);
  const nativeConfirmRef = useRef(typeof window !== 'undefined' ? window.confirm : null);

  const runTranslation = useCallback(() => {
    if (typeof document === 'undefined' || isTranslatingRef.current) return;
    isTranslatingRef.current = true;
    try {
      document.documentElement.lang = language === 'en' ? 'en' : 'vi';
      document.title = language === 'en'
        ? 'KindnessMap – Map of Good Deeds'
        : 'KindnessMap – Bản Đồ Việc Tốt';
      translateTree(document.body, language);
    } finally {
      window.setTimeout(() => {
        isTranslatingRef.current = false;
      }, 0);
    }
  }, [language]);

  useEffect(() => {
    runTranslation();
  }, [language, runTranslation]);

  useEffect(() => {
    if (typeof window === 'undefined' || !nativeConfirmRef.current) return undefined;
    window.confirm = (message) => nativeConfirmRef.current(translateText(String(message), language));
    return () => {
      window.confirm = nativeConfirmRef.current;
    };
  }, [language]);

  useEffect(() => {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return undefined;

    const schedule = () => {
      if (isTranslatingRef.current || frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        runTranslation();
      });
    };

    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;
      if (mutations.some((mutation) => mutation.type === 'childList' || mutation.type === 'characterData' || mutation.type === 'attributes')) {
        schedule();
      }
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [runTranslation]);

  return null;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const normalized = SUPPORTED_LANGUAGES.includes(nextLanguage) ? nextLanguage : 'vi';
    setLanguageState(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  }, [language, setLanguage]);

  const t = useCallback((text) => translateText(text, language), [language]);

  const value = useMemo(
    () => ({ language, isVietnamese: language === 'vi', isEnglish: language === 'en', setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <DOMTranslationBridge language={language} />
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
