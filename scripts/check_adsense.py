"""Read-only browser regression: run with `bun run test:adsense`.

Uses a deterministic replacement for Google's script, not live ads. This verifies
script execution and document isolation, not Google approval or ad inventory.
Requires Playwright and an approved account minted by lovable auth-session.
Never prints credentials, account details, or clinical page content.
"""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ORIGIN = "http://localhost:8080"
AD_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6541645442534489"
PRIVATE = ("/dashboard", "/members", "/records", "/settings", "/admin")
PUBLIC_EXCLUDED = ("/auth", "/reset-password", "/privacy", "/welcome")


async def main():
    if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") == "injected":
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies = json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON") or "[]")
    else:
        session_file = Path.home() / ".cache/lovable-auth/session.json"
        if not session_file.exists():
            raise RuntimeError("Authenticated coverage requires lovable auth-session first.")
        minted = json.loads(session_file.read_text())
        storage_key = minted["storage_key"]
        session_json = json.dumps(minted["session"])
        cookies = minted.get("cookies") or []
    assert storage_key and session_json, "Authenticated coverage requires a session."

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        ad_requests = []

        async def fake_ads(route):
            ad_requests.append(route.request.url)
            assert route.request.url == AD_URL, "Unexpected publisher/script URL."
            await route.fulfill(content_type="application/javascript", body="window.__adsenseSafetyProbe = true;")

        await context.route("**/pagead/js/adsbygoogle.js*", fake_ads)

        async def homepage():
            await page.goto(ORIGIN, wait_until="networkidle")
            if await page.get_by_role("button", name="Allow advertising", exact=True).count():
                await page.get_by_role("button", name="Allow advertising", exact=True).click()
            await page.wait_for_function("window.__adsenseSafetyProbe === true")
            assert await page.locator('head script[src*="adsbygoogle.js"]').count() == 1

        async def excluded(path, request_count):
            await page.wait_for_url(ORIGIN + path)
            await page.wait_for_load_state("networkidle")
            assert urlparse(page.url).path == path, f"{path}: redirected; authenticated coverage unavailable."
            assert not await page.evaluate("Boolean(window.__adsenseSafetyProbe)"), f"{path}: advertising runtime survived."
            assert await page.locator('script[src*="adsbygoogle"], iframe[src*="googlesyndication"], ins.adsbygoogle').count() == 0, f"{path}: advertising elements present."
            assert len(ad_requests) == request_count, f"{path}: advertising requested."

        # Every homepage exit must destroy the advertising document, including
        # repeated CTAs; checking only direct page loads misses SPA regressions.
        await page.goto(ORIGIN, wait_until="networkidle")
        assert len(ad_requests) == 0, "AdSense loaded before advertising consent."
        await page.get_by_role("button", name="Decline advertising", exact=True).click()
        await page.wait_for_load_state("networkidle")
        await page.reload(wait_until="networkidle")
        assert len(ad_requests) == 0, "AdSense loaded after advertising refusal."
        await page.get_by_role("button", name="Advertising privacy settings", exact=True).click()
        await homepage()
        exits = await page.locator('a[href]').evaluate_all("els => els.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && h !== '/')")
        assert exits, "Homepage exit coverage must not be empty."
        for index, path in enumerate(exits):
            await homepage()
            count = len(ad_requests)
            # Select by href plus occurrence so every repeated CTA is tested.
            occurrence = exits[:index].count(path)
            await page.locator(f'a[href="{path}"]').nth(occurrence).click()
            await excluded(path, count)
        print(f"PASS: homepage script executes; all {len(exits)} exits clear its runtime.")

        for path in PUBLIC_EXCLUDED:
            count = len(ad_requests)
            await page.goto(ORIGIN + path, wait_until="networkidle")
            await excluded(path, count)
        print("PASS: sign-in, password reset, privacy and welcome exclude advertising.")

        if cookies:
            await context.add_cookies([{**c, "url": ORIGIN} for c in cookies])
        await page.goto(ORIGIN, wait_until="networkidle")
        await page.evaluate("([k, v]) => window.localStorage.setItem(k, v)", [storage_key, session_json])
        for path in PRIVATE:
            count = len(ad_requests)
            await page.goto(ORIGIN + path, wait_until="networkidle")
            await page.get_by_role("button", name="Sign out").wait_for()
            assert await page.get_by_text("Your account is waiting for approval", exact=True).count() == 0, "An approved account is required."
            assert await page.get_by_role("heading", level=1).count() > 0, f"{path}: page did not render."
            await excluded(path, count)
        # Exercise actual private SPA navigation too, not just direct requests.
        for label, path in (("Dashboard", "/dashboard"), ("Members", "/members"), ("Records", "/records"), ("Settings", "/settings")):
            count = len(ad_requests)
            await page.get_by_role("link", name=label, exact=True).first.click()
            await excluded(path, count)
        print("PASS: signed-in medical, settings and admin pages exclude advertising, including navigation.")
        await page.get_by_role("button", name="Sign out").click()
        await excluded("/auth", len(ad_requests))
        await browser.close()


asyncio.run(main())