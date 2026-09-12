# E-PavtiBook — Android & iOS apps

## What this actually is

A Capacitor **remote-URL wrapper**, not a separate app rewrite. `capacitor.config.ts`
points both native shells at `https://our.epavtibook.com` — the real, live,
server-rendered site (auth, PDF generation, the Cashfree payment redirect flow,
everything). There's no static export involved and there couldn't be; this app
needs a real backend on every page.

This means: every normal web deploy (a bugfix, a new feature, a copy change)
is **instantly** what both app-store users see too — nothing to resubmit.
You only need a new store submission for changes to the native *shell* itself:
icons, splash screen, permissions, or an added native plugin (push
notifications, etc.).

## What's done

- Capacitor installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`)
- `capacitor.config.ts` — app id `com.epavtibook.app`, points at the live site
- `android/` — full native Android Studio project, already synced
- `ios/` — full native Xcode project, already synced
- App icon + splash screen generated for both platforms (from `assets/icon.png`,
  sourced from `public/brand/logo-mark-512.png` — **512×512, below the 1024×1024
  Apple recommends for its App Store listing icon specifically**; in-app icons
  look fine, but if you get a real 1024×1024+ master logo later, drop it in as
  `assets/icon.png` and re-run `pnpm cap:assets`)
- App name "E-PavtiBook" set correctly on both platforms

## What only you can do from here (needs your machine + your accounts)

I don't have a full Xcode.app, Android Studio, or CocoaPods in this
environment — only the CLI tooling that generates project files, not the
toolchains that build/sign/publish them. You'll need, on a Mac:

1. **Android Studio** (free) — https://developer.android.com/studio — gives you
   the Android SDK + an emulator, needed even just to test.
2. **Xcode** (free, full app not just Command Line Tools) from the Mac App
   Store — needed for any iOS build at all.
3. **CocoaPods**: `sudo gem install cocoapods` (only if a future plugin needs
   it — this project currently builds via Swift Package Manager instead,
   which Capacitor generated automatically, so you may not need this yet).
4. **Google Play Console account** — https://play.google.com/console — **$25,
   one-time**.
5. **Apple Developer Program** — https://developer.apple.com/programs — **$99,
   every year**.

## Day-to-day workflow

```bash
pnpm --filter @pavti/web build     # only matters if you ever switch off remote-URL mode
pnpm --filter @pavti/web cap:sync  # copies capacitor.config.ts + plugin changes into both native projects
pnpm --filter @pavti/web cap:android  # opens android/ in Android Studio
pnpm --filter @pavti/web cap:ios      # opens ios/App/App.xcodeproj in Xcode
```

Since the app loads the live site remotely, you don't need to rebuild/resync
for ordinary web changes — only after editing `capacitor.config.ts` itself,
adding a native plugin, or regenerating assets.

## Getting to an actual store listing

### Android
1. Open `android/` in Android Studio (`pnpm cap:android`).
2. Build → Generate Signed Bundle/APK → create a new keystore the **first**
   time (back this up somewhere safe — losing it means you can never update
   the app again under the same listing).
3. Produces a `.aab` (Android App Bundle) — upload that to Play Console.
4. Play Console walks you through the store listing itself (screenshots,
   description, privacy policy URL, content rating questionnaire).

### iOS
1. Open `ios/App/App.xcodeproj` in Xcode (`pnpm cap:ios`) — this project
   uses Swift Package Manager for Capacitor's dependencies (not CocoaPods),
   so there's no `.xcworkspace` to look for; the `.xcodeproj` is the real
   thing to open.
2. Signing & Capabilities tab → sign in with your Apple Developer account →
   Xcode handles provisioning automatically.
3. Product → Archive → Distribute App → App Store Connect.
4. Fill in the listing at https://appstoreconnect.apple.com (same kind of
   info as Play Console, plus Apple's own screenshot-size requirements per
   device).

**One honest thing to plan around**: Apple's Guideline 4.2 ("Minimum
Functionality") is stricter than Google about apps that are essentially just
a website in a wrapper, and does sometimes reject them on first submission.
Two things that meaningfully help pass review if you hit that:
- Add a real native feature — push notifications (`@capacitor/push-notifications`)
  is the most common, relatively small addition that satisfies reviewers.
- In the App Store Connect review notes, briefly explain what the app does
  and who it's for (Mandal/trust receipt & collection management) — reviewers
  read those, and it's often enough on its own for a genuinely useful business
  tool like this one, not a marketing wrapper.

Android has no equivalent policy — the TWA/wrapper pattern is explicitly
supported and common there.

## A required page you don't have yet

Both stores require a **privacy policy URL** in the listing. If you don't
already have one published somewhere on the site, that's a real blocker for
submission on both platforms — worth sorting out before you get to the
upload step.
