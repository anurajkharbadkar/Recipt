# Play Store submission reference

Everything here is drafted from what the app actually does (see privacy.tsx
and the codebase) — copy these into Play Console's forms directly. Review
before submitting; you know the business better than this draft does.

## Data Safety form

Google's form is a series of yes/no + category questions. Answer each
data type below exactly as shown.

### Does your app collect or share any of the required user data types?
**Yes**

### Data types

| Data type | Collected? | Shared? | Purpose | Optional or required |
|---|---|---|---|---|
| Name | Yes | No | Account management, App functionality | Required |
| Email address | Yes | No | Account management, App functionality | Optional |
| Phone number | Yes | No | Account management (this is the login ID) | Required |
| Physical address | Yes | No | App functionality (Organization's own address) | Optional |
| Other financial info | Yes | Yes (Cashfree Payments) | Payments (Cashfree processes it directly — this app never stores card/UPI details) | Required (to pay a subscription) |
| Precise location | Yes | No | App functionality (optional GPS tag on receipt creation, for the Organization's own audit trail) | Optional |
| Photos | Yes | No | App functionality (logo upload) | Optional |
| App activity — Other actions | No | — | — | — |
| Device or other IDs | No | — | — | — |

Everything not listed above (App info & performance, Web browsing, etc.):
**Not collected.**

### Is all of the user data collected by your app encrypted in transit?
**Yes**

### Do you provide a way for users to request that their data be deleted?
**Yes** — link to: `https://our.epavtibook.com/privacy` (Section 5, "Your
Rights & Choices" — also covers the in-app self-service deletion at
Account → Danger Zone).

### Data collection is required for the app to function
Check this for: Name, Phone number (these are how login/accounts work at
all). Leave unchecked for the optional fields (Email, Address, Location,
Photos).

---

## Store listing copy

### App name
**E-PavtiBook**

### Short description (max 80 characters)
```
Digital receipts & collections for Mandals, Trusts & community groups
```
(69 characters)

### Full description (max 4000 characters)
```
E-PavtiBook is a digital receipt and collection management app built for
Mandals, Trusts, and community organizations — the modern replacement for
the paper pavti book.

WHAT IT DOES
• Issue instant digital receipts (Pavtis) to donors, in English, Hindi,
  or Marathi
• Track every collector, every campaign, and every rupee collected — in
  real time
• Share receipts directly over WhatsApp, with a beautiful interactive
  digital pavti experience donors can open on any phone
• Manage staff (Collectors, Treasurers) with role-based access, so
  everyone sees only what they need to
• Track expenses alongside collections for a complete picture of your
  event or campaign's finances
• Generate reports for your committee, auditors, or annual general body
  meeting in a few taps

WHO IT'S FOR
Ganesh Mandals, Navratri committees, religious trusts, housing societies,
and any community organization that collects donations or membership
fees and currently relies on a handwritten receipt book.

WHY DIGITAL
No more torn receipt books, illegible handwriting, or manually tallying
collections at the end of a long day. Every receipt is backed up, every
number adds up automatically, and your donors get a professional,
verifiable digital receipt instead of a carbon-copy slip.

Get started free — no payment required to try it.
```

### Category
Finance (or Business — pick whichever your Play Console account defaults
to; both fit)

### Content rating questionnaire
This is a financial record-keeping tool with no user-generated public
content, no chat between strangers, no gambling. Expect this to land on
"Everyone" once you fill in Google's actual questionnaire (their exact
wording changes, so answer live rather than trusting a fixed script here)
— just answer honestly that there's no violence/gambling/mature content
and it should resolve there automatically.

### Privacy Policy URL
`https://our.epavtibook.com/privacy`

### Contact details
- Email: support@epavtibook.com
- Website: https://our.epavtibook.com
