# OSMIC Portal


## Run it on your laptop

You need **Node.js 18 or newer** (check with `node -v`).

```
git clone https://github.com/bhavyaanil07/osmic.git
cd osmic/portal
npm install
npm run dev
```

Open the link it prints (usually http://localhost:5173).


## Online

The portal is published together with the OSMIC website by the workflow in `.github/workflows/deploy.yml` (repo root),
at **https://bhavyaanil07.github.io/osmic/portal/**.

## How it works

- **Database, logins and files:** Supabase. The tables and security rules are in `../supabase/schema.sql`.
- **Server functions** (`../supabase/functions/`):
  - `approve-application`: creates the account and emails the set-password link;
  - `bootstrap-admin`: first-time admin setup;
  - `reset-password`;
  - `passkey`: server-checked Face ID / fingerprint sign-in;
  - `mailer`: queued emails, deadline reminders and the 8 AM summary, run every 5 minutes.
- **Emails** are sent from the club Gmail account.

First-time setup: see [../SETUP.md](../SETUP.md). Without the Supabase settings, the portal shows an "almost ready" notice.

To run it locally against the real project, create `portal/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` (the publishable key).
