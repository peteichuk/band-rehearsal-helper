import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';

const SHOW_AFTER_PX = 400;

/** Floating "back to top" button for the library list — appears once scrolled past a threshold. The page itself scrolls on `window` (see scrollMemory.ts), not an inner container. */
export function ScrollToTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      title={t('Scroll to top')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="print:hidden fixed right-4 bottom-24 z-30 p-2.5 flex items-center justify-center rounded-full bg-blue-700 dark:bg-blue-600 text-white shadow-lg hover:bg-blue-800 dark:hover:bg-blue-700"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
