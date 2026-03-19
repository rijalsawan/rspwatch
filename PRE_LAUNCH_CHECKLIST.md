# Parliament Watch - Pre-Launch Checklist ✓

## ✅ Branding & SEO
- [x] Favicon/Icon updated to Eye symbol representing transparency
- [x] Apple touch icon configured
- [x] Open Graph images for social sharing (1200x630px)
- [x] Twitter card metadata configured
- [x] Web manifest (PWA ready)
- [x] Site metadata: title, description, keywords
- [x] Structured data (JSON-LD) included
- [x] Robots.txt configured (`/robots.txt`)
- [x] Sitemap generated (`/sitemap.xml`)

## ✅ Mobile & Responsive Design
- [x] Mobile navbar fixed (icon + text, no overflow)
- [x] Mobile menu (hamburger) hidden on desktop
- [x] Desktop navigation hidden on mobile
- [x] Eye icon branding consistent across all devices
- [x] Bottom-left Discussion FAB (mobile-friendly)

## ✅ Authentication & Security
- [x] NextAuth.js v4 configured
- [x] Prisma adapter for user storage
- [ ] **TODO**: Configure OAuth providers (Google, GitHub)
- [ ] **TODO**: Set strong `NEXTAUTH_SECRET` (currently weak)
- [ ] **TODO**: Set strong `ADMIN_SECRET` (production)
- [x] Database User model created
- [x] Session management configured

## ✅ Database & Data Model
- [x] Prisma schema updated with:
  - User, Account, Session, VerificationToken (Auth)
  - Poll, PollOption, PollVote (Voting)
  - Comment (Discussions)
- [x] Database migrations applied
- [x] Prisma client configured

## ✅ Core Features Setup
- [x] Homepage branding: "Parliament Watch" (neutral, all-parties)
- [x] Discussion page (`/discussions`) created with mock data
- [x] Public polling component for sentiment
- [x] API endpoints structure in place
- [x] Navbar and Footer rebranded

## ✅ Build & Performance
- [x] Full build succeeds (`npm run build`)
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Turbopack compilation successful
- [x] All routes prerendered correctly (41 static pages)

## ✅ Social Sharing Ready
- [x] Open Graph image: Eye icon + "Parliament Watch" branding
- [x] Twitter card support
- [x] Meta description optimized for social
- [x] Keywords include Nepal, Parliament, politics, accountability
- [x] Sharing preview shows correctly

---

## ⚠️ BEFORE GOING LIVE - Required Actions

### 1. **Environment Variables - UPDATE THESE**
```bash
# Current: .env
ADMIN_SECRET="your-secure-admin-secret-here"  # CHANGE THIS - min 32 chars
NEXTAUTH_SECRET='any-32-char-string'           # CHANGE THIS - must be 32+ chars
NEXT_PUBLIC_SITE_URL="https://parliamentwatch.np"  # Verify this domain
```

### 2. **NextAuth OAuth Setup (Choose One or Both)**
- [ ] Google OAuth: Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] GitHub OAuth: Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Or use email provider if preferred

### 3. **Database Verification**
- [ ] Test database connection in production
- [ ] Verify Prisma migrations are applied
- [ ] Test that users can create accounts
- [ ] Test that comments/voting works end-to-end

### 4. **API Endpoints Testing**
- [ ] `/api/health` - returns healthy status
- [ ] `/api/polls/[entityId]` - voting works
- [ ] `/api/discussions/[slug]/comments` - commenting works
- [ ] All 404s handled correctly

### 5. **Security Headers (Recommended)**
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ]
}
```

### 6. **Deployment Checklist**
- [ ] Domain points to production server
- [ ] HTTPS/SSL certificate installed
- [ ] Vercel/Netlify/Self-hosted ready
- [ ] Error tracking set up (Sentry recommended)
- [ ] Analytics configured (Google Analytics, Mixpanel, etc.)

### 7. **Content Review**
- [ ] Homepage copy reviewed
- [ ] All page titles and descriptions reviewed
- [ ] No placeholder text remains
- [ ] Links all working correctly

### 8. **Social Media Sharing Test**
Share the link on:
- [ ] Reddit (r/Nepal, r/Politics, etc.)
- [ ] Facebook
- [ ] Twitter
- [ ] LinkedIn
- Verify the preview shows Eye icon + title + description

---

## Reddit Sharing Strategy

### Recommended Subreddits:
1. **r/Nepal** - Nepali users interested in local politics
2. **r/test** - Test sharing first (optional)
3. **r/Politics** - For broader political discussion
4. **r/Journalism** - Civic data angle
5. **r/OpenData** - Transparency angle

### Post Template:
```
Title: "Parliament Watch - Track Nepal's Political Accountability Transparently"

Body:
"Just launched Parliament Watch - an open-source tracker showing Nepal's Parliament 
in real-time: vote records, promised kept/broken, MP performance, and public discourse.

Built with transparent, publicly-sourced data. All data is open and available.

Features:
• Track bills and legislation
• Voting records for all MPs
• Promise tracker
• Community discussions on policies
• Real-time polling

Check it out: https://parliamentwatch.np

Open source - contributions welcome!"

Tags: #NepaliPolitics #Transparency #CivicTech #OpenData
```

---

## Performance Metrics Target
- [ ] Lighthouse score: 85+
- [ ] First Contentful Paint: < 2s
- [ ] Time to Interactive: < 3s
- [ ] Cumulative Layout Shift: < 0.1

---

## Final Checklist
- [ ] All boxes above checked
- [ ] Team reviewed copy/content
- [ ] Legal/compliance review (if needed)
- [ ] Launch announcement prepared
- [ ] Social media posts scheduled
- [ ] **LAUNCH APPROVED** ✅
