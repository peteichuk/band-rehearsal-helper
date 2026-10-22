import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TelegramIcon from '@/assets/icons/telegram.svg?react';
import WhatsappIcon from '@/assets/icons/whatsapp.svg?react';
import CopyIcon from '@/assets/icons/copy.svg?react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | null;
}

const APP_NAME = 'Band Rehearsal helper app';

export function ShareModal({ open, onOpenChange, title }: ShareModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  // Setlists are local-only (a per-device id, never written anywhere shared),
  // so a link to /setlists/:id is meaningless to whoever opens it — share the
  // catalog root instead, keeping tableId and every other query param.
  const isSetlistRoute = location.pathname.startsWith('/setlists/');
  const sharePath = isSetlistRoute ? '/' : location.pathname;
  const shareUrl = `${window.location.origin}${window.location.pathname}#${sharePath}${location.search}`;
  const shareText = title || APP_NAME;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      inputRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openShareWindow = (url: string) => {
    const win = window.open(url, '_blank');
    setTimeout(() => win?.close(), 10000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{title || t('Share this link:')}</DialogTitle>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            readOnly
            value={shareUrl}
            className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
          <Button type="button" onClick={copyLink} title={t('Copy link')}>
            <CopyIcon />
          </Button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 dark:text-green-400">
            {t('Link copied to clipboard!')}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            className="flex-1 bg-[#229ED9] hover:bg-[#1b8dc4] text-white"
            onClick={() =>
              openShareWindow(
                `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
              )
            }
          >
            <TelegramIcon /> Telegram
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white"
            onClick={() =>
              openShareWindow(
                `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
              )
            }
          >
            <WhatsappIcon /> WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
