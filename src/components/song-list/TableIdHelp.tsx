import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { CollapsiblePanel } from '@/components/shared/CollapsiblePanel';
import { cn } from '@/lib/utils';

/** Expandable step-by-step instructions for finding a Google Sheet's ID/URL. */
export function TableIdHelp() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-2xl w-full mx-auto mt-3">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="flex items-center gap-1.5 mx-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <HelpCircle className="w-4 h-4 shrink-0" />
        {t('How do I get a table ID?')}
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      <CollapsiblePanel open={open}>
        <div className="mt-2 text-left text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t(
              "Already rehearsing with a band? Ask whoever runs the setlist for the link. Nobody's holding that job yet? Nothing's stopping you from grabbing it — a Google Sheet is free, and steps 1–4 are the whole application process."
            )}
          </p>
          <ol className="space-y-4">
            <li>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {t('1. Create a Google Sheet')}
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t(
                  'Go to your Google Drive and create a new Google Sheets file — any name works. Copy the columns and layout from'
                )}{' '}
                <a
                  href="https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('this demo sheet')}
                </a>{' '}
                {t('so the app recognizes it.')}
              </p>
            </li>
            <li>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {t('2. Share it with your band')}
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t('Click')} <strong>{t('Share')}</strong>{' '}
                {t(
                  'and set access to "Anyone with the link". Viewer is enough for everyone to read the songs; pick Editor for anyone who should get Admin Mode (adding/editing songs from inside the app).'
                )}
              </p>
            </li>
            <li>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {t('3. Copy the link')}
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t(
                  "Copy the sheet's URL straight from your browser's address bar — no need to dig out just the ID."
                )}
              </p>
            </li>
            <li>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {t('4. Load it here')}
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t('Paste the whole URL into the field above and press')}{' '}
                <strong>{t('Load')}</strong> {t('— the ID is picked out automatically.')}
              </p>
            </li>
            <li>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {t('5. Pin this setlist to your home screen')}{' '}
                <span className="font-normal text-xs text-gray-400 dark:text-gray-500">
                  {t('(optional, but recommended)')}
                </span>
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t(
                  'Once the songs are loaded, use your browser\'s "Add to Home Screen" (or "Install app") option right here on this main list. The icon remembers this exact setlist — open it later and you land straight back on these songs, no re-pasting the link.'
                )}
              </p>
            </li>
          </ol>
        </div>
      </CollapsiblePanel>
    </div>
  );
}
