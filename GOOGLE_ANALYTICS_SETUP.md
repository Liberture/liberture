# Google Analytics Setup for Liberture

## Overview

Liberture uses Google Analytics 4 (GA4) for anonymous usage tracking. Analytics are **opt-in only** (disabled by default) to respect user privacy.

## Features

✅ **Opt-in by default** - Users must explicitly consent  
✅ **Cookie consent banner** - Clear explanation of what data is collected  
✅ **User control** - Can enable/disable anytime in Settings  
✅ **IP anonymization** - All IP addresses are masked  
✅ **No personal data** - Only aggregated usage patterns  

## Setup Instructions

### 1. Create a Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for liberture.com
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add Measurement ID to Environment Variables

Edit `/root/liberture/.env.local`:

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Rebuild and Deploy

```bash
cd /root/liberture
npm run build
pm2 restart liberture
```

## How It Works

### 1. Cookie Consent Banner

On first visit, users see a cookie consent banner with two options:
- **Only Necessary** - Essential cookies only (auth, security)
- **Accept All** - Includes analytics cookies

### 2. User Preferences

Users can change their cookie preferences anytime at:
- `/dashboard/settings` → Cookie Preferences section

### 3. Google Analytics Loading

- If user **declines** analytics: Google Analytics script is NOT loaded
- If user **accepts** analytics: Script loads with IP anonymization enabled
- Changing preference triggers a page reload to apply changes

## What Data Is Collected (When Enabled)

Google Analytics collects:
- Page views and navigation patterns
- Time spent on pages
- Browser and device information
- Approximate geographic location (country/city level)
- Anonymized IP addresses

**NOT collected:**
- Personal information (name, email)
- Form inputs or user-generated content
- Health data or BOS metrics
- Account credentials

## Privacy Compliance

### GDPR Compliance
✅ Explicit consent required  
✅ Easy opt-out mechanism  
✅ Clear privacy policy  
✅ Data processing agreement with Google  

### User Rights
Users can:
- Opt out at any time
- Request data deletion (via Google Analytics settings)
- View what data is collected (Privacy Policy)

## Testing

### Test Opt-In Flow
1. Open liberture.com in incognito mode
2. Cookie banner should appear
3. Click "Accept All"
4. Check browser dev tools → Network tab
5. You should see requests to `googletagmanager.com` and `google-analytics.com`

### Test Opt-Out
1. Go to `/dashboard/settings`
2. Toggle "Analytics Cookies" OFF
3. Page reloads
4. Check Network tab - no analytics requests

### Verify in Google Analytics
1. Go to GA4 dashboard → Realtime
2. Navigate around the site (with analytics enabled)
3. Should see active users and page views

## Troubleshooting

### Analytics not loading after accepting cookies

**Check:**
1. `NEXT_PUBLIC_GA_ID` is set correctly in `.env.local`
2. Measurement ID starts with `G-`
3. Page was reloaded after accepting cookies
4. Browser is not blocking trackers (disable ad blockers for testing)

### Consent banner not appearing

**Check:**
1. `localStorage.getItem('cookie-consent')` in browser console
2. If value exists, delete it: `localStorage.removeItem('cookie-consent')`
3. Refresh page

### Data not showing in GA4

**Check:**
1. GA4 property is for the correct domain
2. Measurement ID is correct
3. Wait 24-48 hours for data to populate
4. Check Realtime reports for immediate feedback

## Files Modified

- `/components/CookieConsent.tsx` - Cookie consent banner
- `/app/layout.tsx` - Added CookieConsent component
- `/app/(site)/dashboard/settings/page.tsx` - Cookie preferences UI
- `/app/(site)/privacy/page.tsx` - Privacy policy
- `/app/(site)/terms/page.tsx` - Terms & conditions
- `/components/layout/landing-footer.tsx` - Links to privacy/terms

## Additional Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)
- [Google Analytics Opt-Out Browser Add-on](https://tools.google.com/dlpage/gaoptout)
