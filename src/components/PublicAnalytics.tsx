import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ANALYTICS_CHOICE_KEY, ANALYTICS_NOTICE, campaignParameters, publicAnalyticsLocation } from '@/lib/social-analytics';

type Choice = { accepted: boolean; notice: string; decidedAt: string };
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export function PublicAnalytics() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const measurementId = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY'];
  const publicPage = pathname === '/' || pathname === '/privacy';

  useEffect(() => {
    const read = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(ANALYTICS_CHOICE_KEY) ?? 'null') as Choice | null;
        setChoice(saved?.notice === ANALYTICS_NOTICE && typeof saved.accepted === 'boolean' ? saved : null);
      } catch { setChoice(null); }
      setReady(true);
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/.test(measurementId ?? '')) return;
    const host = window as AnalyticsWindow;
    const disableKey = `ga-disable-${measurementId}`;
    const location = publicAnalyticsLocation(window.location.href);
    const permitted = ready && choice?.accepted === true && location !== null;
    Object.assign(window, { [disableKey]: !permitted });
    if (!permitted || !location) {
      host.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      return;
    }
    if (!host.gtag) {
      host.dataLayer = host.dataLayer ?? [];
      host.gtag = function () { host.dataLayer?.push(arguments); };
      host.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      host.gtag('set', 'developer_id.dZjgwMW', true);
      host.gtag('js', new Date());
      host.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location, page_referrer: '' });
      const script = document.createElement('script');
      script.id = 'famrecords-google-analytics';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    host.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    host.gtag('event', 'page_view', { send_to: measurementId, page_location: location, page_path: pathname, page_title: pathname === '/' ? 'FamRecords' : 'FamRecords Privacy Policy', page_referrer: '', ...campaignParameters(location) });
    return () => { Object.assign(window, { [disableKey]: true }); };
  }, [choice, ready, pathname, measurementId]);

  function decide(accepted: boolean) {
    const next = { accepted, notice: ANALYTICS_NOTICE, decidedAt: new Date().toISOString() };
    try { localStorage.setItem(ANALYTICS_CHOICE_KEY, JSON.stringify(next)); } catch { /* Choice still applies for this visit. */ }
    setChoice(next); setEditing(false);
  }

  if (!ready || !publicPage || !/^G-[A-Z0-9]+$/.test(measurementId ?? '')) return null;
  if (choice && !editing) return <div className="border-t border-border px-4 py-3"><Button variant="link" onClick={() => setEditing(true)}>Analytics privacy settings</Button></div>;
  return <section aria-label="Optional analytics" className="border-t border-border bg-background px-4 py-3">
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <p className="min-w-0 flex-1">May we measure your visit with Google Analytics to see which posts bring families here? No account or medical details. <a href="/privacy" className="text-primary underline">Privacy policy</a></p>
      <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => decide(false)}>Decline</Button><Button variant="outline" size="sm" onClick={() => decide(true)}>Allow</Button></div>
    </div>
  </section>;
}