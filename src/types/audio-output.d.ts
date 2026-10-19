export {};

/**
 * AudioContext.setSinkId() — routes an AudioContext's output to a specific
 * device. Chromium-only (Chrome/Edge/Opera, desktop and Android) as of
 * writing; not in Firefox or Safari. Not yet in TypeScript's own DOM lib,
 * hence this ambient augmentation.
 * See: https://developer.chrome.com/blog/audiocontext-setsinkid
 */
declare global {
  interface AudioContext {
    setSinkId?(sinkId: string | { type: 'none' }): Promise<void>;
    readonly sinkId?: string;
  }
}
