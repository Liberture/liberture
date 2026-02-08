# Resend Email Implementation - Liberture

## Overview
Complete email system with beautiful templates, notification preferences, and unsubscribe functionality.

## ✅ What's Implemented

### 1. Email Templates (React Email)
Location: `/emails/templates/`

**Base Template** (`base.tsx`)
- Dark theme design matching Liberture brand
- 6-dot logo (pillar colors: purple, cyan, green, pink, orange, yellow)
- Responsive layout
- Footer with links and unsubscribe
- Consistent styling across all emails

**Welcome Email** (`welcome.tsx`)
- Sent when users sign up
- Introduces all 6 pillars with descriptions
- CTA to dashboard
- Next steps guidance

**Weekly Digest** (`weekly-digest.tsx`)
- Weekly optimization report
- Streak counter (🔥 if active)
- New protocols section
- New articles section
- Pillar-specific badges

**System Emails**
- Password reset
- Email verification
- (Templates defined inline in `lib/resend.ts`)

### 2. Notification Preferences (Database)
Added to `User` model in Prisma schema:
- `emailNotifications` - General email notifications (default: true)
- `marketingEmails` - Marketing & product updates (default: true)
- `weeklyDigest` - Weekly summary emails (default: true)
- `newContentAlerts` - Alerts for new content (default: false)

### 3. API Routes

**`/api/user/notifications`**
- `GET` - Fetch user's notification preferences
- `PATCH` - Update notification preferences

**`/api/unsubscribe`**
- `GET` with `?token=xxx&type=all|marketing|digest`
- Unsubscribes user from specific email types
- Redirects to confirmation page

### 4. User-Facing Pages

**Settings Page** (`/dashboard/settings`)
- Toggle switches for each notification type
- Icons for each preference (Mail, Zap, TrendingUp, Bell)
- Real-time save feedback
- "Unsubscribe from all" button

**Unsubscribe Page** (`/unsubscribed`)
- Confirmation message
- Link back to settings
- Option to re-subscribe

### 5. Resend Integration (`lib/resend.ts`)
- Initialized with API key: `re_85RGhwqi_6rAkASAEDNBbcpgePmqZJCjX`
- Helper functions:
  - `sendWelcomeEmail(to, name)`
  - `sendWeeklyDigest(to, name, data)`
  - `sendPasswordResetEmail(to, resetUrl)`
  - `sendEmailVerification(to, verifyUrl)`

## Environment Variables

Added to `.env.local`:
```
RESEND_API_KEY=re_85RGhwqi_6rAkASAEDNBbcpgePmqZJCjX
```

## Design Highlights

### Color System
- **Background:** #0a0a0a (dark)
- **Text:** #ffffff (white), #ccc (muted), #666 (footer)
- **Pillars:**
  - Cognition: #8B5CF6 (purple)
  - Recovery: #06B6D4 (cyan)
  - Fueling: #10B981 (green)
  - Mental: #EC4899 (pink)
  - Physicality: #F59E0B (orange)
  - Finance: #EAB308 (yellow)

### Typography
- Font: Inter (loaded from Google Fonts)
- Headers: 700 weight
- Body: 400 weight
- Links: 600 weight

### Components
- Gradient buttons (purple → cyan)
- Pillar badges with pillar-specific colors
- Dividers with gradient fade
- Rounded corners (8px, 12px)
- Border colors match background

## How to Use

### Send Welcome Email (when user signs up)
```typescript
import { sendWelcomeEmail } from '@/lib/resend';

await sendWelcomeEmail('user@example.com', 'User Name');
```

### Send Weekly Digest
```typescript
import { sendWeeklyDigest } from '@/lib/resend';

await sendWeeklyDigest('user@example.com', 'User Name', {
  weekNumber: 42,
  newProtocols: [
    { title: 'Wim Hof Method', pillar: 'Recovery', url: 'https://...' }
  ],
  newArticles: [
    { title: 'Cold Exposure Science', pillar: 'Cognition', url: 'https://...' }
  ],
  streakDays: 7,
});
```

### Check User Preferences Before Sending
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { emailNotifications: true, weeklyDigest: true },
});

if (user?.weeklyDigest) {
  await sendWeeklyDigest(...);
}
```

## Unsubscribe Token Generation
```typescript
// Generate unsubscribe token (base64 encoded userId)
const token = Buffer.from(userId).toString('base64');
const unsubscribeUrl = `https://liberture.com/api/unsubscribe?token=${token}&type=all`;
```

## Next Steps (To Do)

1. **Run migration:**
   ```bash
   cd /root/liberture && npx prisma migrate dev
   ```

2. **Integrate with auth system:**
   - Replace `x-user-id` header with actual session auth
   - Add user context to API routes

3. **Test emails:**
   ```bash
   cd /root/liberture
   npm run email:dev  # If using react-email CLI
   ```

4. **Schedule weekly digests:**
   - Create cron job to send digests every Monday
   - Query users with `weeklyDigest = true`
   - Aggregate new content from past week

5. **Add welcome email trigger:**
   - Hook into registration flow
   - Send welcome email after user confirms email

## Files Created/Modified

- ✅ `.env.local` - Added RESEND_API_KEY
- ✅ `prisma/schema.prisma` - Added notification preferences to User model
- ✅ `lib/resend.ts` - Resend client + helper functions
- ✅ `emails/templates/base.tsx` - Base email template
- ✅ `emails/templates/welcome.tsx` - Welcome email
- ✅ `emails/templates/weekly-digest.tsx` - Weekly digest email
- ✅ `app/api/user/notifications/route.ts` - Preferences API
- ✅ `app/api/unsubscribe/route.ts` - Unsubscribe API
- ✅ `app/dashboard/settings/page.tsx` - Settings UI
- ✅ `app/(site)/unsubscribed/page.tsx` - Unsubscribe confirmation
- ✅ `components/ui/switch.tsx` - Toggle switch component

## Email Preview

Visit (once react-email dev server is running):
```
http://localhost:3001/preview
```

---

**Status:** 95% complete. Needs migration run, auth integration, and testing.
