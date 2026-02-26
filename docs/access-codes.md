# Access Codes

Invite-only codes that grant full product access for a set number of days, without Stripe.

## Setup

Run the migration against your Supabase project:

```bash
supabase db push
# or apply supabase/migrations/018_add_access_codes.sql manually
```

## Admin Guide

### Creating codes

1. Log in as an admin (`profiles.is_admin = true`)
2. Go to **Dashboard → Manage Access Codes** (or navigate to `/dashboard/admin/access-codes`)
3. Click **New Code**
4. Fill in:
   - **Code** — auto-generated, or type your own (e.g. `FOUNDING30`)
   - **Trial Days** — how many days of access the code grants
   - **Max Redemptions** — leave blank for unlimited
   - **Category** — `founding`, `partner`, `student`, or `custom`
   - **Starts At / Expires At** — optional date window when the code is valid
   - **Note** — internal-only, e.g. "Batch for launch partners"
   - **Enabled** — toggle on/off without deleting
5. Click **Create**

### Managing codes

From the same page you can:

- **Enable / Disable** a code instantly (disabled codes can't be redeemed)
- **Edit** any field (trial days, max redemptions, dates, note, category)
- **View redemptions** — click "View redemptions" on any code to see who redeemed it, when, and their trial end date
- **Copy** a code to clipboard with the copy icon

### How it works

- Redemption is atomic (database function with row locking) — max redemptions can't be bypassed by concurrent requests
- One redemption per user per code
- If a user already has a longer trial from another code, the shorter one won't shorten it
- Access code trials are independent of Stripe — no Stripe subscription is created
- When the trial expires, the user returns to the normal paywall

## User Guide

### Redeeming a code

1. Go to **Dashboard → Subscription** (or `/dashboard/subscription`)
2. If you don't have an active subscription, you'll see **"Have an access code?"** below the subscribe button
3. Click it, enter your code, and click **Redeem**
4. On success, you'll see your access end date and a **Continue** button
5. You now have full access to all features until that date

### After the trial ends

When your access code trial expires, you'll be prompted to subscribe via Stripe. Your data and plans are preserved — you just need an active subscription to continue using the app.

## Key files

| What | Where |
|------|-------|
| Migration | `supabase/migrations/018_add_access_codes.sql` |
| Access check (single source of truth) | `src/lib/subscription.ts` → `hasActiveSubscription()` |
| Redeem API | `src/app/api/access-code/redeem/route.ts` |
| Redeem UI | `src/components/access-code/redeem-access-code.tsx` |
| Admin API | `src/app/api/admin/access-codes/route.ts` |
| Admin redemptions API | `src/app/api/admin/access-codes/redemptions/route.ts` |
| Admin page | `src/app/dashboard/admin/access-codes/page.tsx` |
| Admin client component | `src/app/dashboard/admin/access-codes/access-codes-manager.tsx` |
| Types | `src/types/database.types.ts` → `AccessCode`, `AccessCodeRedemption` |
