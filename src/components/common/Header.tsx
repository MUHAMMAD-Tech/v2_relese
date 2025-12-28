// LETHEX Header Component - Language and Theme Switchers
import { Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, Language } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: t('language.english') },
    { code: 'uz', label: t('language.uzbek') },
    { code: 'ru', label: t('language.russian') },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Globe className="h-4 w-4" />
            <span className="sr-only">{t('language.switchLanguage')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={language === lang.code ? 'bg-accent' : ''}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Switcher */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-9 w-9"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">{t('theme.switchTheme')}</span>
      </Button>
    </div>
  );
}
