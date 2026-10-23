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

## Stage 2 plan

1. Create a Supabase project (free) and run the database script (tables + security rules).
2. Swap the demo store for Supabase calls: logins, data and file storage.
3. Add the approval Edge Function: creates the account and sends the "set your password" email.
4. Connect Resend for automatic emails, plus a scheduled job for deadline reminders and the daily summary.
