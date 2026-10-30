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
  return <section aria-label="Optional analytics" className="border-t border-border bg-background px-4 py-5">
    <div className="mx-auto max-w-[1200px] space-y-3">
      <h2 className="font-semibold">Optional visitor analytics</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">Allow Google Analytics to measure visits to our homepage and privacy page, including which social platform, campaign and post brought you here. Google receives device and visit information and uses analytics cookies. We do not send account details or medical records. You can change your choice here at any time.</p>
      <a href="/privacy" className="text-sm text-primary underline">Privacy policy</a>
      <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => decide(false)}>Decline</Button><Button variant="outline" onClick={() => decide(true)}>Allow analytics</Button></div>
    </div>
  </section>;
}