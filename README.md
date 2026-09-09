# مسار وثائق — Validation Landing Page

> **Status**: Ready for owner review and deployment
> **Phase**: Validation Sprint (not the full SaaS)
> **Brand**: "مسار وثائق" — WORKING BRAND — NOT FINAL

---

## What This Is

A professional, Arabic RTL-first validation landing page to test commercial demand for a Saudi HR/business-document SaaS concept. Built to measure real intent (signups, demo requests, paid pilot interest) before investing in the full product build.

**This is NOT the full product.** It does not generate documents, does not process payments, and does not connect to any government APIs.

---

## Quick Start (Local Preview)

```bash
cd 05_VALIDATION_LANDING
python -m http.server 8080
```

Then open: **http://localhost:8080**

Alternative: Double-click `index.html` in any browser.

---

## Project Structure

```
05_VALIDATION_LANDING/
├── index.html          # Complete landing page (all 15 sections)
├── css/
│   └── style.css       # Full design system (~950 lines)
├── js/
│   └── app.js          # Form handling, validation, tracking (~300 lines)
├── screenshots/        # Visual review screenshots
│   ├── desktop-hero.png
│   ├── desktop-hero-revision3.png
│   ├── desktop-pricing.png
│   ├── desktop-pricing-cards.png
│   ├── desktop-founder-whofor.png
│   ├── mobile-hero.png
│   ├── mobile-hero-revision3.png
│   ├── mobile-pricing.png
│   ├── mobile-pricing-business.png
│   ├── mobile-founder-note.png
│   └── lead-form.png
└── README.md           # This file
```

---

## Page Sections (15 Total)

1. **Hero** — Value proposition, CTA buttons, compliance disclaimer badge
2. **Value Proposition** — 4 key benefits
3. **Pain Points** — 4 problems solved
4. **How It Works** — 3-step flow
5. **Who It's For** — 4 target segments
6. **Document Categories** — 6 document types
7. **Benefits** — 6-item feature checklist
8. **Pricing** — 3-tier hypotheses (SAR 99 / 199 / 499)
9. **Early Access CTA** — Full lead capture form
10. **Demo Request CTA** — Simplified form
11. **Paid Pilot CTA** — Pilot offer + form
12. **FAQ** — 8 expandable items
13. **Compliance Disclaimer** — Legal language
14. **Privacy Notice** — PDPL-aligned
15. **Contact Form** — General inquiry

---

## How Forms Currently Work

**No backend.** All form submissions are stored in browser `localStorage`:

| Key | Contents |
|-----|----------|
| `sr_submissions` | Array of all form submissions (JSON) |
| `sr_cta_clicks` | CTA click counts by type |

**To view submissions locally:**
```javascript
// In browser DevTools Console:
JSON.stringify(__SRValidation.getSubmissions(), null, 2)
```

**Form validation (client-side):**
- Required fields enforced
- Email/phone format validated (accepts email or Saudi phone format)
- Consent checkbox required
- Real-time error clearing on input

**Forms included:**
1. Early Access (8 fields + consent)
2. Demo Request (4 fields + consent)
3. Paid Pilot (5 fields + consent)
4. Contact (5 fields + consent)

**No sensitive data collected:**
- ❌ National IDs
- ❌ Iqama numbers
- ❌ Salary data
- ❌ Employee personal files
- ❌ Contracts or HR records

---

## Future Deployment Path

| Platform | Cost | Steps |
|----------|------|-------|
| **GitHub Pages** (recommended) | Free | 1. Push to GitHub repo 2. Enable Pages in Settings |
| **Netlify** | Free | 1. Drag-drop folder or connect Git |
| **Vercel** | Free | 1. Import project or CLI deploy |
| **Custom domain + VPS** | SAR 50–200/yr | Only after validation passes |

**Recommended:** GitHub Pages — free, instant, version-controlled.

---

## Known Limitations

| Limitation | Impact | Resolution |
|------------|--------|------------|
| No backend | Submissions only in localStorage | Add simple API/Formspree/Netlify Forms when deployed |
| No analytics | Can't track page views | Add privacy-friendly analytics (Plausible, Umami) when deployed |
| No payment processing | Can't collect actual payments | Intentional — validation measures intent first |
| No document generation | Not a functional product | This is a demand test, not the MVP |
| No multilingual | Arabic only | English toggle planned for Phase One |
| No government integration | No Qiwa/GOSI | Explicitly out of scope per Phase Zero |
| Working brand only | "مسار وثائق" is temporary | Final brand TBD after validation |

---

## Validation Tracking

Results are tracked in:
- `04_CUSTOMER_VALIDATION/09_LANDING_PAGE_RESULTS.md` — weekly results
- `04_CUSTOMER_VALIDATION/11_VALIDATION_METRICS.md` — GO/PIVOT/STOP thresholds
- `04_CUSTOMER_VALIDATION/14_TARGET_LEAD_CRITERIA.md` — qualification rules

**Decision at Week 3** based on real data. No fabricated results.

---

## Compliance Notes

- **Legal disclaimer**: Page states templates are for professional use, subject to legal review
- **Privacy notice**: PDPL-aligned, no sensitive data collected
- **No government claims**: Explicitly states no Qiwa/GOSI integration, no government approval
- **No fake data**: No invented testimonials, statistics, or customer logos

---

## Screenshots Location

All review screenshots are in `screenshots/`:
- `desktop-hero.png` — Hero section on desktop
- `desktop-hero-revision3.png` — Hero section on desktop (revision 3)
- `desktop-pricing.png` — Pricing section on desktop
- `desktop-pricing-cards.png` — Pricing 3-tier cards on desktop
- `desktop-founder-whofor.png` — "لمن" section with founder identity note on desktop
- `mobile-hero.png` — Hero section on mobile (390×844)
- `mobile-hero-revision3.png` — Hero section on mobile (revision 3)
- `mobile-pricing.png` — Pricing section on mobile
- `mobile-pricing-business.png` — Featured Business pricing card on mobile
- `mobile-founder-note.png` — Founder identity note on mobile (390×844)
- `lead-form.png` — Early access form on mobile

---

## Next Steps for Owner

1. **Deploy** to GitHub Pages (free, ~5 minutes)
2. **Share** live URL with warm contacts via WhatsApp/LinkedIn
3. **Track** weekly in `09_LANDING_PAGE_RESULTS.md`
4. **At Week 3**: evaluate against `11_VALIDATION_METRICS.md` → record decision
5. **Parallel**: Complete legal/portal verification (blocked items from Phase Zero)

---

*Built 2026-09-09 as part of Validation Sprint. No money spent, no public deployment, no outreach sent.*