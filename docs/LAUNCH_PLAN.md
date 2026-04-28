# App Launch & Marketing Plan: My Curated Haven

This comprehensive plan outlines the steps to take your parenting app from development to the hands of users.

## Phase 1: Preparation (Technical & Legal)

Before you can invite users, the foundation must be solid.

### 1. Finalize Branding & Metadata
- **App Name:** Ensure the display name in `app.json` matches your store listing (e.g., "My Curated Haven" instead of "Parenting App").
- **Icon:** You have a premium icon. Ensure it looks good on both light and dark backgrounds.
- **Screenshots:** You have raw screenshots. You need to create "Store Screenshots" which include the device frame and a caption above the image (e.g., "Track Every Milestone", "AI Expert in Your Pocket"). Tools like *AppScreens* or *Canva* can help.

### 2. Legal Requirements
- **Privacy Policy:** Required for App Store submission. Since you use Supabase and AI, you must disclose data usage.
- **Terms of Service:** Standard agreement for users.
- **Support URL:** A simple landing page or email address where users can contact you.

### 3. Technical Setup
- **Analytics:** You have looked into GA4. Ensure it's tracking key events: `onboarding_complete`, `subscription_started`, `chat_message_sent`, `milestone_added`.
- **Crash Reporting:** Sentry is recommended for React Native/Expo apps to track crashes in production.
- **Production Build:** Configure `eas.json` for production builds (already present, but needs verification).

## Phase 2: App Store Optimization (ASO)

This is how users find you organically in the App Store.

### 1. Keywords
Focus on high-volume, medium-competition keywords.
- **Primary:** Parenting, Baby Tracker, Newborn Guide, Milestones.
- **Secondary:** AI Advice, Baby Sleep, Breastfeeding, Toddler Activities.
- **Hidden Keywords (iOS):** Use the 100-character keyword field for variations (e.g., "infant,growth,chart,development,mom,dad").

### 2. Title & Subtitle
- **Title:** My Curated Haven: Parenting AI (30 chars max is ideal, but up to 50 allowed).
- **Subtitle:** Track Milestones & Get Advice (30 chars max).

### 3. Description
- **First 3 lines:** The "hook". Mention the AI chat and personalized tips immediately.
- **Feature List:** Use bullet points (like in your README) to make it scannable.
- **Social Proof:** "Join thousands of parents" (once you have them).

## Phase 3: The Launch Strategy

### 1. Beta Testing (TestFlight)
- **Goal:** Catch bugs and get initial feedback.
- **Action:** Invite 10-20 friends/family with kids.
- **Feedback Loop:** Create a simple Google Form or use the TestFlight feedback feature.

### 2. Soft Launch
- **Goal:** Test marketing channels and retention without burning your budget.
- **Action:** Release to the App Store but don't announce it widely. Run small ads ($10/day) to get ~100 strangers to use it.
- **Metric:** Watch Day-1 and Day-7 retention. If people leave immediately, fix the product before marketing more.

### 3. Hard Launch
- **Goal:** Maximum visibility.
- **Action:**
    - Post on Product Hunt.
    - Announce on all social channels.
    - Email waitlist (if you collected one).

## Phase 4: Marketing Channels

### 1. Social Media (Organic)
- **Instagram/TikTok:** This is your #1 channel.
    - **Content:** "3 things I wish I knew before having a baby", "How to track milestones easily".
    - **Style:** Authentic, relatable, not too "salesy". Show the app solving a problem.
- **Pinterest:** Great for "Baby Tips" infographics that link to your app/website.

### 2. Paid User Acquisition
- **Apple Search Ads:** The highest intent. Bid on keywords like "parenting app" or competitor names.
- **Meta Ads (Facebook/Instagram):** Target interests: "New Parents", "Baby Shower", "Pampers", "Huggies". Use video ads showing the AI chat in action.

### 3. Content Marketing
- **SEO:** Write blog posts like "When do babies start smiling?" and include a CTA: "Track this milestone in My Curated Haven".
- **Guest Posting:** Write for parenting blogs or newsletters.

### 4. Influencer Marketing
- **Micro-Influencers:** Find moms/dads with 5k-50k followers. They are cheaper and have higher engagement.
- **Offer:** Free lifetime subscription in exchange for a shoutout or Reel.

## Phase 5: Retention & Growth

- **Push Notifications:** "💡 Daily Tip: Tummy time helps build neck strength. Try it for 5 mins today!"
- **Referral Program:** "Invite a parent friend and get 1 month of Premium free."
- **Review Prompting:** Ask for a rating *after* a "happy moment" (e.g., user logs a milestone). **Do not** ask upon app launch.

## Action Plan Checklist

- [ ] **Rename App:** Update `app.json` name to "My Curated Haven".
- [ ] **Generate Screenshots:** Create App Store ready screenshots.
- [ ] **Privacy Policy:** Create a hosted privacy policy page.
- [ ] **Build:** Run `eas build --profile production` to verify the build works.
- [ ] **TestFlight:** Upload a build and invite your first tester.
