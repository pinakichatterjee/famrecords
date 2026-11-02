import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ADVERTISING_CHOICE_KEY, ADVERTISING_NOTICE, ADVERTISING_NOTICE_TEXT, loadConsentedAds, readAdvertisingChoice, type AdvertisingChoice } from '@/lib/adsense';

export function AdvertisingConsent() {
  const [choice, setChoice] = useState<AdvertisingChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let loaded = false;
    const read = () => {
      let next: AdvertisingChoice | null = null;
      try { next = readAdvertisingChoice(localStorage.getItem(ADVERTISING_CHOICE_KEY)); } catch { /* Default denied. */ }
      setChoice(next); setReady(true);
      const runtimePresent = loaded || Boolean(document.querySelector('script[src*="pagead/js/adsbygoogle.js"]'));
      if (runtimePresent && !next?.accepted) { window.location.reload(); return; }
      loaded = loadConsentedAds(document, window.location.pathname, next) || runtimePresent;
    };
    read();
    const storage = (event: StorageEvent) => { if (event.key === ADVERTISING_CHOICE_KEY || event.key === null) read(); };
    window.addEventListener('storage', storage);
    return () => window.removeEventListener('storage', storage);
  }, []);

  function decide(accepted: boolean) {
    const now = new Date().toISOString();
    const acceptedAt = accepted ? now : choice?.acceptedAt;
    const next: AdvertisingChoice = { accepted, notice: ADVERTISING_NOTICE, decidedAt: now, ...(acceptedAt ? { acceptedAt } : {}) };
    try { localStorage.setItem(ADVERTISING_CHOICE_KEY, JSON.stringify(next)); }
    catch { setChoice(null); return; }
    // A fresh document destroys any already-running third-party advertising code.
    window.location.reload();
  }

  if (!ready) return null;
  if (choice && !editing) return <div className="border-t border-border px-4 py-3"><Button variant="link" onClick={() => setEditing(true)}>Advertising privacy settings</Button></div>;
  return <section aria-label="Advertising consent" className="border-t border-border bg-background px-4 py-3">
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <p className="min-w-0 flex-1">{ADVERTISING_NOTICE_TEXT} <a href="/privacy" className="text-primary underline">Privacy policy</a></p>
      <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => decide(false)}>Decline advertising</Button><Button variant="outline" size="sm" onClick={() => decide(true)}>Allow advertising</Button></div>
    </div>
  </section>;
}