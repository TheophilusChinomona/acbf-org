# Mobile ballot and deadline countdown

**Agent:** pixel
**Status:** done
**Priority:** high
**Branch:** staging

## Objective
Make category selection practical on phones and show the actual future deadline.

## Scope
- [x] Replace scrolling category buttons with a labelled native dropdown including nominee counts/voted state.
- [x] Separate manual launch hold from elapsed deadline in public messages.
- [x] Integrate React Bits Counter for days/hours/minutes/seconds to 19 November 2026 16:00 SAST.
- [x] Verify and push to existing staging PR; retain production/payment hold.

## Notes
Uses supplied React Bits JavaScript/CSS Counter (MIT + Commons Clause; bundled upstream LICENSE), no new dependencies.
Countdown derives from Firestore deadline, updates from clock after backgrounding,
clamps at zero, and disables intro/blur. Counter respects reduced motion.
The shared Firebase competition stays closed; this change does not authorize launch.

Validation: 52 awards tests passed, one emulator-gated skip; changed-file lint and production build passed. Browser fixture checks at 320/375/1280px passed (category switching, voted marker, clock updates, reduced motion, StrictMode, no overflow or page errors). No Firebase writes. Existing staging PR #12 remains draft; main and launch hold unchanged.
