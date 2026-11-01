export const INVITE_NOTICE = 'famrecords-invite-v1';
export const INVITE_CHOICE_KEY = 'famrecords-invite-choice';
export const INVITE_SESSION_KEY = 'famrecords-invite-campaign';
export const INVITE_NOTICE_TEXT = 'Allow FamRecords to link this invite’s platform, campaign and post labels to your newly created account for admin-only sign-up counts. No medical information, names, email, full URLs or device identifiers are included in these counts, and nothing is sent to Google or Meta. Optional; you can decline or withdraw through Invite privacy settings on the privacy page.';
export const INVITE_SOURCES = ['whatsapp', 'email', 'facebook', 'instagram', 'linkedin'] as const;
export const INVITE_CAMPAIGNS = ['family_invite', 'parent_care', 'visit_pack'] as const;
export const INVITE_CONTENTS = ['personal_invite', 'invite_1', 'invite_2'] as const;
export type InviteCampaign = { source: string; campaign: string; content: string };
export type InviteAttribution = InviteCampaign & { notice: string; consentAt: string };
export type InviteChoice = { accepted: boolean; notice: string; decidedAt: string };

export function inviteCampaign(input: string): InviteCampaign | null {
  const url = new URL(input);
  if (!['/', '/welcome', '/auth'].includes(url.pathname)) return null;
  const source = url.searchParams.get('utm_source') ?? '';
  const campaign = url.searchParams.get('utm_campaign') ?? '';
  const content = url.searchParams.get('utm_content') ?? 'personal_invite';
  if (!INVITE_SOURCES.some(v => v === source) || !INVITE_CAMPAIGNS.some(v => v === campaign) || !INVITE_CONTENTS.some(v => v === content)) return null;
  if (url.searchParams.has('utm_medium') && url.searchParams.get('utm_medium') !== 'social' && url.searchParams.get('utm_medium') !== 'email') return null;
  return { source, campaign, content };
}

export function validInvite(input: unknown, now = Date.now()): input is InviteAttribution {
  if (!input || typeof input !== 'object') return false;
  const a = input as Partial<InviteAttribution>;
  const time = Date.parse(a.consentAt ?? '');
  return a.notice === INVITE_NOTICE && INVITE_SOURCES.some(v => v === a.source) && INVITE_CAMPAIGNS.some(v => v === a.campaign) && INVITE_CONTENTS.some(v => v === a.content) && Number.isFinite(time) && time <= now && now - time <= 24 * 60 * 60 * 1000;
}

export function readInviteChoice(): InviteChoice | null {
  try {
    const c = JSON.parse(localStorage.getItem(INVITE_CHOICE_KEY) ?? 'null') as InviteChoice | null;
    return c?.notice === INVITE_NOTICE && typeof c.accepted === 'boolean' && Number.isFinite(Date.parse(c.decidedAt)) ? c : null;
  } catch { return null; }
}

export function signupInvite(): InviteAttribution | null {
  try {
    if (readInviteChoice()?.accepted !== true) { sessionStorage.removeItem(INVITE_SESSION_KEY); return null; }
    const a: unknown = JSON.parse(sessionStorage.getItem(INVITE_SESSION_KEY) ?? 'null');
    if (!validInvite(a)) { sessionStorage.removeItem(INVITE_SESSION_KEY); return null; }
    // Explicit projection: arbitrary fields can never enter signup metadata.
    return { source: a.source, campaign: a.campaign, content: a.content, notice: a.notice, consentAt: a.consentAt };
  } catch { return null; }
}

export function saveInvite(campaign: InviteCampaign, consentAt: string): void {
  try {
    if (readInviteChoice()?.accepted !== true) return;
    sessionStorage.setItem(INVITE_SESSION_KEY, JSON.stringify({ ...campaign, notice: INVITE_NOTICE, consentAt }));
  } catch { /* No storage means no attribution; sign-up is unaffected. */ }
}

export function clearInvite(): void {
  try { sessionStorage.removeItem(INVITE_SESSION_KEY); } catch { /* No storage to clear. */ }
}