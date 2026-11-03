export type PrivacySetting = 'analytics' | 'advertising' | 'invite';
export const PRIVACY_SETTINGS_EVENT = 'famrecords:privacy-settings';
export function openPrivacySetting(kind: PrivacySetting) {
  window.dispatchEvent(new CustomEvent<PrivacySetting>(PRIVACY_SETTINGS_EVENT, { detail: kind }));
}
export function onPrivacySetting(kind: PrivacySetting, open: () => void) {
  const handler = (e: Event) => { if ((e as CustomEvent<PrivacySetting>).detail === kind) open(); };
  window.addEventListener(PRIVACY_SETTINGS_EVENT, handler);
  return () => window.removeEventListener(PRIVACY_SETTINGS_EVENT, handler);
}
