# StayFit — Move-to-Earn Fitness for the Seeker Community

**StayFit** is a native Android fitness app built from the ground up for the Solana Seeker. It turns every workout into an on-chain reward — track sets, build streaks, earn XP, and grow your $GAINS allocation, all powered by the Solana Mobile Stack and Mobile Wallet Adapter.

> Built for the **Monolith Hackathon** — a 5-week sprint to ship real mobile apps for the Solana dApp Store.

---

## Why StayFit?

The Seeker community is mobile-first, crypto-native, and looking for apps that reward real-world action. StayFit sits at the intersection of fitness and on-chain incentives:

- **Daily habit loop** — Streak system with fire/ice visuals keeps users coming back every day
- **Solana-native rewards** — XP earned per workout, multiplied by SKR token holdings and referrals, allocated toward $GAINS distribution
- **Built for mobile** — Haptics, push notifications, camera, speech synthesis, sharing — not a web wrapper, a real native app
- **Social virality** — QR-code StayFit Cards, referral boosts, public profiles, shareable workout summaries

---

## Core Features

### Workout Engine
- Pre-seeded exercise dictionary with 100+ exercises, form instructions, target muscle groups, and animated demonstrations
- Create custom routines or pick from curated programs (home/gym, beginner to advanced)
- Live session tracking: sets, reps, weight, duration, calories burned — exercise by exercise
- Resume interrupted workouts from a persistent banner on home screen
- Rest timer with haptic feedback and spoken countdown via `expo-speech`

### Streak & Gamification System
- **Fire streak** — Logged a workout today
- **Ice streak** — Rest day, streak preserved (no penalty for recovery)
- **Freeze streak** — Manually protect your streak on off days
- Unlockable achievements with progress tracking and celebratory modals
- Multi-day challenges with day-by-day routines and completion tracking

### Solana Integration (Mobile Wallet Adapter)
- **Wallet connection** via `@solana-mobile/mobile-wallet-adapter-protocol-web3js` — authorize on mainnet-beta, store address in profile
- **SKR Boost** — Connect wallet, hold SKR tokens, earn a higher XP multiplier on every workout
- **Referral Boost** — Permanent +0.01 multiplier for every friend who joins and completes a 7-day streak (uncapped)
- **$GAINS allocation** — Total XP balance determines share in upcoming token distribution
- **Progress photo NFTs** — Mint transformation photos as on-chain NFTs via Metaplex (`mpl-token-metadata` + UMI)
- **XP transaction ledger** — Full history of workout rewards, referral bonuses, and multiplier events

### Mobile-Native Features
| Feature | SDK | Usage |
|---|---|---|
| Push notifications | `expo-notifications` | Daily workout reminders at user-set time |
| Camera & gallery | `expo-image-picker` | Profile photos, progress photo logging |
| Haptic feedback | `expo-haptics` | Tab presses, exercise selections, timer events |
| Speech synthesis | `expo-speech` | Rest timer spoken countdown |
| Media library | `expo-media-library` | Save & share workout summary cards |
| Image manipulation | `expo-image-manipulator` | Compress/resize photos before upload |
| Native sharing | `expo-sharing` | Share workout summaries, QR profile cards |
| Clipboard | `expo-clipboard` | Copy referral codes and usernames |
| Keep awake | `expo-keep-awake` | Screen stays on during active workouts |

### Personalization & UX
- 7-step onboarding: gender, fitness goal, level, frequency, equipment, body metrics, account creation
- Dynamic theming with dark/light modes and multiple accent palettes (Forest Fresh, Ocean Blue, etc.)
- Gender-specific workout imagery and animations
- Fluid animations via `react-native-reanimated` and `lottie-react-native`
- Confetti celebrations on workout completion

### Reporting & Analytics
- Body weight history with trend charts
- Exercise weight progression tracking
- Focus area heatmaps (which muscle groups you train most)
- Daily/weekly/monthly workout summaries with calories, duration, and volume
- Progress photo calendar with timeline view

---

## Architecture

```
stayfit-seeker/
├── app/                          # Expo Router file-based screens
│   ├── _layout.tsx               # Root stack navigator
│   ├── (onboarding)/             # 7-step onboarding flow
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home — streaks, challenges, routines
│   │   ├── rewards.tsx           # XP balance, wallet, referrals, history
│   │   ├── reports.tsx           # Charts, analytics, progress
│   │   ├── profile.tsx           # User profile, calendar, achievements
│   │   └── more.tsx              # Weight log, progress photos, create routine
│   └── components/               # Screen-specific components
│       ├── routine*.tsx          # Workout flow (start → exercise → rest → complete)
│       ├── ProfileCalendar.tsx   # Progress photo calendar + NFT minting
│       ├── ThemeBackground.tsx   # Dynamic themed backgrounds
│       └── AIChat.tsx            # AI fitness assistant
├── src/
│   ├── context/
│   │   ├── auth.tsx              # Auth + Solana MWA wallet connection
│   │   └── theme.tsx             # Theme provider with palette system
│   ├── services/
│   │   ├── api.ts                # Supabase API layer with caching
│   │   ├── nftService.ts         # Metaplex NFT minting via UMI
│   │   ├── notificationService.ts # Push notification scheduling
│   │   ├── workoutPersistenceService.ts # Offline workout state
│   │   └── offlineService.ts     # Offline-first data layer
│   └── lib/
│       └── supabase.ts           # Supabase client config
├── supabase/
│   ├── migrations/               # 60+ sequential SQL migrations
│   ├── functions/                # Deno Edge Functions
│   │   └── workout-tracker/      # XP calc, streak logic, referral bonuses
│   └── complete_schema_reference.sql
├── assets/                       # Fonts (Outfit family), images, animations
├── android/                      # Custom dev build for MWA support
└── app.json                      # Expo SDK 54 config with Android permissions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navigation | Expo Router 6 (file-based, typed routes) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Serverless | Deno Edge Functions |
| Blockchain | Solana (`@solana/web3.js` 1.98) |
| Wallet | Mobile Wallet Adapter (`@solana-mobile/mobile-wallet-adapter-protocol-web3js` 2.2) |
| NFT | Metaplex UMI + `mpl-token-metadata` |
| State | React Context + AsyncStorage |
| Animations | React Native Reanimated 4.1 + Lottie |
| Language | TypeScript |

---

## Database Schema (28 tables)

The PostgreSQL schema is organized into six logical domains:

1. **User & Identity** — `profiles`, `social_links`, `follows`
2. **Exercise Dictionary** — `exercises`, `exercise_focus_areas`, `exercise_tips`, `exercise_mistakes`, `exercise_animations`
3. **Workout Routines** — `workout_routines`, `routine_exercises`
4. **Live Session Tracking** — `workout_sessions`, `exercise_completions`, `focus_area_tracking`, `workouts`
5. **Gamification & Streaks** — `workout_streaks`, `user_streak_history`, `achievements`, `user_achievements`, `challenges`, `challenge_days`, `user_challenges`, `user_challenge_logs`, `activities`, `xp_transactions`, `referrals`
6. **Health & Metrics** — `weight_history`, `exercise_weight_history`, `progress_photos`, `nutrition_logs`, `daily_workout_summary`

Full schema reference: [`supabase/complete_schema_reference.sql`](./supabase/complete_schema_reference.sql)

---

## Solana Mobile Stack Integration

### Mobile Wallet Adapter (MWA)
```typescript
// src/context/auth.tsx — wallet authorization via MWA
const mwa = require("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
await mwa.transact(async (wallet) => {
  const result = await wallet.authorize({
    cluster: "mainnet-beta",
    identity: APP_IDENTITY,
  });
  walletAddress = result.accounts[0].address;
});
```

### XP Economy (On-Chain Incentive Layer)
```
XP Reward = (Base XP + Time Bonus + Calorie Bonus) × Multiplier
```
- **Base XP**: 100 XP per workout session
- **Time Bonus**: +5 XP per minute (Up to 90 minutes capped)
- **Calorie Bonus**: +0.5 XP per calorie burned
- **Daily Limit**: XP awarded for first 2 workouts per day only
- **SKR Boost**: Hold $SKR tokens to increase your global multiplier
- **Referral Boost**: Permanent +0.01 multiplier for every friend who joins and hits a 7-day streak
- **Allocation**: Total XP balance directly determines your share in upcoming $GAINS distribution

### Progress Photo NFT Minting
Mint transformation photos as compressed NFTs on Solana via Metaplex UMI, signed through MWA. Entry point in the profile calendar when viewing progress photos with a connected wallet.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for custom dev builds with MWA support)
- A Solana wallet app (Phantom, Solflare) on your Android device

### Setup
```bash
git clone https://github.com/your-org/stayfit-solana.git
cd stayfit-solana
npm install
cp .env.example .env
# Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Development
```bash
# Expo Go (limited — no MWA support)
npm run start

# Custom dev build (full MWA + native features)
npx expo run:android
```

### Build APK
See [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md) for production build instructions.

---

## Team

Built with focus on the Seeker community during the Monolith Hackathon.

---

## License

This project is submitted as part of the Solana Monolith Hackathon.