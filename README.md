# TapMenu SaaS — Interactive Digital Menu & Table Ordering Platform

Multi-tenant restaurant digital menu book and table ordering platform with digital smart card programming, QR table management, Kitchen Display (KDS), and administrative controls.

---

## 🍽️ Direct Restaurant Payment Model

TapMenu is intentionally designed so **restaurants retain 100% control of their funds**:
- **Zero Third-Party Gateway Friction:** No Paystack / payment aggregator accounts required to start.
- **Card / POS at Table:** Waitstaff brings the restaurant's physical POS terminal when meals are served.
- **Cash to Waitstaff:** Seamless cash collection directly by restaurant floor staff.
- **Direct Bank Transfer:** Diners can make instant transfers directly to the restaurant's own bank account.
- **Zero Trust Hesitation:** Restaurants never have to worry about a platform withholding payouts or charging transaction deductions.

---

## 🚀 One-Click Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure TapMenu for Vercel & Supabase with Direct Restaurant Payments"
   git branch -M main
   git push -u origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new) and select the `tapmenu` repository.
   - Framework Preset: **Vite** (auto-detected via `vercel.json`).
   - Build Command: `vite build`
   - Output Directory: `dist`

3. **Set Environment Variables in Vercel:**
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://ikkljurxmfwmhhumoiqo.supabase.co` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_vSVJBftn3OHtozdV6GKMjA_KHIlJEo8` | Supabase Anon Key |

---

## 🗄️ Supabase Database Setup

TapMenu seamlessly saves orders and waiter buzzer calls to your Supabase project.

1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/ikkljurxmfwmhhumoiqo/sql](https://supabase.com/dashboard/project/ikkljurxmfwmhhumoiqo/sql)
2. Open the file [`supabase_schema.sql`](./supabase_schema.sql) in this repository.
3. Paste and run the SQL script to create the `orders` and `waiter_calls` tables with public security policies.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run local development server
npm run dev

# 3. Test production build
npm run build
```
