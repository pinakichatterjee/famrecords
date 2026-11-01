import { beforeEach, describe, expect, it } from 'vitest';
import { INVITE_CHOICE_KEY, INVITE_NOTICE, INVITE_SESSION_KEY, clearInvite, inviteCampaign, saveInvite, signupInvite, validInvite } from '../lib/invite-attribution';

const now = Date.now();
const campaign = { source: 'whatsapp', campaign: 'family_invite', content: 'invite_1' };
const accepted = { accepted: true, notice: INVITE_NOTICE, decidedAt: new Date(now).toISOString() };
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
describe('private invite attribution', () => {
  it('accepts only predefined invite labels and drops identifiers', () => {
    expect(inviteCampaign('https://www.famrecords.org/welcome?utm_source=whatsapp&utm_campaign=family_invite&utm_content=invite_1&email=secret@example.com&record_id=123')).toEqual(campaign);
    expect(inviteCampaign('https://www.famrecords.org/?utm_source=whatsapp&utm_campaign=diabetes')).toBeNull();
    expect(inviteCampaign('https://www.famrecords.org/?utm_source=whatsapp&utm_campaign=family_invite&utm_content=patient_123')).toBeNull();
  });
  it('never captures on medical or private account pages', () => {
    for (const path of ['/records', '/members', '/dashboard', '/settings', '/admin', '/reset-password']) expect(inviteCampaign(`https://www.famrecords.org${path}?utm_source=whatsapp&utm_campaign=family_invite`)).toBeNull();
  });
  it('does not store or report labels without explicit permission', () => {
    saveInvite(campaign, accepted.decidedAt);
    expect(sessionStorage.getItem(INVITE_SESSION_KEY)).toBeNull();
    expect(signupInvite()).toBeNull();
  });
  it('keeps consented labels across navigation in the same tab only', () => {
    localStorage.setItem(INVITE_CHOICE_KEY, JSON.stringify(accepted));
    saveInvite(campaign, accepted.decidedAt);
    expect(signupInvite()).toEqual({ ...campaign, notice: INVITE_NOTICE, consentAt: accepted.decidedAt });
    expect(localStorage.getItem(INVITE_SESSION_KEY)).toBeNull();
  });
  it('immediately discards pending attribution on withdrawal', () => {
    localStorage.setItem(INVITE_CHOICE_KEY, JSON.stringify(accepted));
    saveInvite(campaign, accepted.decidedAt);
    localStorage.setItem(INVITE_CHOICE_KEY, JSON.stringify({ ...accepted, accepted: false }));
    expect(signupInvite()).toBeNull();
    expect(sessionStorage.getItem(INVITE_SESSION_KEY)).toBeNull();
  });
  it('expires after 24 hours and rejects future or invalid timestamps', () => {
    const base = { ...campaign, notice: INVITE_NOTICE };
    expect(validInvite({ ...base, consentAt: new Date(now - 86400001).toISOString() }, now)).toBe(false);
    expect(validInvite({ ...base, consentAt: new Date(now + 1).toISOString() }, now)).toBe(false);
    expect(validInvite({ ...base, consentAt: 'invalid' }, now)).toBe(false);
    expect(validInvite({ ...base, consentAt: new Date(now).toISOString() }, now)).toBe(true);
  });
  it('projects only safe fields and never replays consumed signups', () => {
    localStorage.setItem(INVITE_CHOICE_KEY, JSON.stringify(accepted));
    sessionStorage.setItem(INVITE_SESSION_KEY, JSON.stringify({ ...campaign, notice: INVITE_NOTICE, consentAt: accepted.decidedAt, diagnosis: 'private', email: 'private' }));
    expect(Object.keys(signupInvite() ?? {}).sort()).toEqual(['campaign', 'consentAt', 'content', 'notice', 'source']);
    clearInvite();
    expect(signupInvite()).toBeNull();
  });
});