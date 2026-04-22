# m3hr4n.com — Personal Portfolio

Static portfolio website for a DevOps & Infrastructure Engineer.  
Live: **[m3hr4n.com](https://m3hr4n.com)** · Legacy v1: **[m3hr4n.com/v/v1](https://m3hr4n.com/v/v1)**

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Vanilla HTML5 | No build step, no framework overhead |
| Styling | CSS3 + custom variables | Season theming via a single `data-theme` attribute |
| Logic | Vanilla JS (ES6+) | Zero dependencies — no npm, no bundler |
| Backend | PHP (cPanel hosting) | CV contact form with reCAPTCHA v3 |
| Server | Apache / HTTP2 | Brotli compression, long-term cache headers |

---

## Features

### Season Theme System
Four CSS themes — Spring 🌸 / Summer ☀️ / Autumn 🍂 / Winter ❄️ — driven entirely by CSS variables.  
Default theme is auto-selected by the current month. User preference persists via `localStorage`.  
Zero JavaScript required to switch colours — only a `data-theme` attribute swap on `<html>`.

### Dynamic Experience Counter
Years of experience in the About section is calculated at runtime: `currentYear - 2019`.  
No manual updates needed on the site when the year rolls over.

### Project Slideshow
Infinite-loop slideshow with touch/swipe support, auto-play pause on hover, and responsive breakpoints (3-up on desktop → 1-up on mobile). Built without any carousel library.

### Security Layers
- Content Security Policy via `<meta>` + `.htaccess` headers
- reCAPTCHA v3 on the CV download contact form
- Email/phone obfuscation via `data-*` attributes (not in page source as plain text)
- Input sanitization and rate limiting on the PHP backend
- SRI (Subresource Integrity) on all CDN assets
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers

### CV Gate
Visitors fill a short form (name, email, company) before receiving the CV via email. Submissions are logged and a notification copy goes to the site owner. reCAPTCHA v3 score threshold: 0.5.

### Versioning
Previous site versions are archived under `/v/vN/` on the server. No Git deployment required — snapshot-before-edit workflow in cPanel File Manager.

---

## Performance Test Results

> Tested: **Europe · Desktop · WiFi** via WebPageTest.org  
> Test date: April 2025

| Metric | Result |
|--------|--------|
| TTFB | **132 ms** |
| First Contentful Paint | **851 ms** |
| Largest Contentful Paint | **1,246 ms** |
| Total Blocking Time | **54 ms** |
| Cumulative Layout Shift | **0.011** |
| Speed Index | **1,571 ms** |
| Fully Loaded | **1,413 ms** |
| Total bytes transferred | **2.1 MB** |

Full reports:
- [GTmetrix report](https://gtmetrix.com/reports/m3hr4n.com/aWpBAvlh/)
- [PageSpeed Insights (desktop)](https://pagespeed.web.dev/analysis/https-m3hr4n-com/3wpjtd9k3e?form_factor=desktop)
- [WebPageTest (Europe / Desktop / WiFi)](https://www.webpagetest.org)

### What the waterfall revealed

The test identified the following render-blocking requests (in load order):

1. `font-awesome/6.0.0/css/all.min.css` — Cloudflare CDN, 15 KB compressed
2. `fonts.googleapis.com` Inter — 879 B CSS + 48 KB woff2
3. `recaptcha/api.js` — Google, **blocking**, 1 KB stub → pulls 370 KB `recaptcha__en.js`
4. `script.js` — 2.8 KB compressed, 264 ms blocking time (slideshow setInterval loop)
5. `logo.png` — **952 KB uncompressed** — LCP element, biggest single optimisation target

Two 404 errors: `favicon-32x32.png` and `favicon-16x16.png` — files missing from server.

---

## Known Issues / Roadmap

- [ ] **logo.png** is 952 KB — needs converting to WebP and resizing to ≤ 60×60 px display size (currently served at 1024×1024)
- [ ] **reCAPTCHA** loads eagerly on every page visit; should lazy-load only when the contact section scrolls into view
- [ ] `favicon-32x32.png` and `favicon-16x16.png` return 404 — favicon files need uploading
- [ ] `script.js` has no cache header (`Cache-Control: 0`) — needs a versioned filename or `.htaccess` cache rule
- [ ] Slideshow `setInterval` runs continuously even when off-screen — switch to `IntersectionObserver` to pause when not in viewport
- [ ] Accessibility: slideshow prev/next buttons flagged by axe (missing `aria-label`) — already in HTML but not reaching the dynamically injected buttons
- [ ] Mobile load time optimisation pass (currently untested on mobile network)
- [ ] Consider self-hosting Font Awesome to remove one external blocking request

---

## File Structure

```
public_html/
├── index.html          # Main entry point
├── style.css           # All styles + 4 season CSS variable sets
├── script.js           # Theme switcher, slideshow, contact obfuscation
├── contact-form.html   # CV download gate (reCAPTCHA + PHP backend)
├── privacy-policy.html
├── terms.html
├── logo.png
├── Mypic.jpg
└── v/
    └── v1/             # Archived previous version
        ├── index.html
        ├── style.css
        └── script.js
```

---

## Local Development

No build step. Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

The PHP contact form requires a server with PHP + SMTP credentials set in environment variables — it won't work from a plain file server.
