// Only the public homepage includes this script. Navigate out with a full
// document load so its third-party runtime cannot follow private SPA routes.
export const HOMEPAGE_ADSENSE_SCRIPT = {
  async: true,
  src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6541645442534489',
  crossOrigin: 'anonymous',
};