import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deviceNoLongerMatches,
  isAudioOutputSelectionSupported,
  listAudioOutputDevices,
  setAudioOutputDevice,
  type AudioOutputDevice,
} from '@/lib/audioOutputDevice';
import { useAudioOutputDevice } from '@/hooks/useAudioOutputDevice';

const SYSTEM_DEFAULT_VALUE = 'system-default';

interface AudioOutputDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Lets the user send this app's audio (currently just the local metronome
 * engine) to a specific output device — e.g. a USB audio interface or a
 * Bluetooth speaker — instead of the system default. Chromium-only
 * (desktop or Android) — see src/lib/audioOutputDevice.ts.
 */
export function AudioOutputDialog({ open, onClose }: AudioOutputDialogProps) {
  const { t } = useTranslation();
  const supported = isAudioOutputSelectionSupported();
  const device = useAudioOutputDevice();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // The pick isn't committed to the shared store until OK — picking in the
  // select only updates this draft. Closing any other way (the × button,
  // clicking outside, Esc) just discards it, leaving the saved device as-is.
  const [draft, setDraft] = useState<AudioOutputDevice | null>(device);

  useEffect(() => {
    if (!open) return;
    setDraft(device);
    // Deliberately only resets the draft when the dialog (re)opens, not on
    // every external `device` change while it's already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !supported) return;

    const refresh = () => {
      setStatus('loading');
      listAudioOutputDevices()
        .then(list => {
          setDevices(list);
          setStatus('loaded');
        })
        .catch(() => setStatus('error'));
    };

    refresh();

    // Keeps the list (and the "not connected" warning) live while the
    // dialog is open — e.g. unplugging headphones updates it immediately,
    // no need to close and reopen. Delayed a touch: right as devicechange
    // fires, enumerateDevices() can briefly still return the pre-change
    // list, before the OS has actually finished switching its default.
    const refreshAfterChange = () => {
      setTimeout(refresh, 400);
    };
    navigator.mediaDevices.addEventListener('devicechange', refreshAfterChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshAfterChange);
  }, [open, supported]);

  const hasLoaded = status === 'loaded';

  // Only when the deviceId itself is gone — a relabeled-but-still-present
  // "default" pseudo-device (see deviceNoLongerMatches) is already covered
  // by its own live entry from devices.map below, so adding a second item
  // for the same id here would create a duplicate <SelectItem value>.
  const draftIdMissing =
    hasLoaded && draft != null && !devices.some(d => d.deviceId === draft.deviceId);

  // The actually-saved device (from localStorage, via useAudioOutputDevice)
  // vs what's available right now — this is what the warning message is
  // about, independent of whatever the user is just previewing in the
  // dropdown pre-OK. Uses the broader check, since a same-id relabel is
  // just as much "not what you picked" as a fully missing device.
  const savedDeviceMissing = hasLoaded && device != null && deviceNoLongerMatches(device, devices);

  const handleChange = (value: string) => {
    if (value === SYSTEM_DEFAULT_VALUE) {
      setDraft(null);
      return;
    }
    const picked = devices.find(d => d.deviceId === value);
    if (picked) setDraft({ deviceId: picked.deviceId, label: picked.label });
    // Otherwise it's the synthetic "not connected" item for the current
    // draft itself — already selected, nothing to change.
  };

  const handleConfirm = () => {
    setAudioOutputDevice(draft);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-sm">
        <DialogTitle>{t('Audio Output')}</DialogTitle>

        {supported ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(
                "Send audio to a specific output device — e.g. a USB audio interface or a Bluetooth speaker — instead of your system's default. The browser may ask for microphone access just to unlock device names; nothing is recorded."
              )}
            </p>

            {status === 'error' ? (
              <p className="text-xs text-destructive">
                {t(
                  "Couldn't list output devices. Try again, or allow microphone access if prompted."
                )}
              </p>
            ) : (
              <>
                <Select
                  value={draft?.deviceId ?? SYSTEM_DEFAULT_VALUE}
                  onValueChange={handleChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SYSTEM_DEFAULT_VALUE}>{t('System default')}</SelectItem>
                    {draftIdMissing && draft && (
                      <SelectItem value={draft.deviceId}>
                        {t('{{label}} (not connected)', { label: draft.label })}
                      </SelectItem>
                    )}
                    {devices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label ||
                          t('Output device ({{idPrefix}})', { idPrefix: d.deviceId.slice(0, 8) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {savedDeviceMissing && device && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t(
                      'Your saved output, "{{label}}", isn\'t active right now — the system default will be used instead until it\'s reconnected. Pick a device below to update your saved choice.',
                      { label: device.label }
                    )}
                  </p>
                )}

                <Button type="button" onClick={handleConfirm} className="w-full">
                  {t('OK')}
                </Button>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t(
              "Choosing an audio output device isn't supported on this browser/device. It's a Chromium-only feature (Chrome or Edge, on desktop or Android) — it works there, just not in Safari, Firefox, or on iOS. The metronome still plays normally through your device's default output either way."
            )}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
