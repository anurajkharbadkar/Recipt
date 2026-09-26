import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import './LanguageSwitcher.css';

export default function LanguageSwitcher({ className = '', isHero = false }) {
  const { language, setLanguage, supportedLanguages, currentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = supportedLanguages.findIndex(l => l.code === language);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % supportedLanguages.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + supportedLanguages.length) % supportedLanguages.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < supportedLanguages.length) {
          setLanguage(supportedLanguages[focusedIndex].code);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, focusedIndex, supportedLanguages, language, setLanguage]);

  // Auto-focus the focused option in listbox
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, focusedIndex]);

  const toggleDropdown = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        const currentIndex = supportedLanguages.findIndex(l => l.code === language);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return next;
    });
  };

  const selectLanguage = (code) => {
    setLanguage(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`lang-switcher ${isHero ? 'lang-switcher--hero' : ''} ${isOpen ? 'lang-switcher--open' : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        id="language-switcher-button"
        className="lang-switcher__trigger"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-switcher-listbox"
        aria-label={`${t('switchLanguage', 'Select Language')}: ${currentLanguage.label}`}
      >
        {/* Minimalist Globe / Language Icon */}
        <svg
          className="lang-switcher__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        <span className="lang-switcher__label">{currentLanguage.label}</span>

        {/* Chevron Icon */}
        <svg
          className={`lang-switcher__chevron ${isOpen ? 'lang-switcher__chevron--rotated' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <ul
        ref={listboxRef}
        id="language-switcher-listbox"
        className={`lang-switcher__dropdown ${isOpen ? 'lang-switcher__dropdown--visible' : ''}`}
        role="listbox"
        aria-labelledby="language-switcher-button"
        aria-activedescendant={focusedIndex >= 0 ? `lang-option-${supportedLanguages[focusedIndex]?.code}` : undefined}
        tabIndex={-1}
      >
        {supportedLanguages.map((lang, index) => {
          const isSelected = lang.code === language;
          const isFocused = index === focusedIndex;

          return (
            <li
              key={lang.code}
              id={`lang-option-${lang.code}`}
              role="option"
              aria-selected={isSelected}
              className={`lang-switcher__option ${isSelected ? 'lang-switcher__option--selected' : ''} ${isFocused ? 'lang-switcher__option--focused' : ''}`}
              onClick={() => selectLanguage(lang.code)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <span className="lang-switcher__option-label">{lang.label}</span>
              <span className="lang-switcher__option-code">{lang.shortLabel}</span>
              {isSelected && (
                <svg
                  className="lang-switcher__check"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
