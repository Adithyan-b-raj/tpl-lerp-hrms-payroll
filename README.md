# Pulse HRMS (`tpl-lerp-hrms-payroll`)
> **Movement R: Modern People-Ops Attendance HeatGrid & Statutory Payslip**  
> Standalone, white-label-ready vertical repository for Enterprise HRMS, Geo-Attendance, Leave & Indian Statutory Payroll.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Pages-4f46e5)](https://tpl-lerp-hrms-payroll.pages.dev)
[![GitHub](https://img.shields.io/badge/GitHub-Adithyan--b--raj%2Ftpl--lerp--hrms--payroll-181717)](https://github.com/Adithyan-b-raj/tpl-lerp-hrms-payroll)
[![Archetype](https://img.shields.io/badge/Archetype-employee--self--service%20%7C%20people--ops--admin-10b981)](#)

---

## 🌟 Architectural Highlights

1. **Movement R People-Ops Design System:**
   - Deep indigo/violet People-Ops tokens (`#4f46e5`, `#6366f1`) coupled with status emeralds (`#10b981`), amber lates (`#f59e0b`), and absent roses (`#f43f5e`).
   - Clean, high-density typography (`Inter` for UI layout, `IBM Plex Mono` for Employee IDs, UAN, PAN, Bank IFSC, and currency figures).
   - Dedicated DOM archetypes:
     - `public/index.html` → `data-layout-archetype="employee-self-service"`
     - `public/admin.html` → `data-layout-archetype="people-ops-admin"`

2. **Geo-Attendance Radar & Web Audio Punch Chime:**
   - Kochi Tech Park HQ Beacon `[9.9312° N, 76.2673° E]` with 500m geofence validation.
   - Dual-tone harmonic corporate punch chime synthesized directly via `window.AudioContext`.
   - Real-time active shift stopwatch and 14-day history view.

3. **Circular / Donut Statutory Leave Balance Gauges:**
   - Visual SVG progress rings for Annual Leave (18d), Sick & Medical Leave (10d), and Casual Leave (6d).
   - 1-tap modal application desk with balance safety checks.

4. **Form-16 Indian Statutory Monthly Payslip:**
   - Two-column Indian statutory salary breakdown: Basic, HRA, Special Allowance vs. EPF 12%, ESIC 0.75% (wage ceiling ₹21,000), Kerala PT (₹208), and New Tax Regime TDS.
   - Indian currency words converter (Lakhs & Crores: e.g. *Rupees One Lakh Forty-Three Thousand Seven Hundred Ninety-Two Only*).
   - Masked bank details and printable `@media print` layout.

5. **30-Day Employee Attendance HeatGrid & 1-Click NEFT Payroll:**
   - 30-day matrix of all employees with interactive cell inspector (punch timestamps & GPS telemetry).
   - 1-click statutory payroll batch calculation and NEFT Bank Disbursement CSV download.

---

## 🛠️ Runnable Deployment Tracks

### Track 1: Cloudflare Pages Edge ($0/mo Serverless)
- Static frontend assets in `public/`
- Edge API functions in `functions/api/` (`employees.js`, `attendance.js`, `leave.js`, `payroll.js`, `payslips.js`, `[[route]].js`)
- D1 SQLite schema in `schema.sql` and `seed.sql`

```bash
# Local development preview
npx wrangler pages dev public

# Production Edge Deployment
npx wrangler pages deploy public --project-name tpl-lerp-hrms-payroll --branch main
```

### Track 2: Self-Hosted Docker VPS Stack
Includes production-ready `docker-compose.yml` for:
- Frappe HR v15 (ERPNext HRMS) on MariaDB
- Odoo 17 Community HR & Attendance Module on PostgreSQL

```bash
docker compose up -d
```

---

## 🏷️ White-Label URL Personalization Contract

Personalize the application dynamically using query parameters:
- `?brand=Acme+Corp` — Updates brand titles, logos, and Form-16 headers.
- `?primary=6366f1` — Sets primary theme color.
- `?wa=919847011001` — Sets floating WhatsApp HR support desk link.
- `?reset_wl=1` — Clears stored white-label overrides from `sessionStorage`.

---

## 🧪 Automated Verification Suite

Run the full verification test suite locally:

```bash
node scripts/test-hrms.js
```
