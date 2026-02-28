# StayFit: Fitness Tracking Reimagined

Welcome to **StayFit**, a comprehensive, cross-platform fitness tracking application designed to help users log workouts, check nutrition, share progress, and build streaks. 

StayFit combines a sleek React Native (Expo) frontend with a powerful, real-time Supabase backend, making it the ultimate robust hackathon project for health and fitness.

---

## 🚀 Key Features

*   **Robust Authentication**: Seamless login and registration powered by Supabase Auth with secure RLS (Row Level Security).
*   **Comprehensive Workout Tracking**: Log sets, reps, and weights. Access a vast pre-seeded dictionary of exercises with form instructions and target muscle groups.
*   **Dynamic Streaks & Gamification**: Stay motivated with daily streaks and unlockable achievements built directly into the database logic.
*   **Social & Progress Sharing**: Share your fitness journey using custom QR codes and "StayFit Cards."
*   **Personalization**: Highly customizable UI with built-in theme switching (Dark/Light mode) and dynamic accent color preferences.
*   **Performance Monitoring**: Track body weight history, total calories burned, and total workout durations via automated daily summaries.

---

## 🛠️ Technology Stack

*   **Frontend Framework**: React Native (built with Expo SDK 52)
*   **Navigation**: Expo Router (File-based routing)
*   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
*   **Serverless Logic**: Deno Edge Functions
*   **State Management**: React Context & Hooks
*   **Styling**: React Native styling with dynamic theme context support
*   **Language**: TypeScript

---

## 📁 Repository Structure

*   **/app**: The core frontend screens, layouts, and routing logic mapped by Expo Router (e.g., `/(tabs)` for the main navigation, `/(onboarding)` for the initial setup flow).
*   **/components**: Reusable UI elements (buttons, modals, headers, icons, input fields).
*   **/constants**: Shared constants like Colors, Typography, and global API keys.
*   **/assets**: Image assets, customized fonts, animations, and the core app icon.
*   **/supabase**: The complete backend environment.
    *   `migrations/`: Sequential SQL scripts that define the 28+ PostgreSQL tables, triggers, and RLS policies.
    *   `functions/`: Scalable Edge Functions written in Deno for complex data lifting.
    *   *(See `supabase/README.md` for a deep dive into the database schema!)*
*   **/scripts**: Internal developer scripts used for seeding images or pulling data. 

---

## 💻 Getting Started (Local Development)

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Git](https://git-scm.com/)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/vMcCharlie/stayfitapp.git
    cd stayfit-solana
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Copy `.env.example` to `.env` and fill in your Supabase connection details.
    ```bash
    cp .env.example .env
    ```
    *(Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are populated).*

4.  **Start the Expo Development Server**
    ```bash
    npm run start
    ```
    Scan the provided QR code with the Expo Go app on your physical device, or press `a` to run it on an Android emulator or `i` for an iOS simulator.

### Linking to Supabase (Optional)
If you need to edit the database schema or deploy new functions during the hackathon, link your local CLI to the remote project:
```bash
npx supabase link --project-ref rcyqcfipndcglfoelizd
```

---

## 📦 Building for Production

If you need to generate a standalone APK (Android) or IPA (iOS), please refer to the specific build guide:
👉 [**APK_BUILD_GUIDE.md**](./APK_BUILD_GUIDE.md)

---

## 🤝 Contributing & Hackathon Details

This project is built for high extensibility. When adding new features:
1.  **Frontend changes**: Create new screens in `app/` and abstract the UI into `components/`.
2.  **Backend changes**: Add new tables using the Supabase Dashboard, then pull the definitions locally with `npx supabase db pull`.

*StayFit is actively developed and prepared for deployment in competitive environments. Good luck!*
