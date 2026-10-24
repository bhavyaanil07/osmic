# Turning on the real portal

This is a one-time setup, and it takes about 20 minutes. Until you finish it, the live portal shows "The portal is almost ready".

You need three accounts: **Supabase** (the free database and login service), a **club Gmail account** (it sends the emails), and this **GitHub repo**.

> **Keep these private:** the Supabase access token, the Supabase secret / service-role key and the Gmail app password.
> Paste them only into GitHub secrets (step 4). Never put them in a file, a chat or a commit.

---

## 1. Create the Supabase project

1. Go to https://supabase.com and sign up (GitHub login is easiest).
2. Click **New project**.
   - Name: `osmic`
   - Database password: click **Generate** and save it somewhere safe. You won't need it day to day.
   - Region: **South Asia (Mumbai)**
3. Wait about 2 minutes for it to finish.
4. Open **Project Settings > General** and copy the **Project ID**. It looks like `abcdefghijklmnopqrst`. This is your *project ref*.

## 2. Create a Supabase access token

1. Open https://supabase.com/dashboard/account/tokens
2. Click **Generate new token** and name it `osmic-github`.
3. Copy the token (it starts with `sbp_`). It is shown only once.

## 3. Set up the club Gmail account

1. Create the club Gmail account, or sign in to it.
2. Turn on **2-Step Verification** at https://myaccount.google.com/security
3. Open https://myaccount.google.com/apppasswords and create an app password named `OSMIC portal`.
4. Copy the 16-letter password. Spaces don't matter.

## 4. Add the secrets to GitHub

In the repo, open **Settings > Secrets and variables > Actions > New repository secret** and add these five:

| Name | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | the `sbp_...` token from step 2 |
| `SUPABASE_PROJECT_REF` | the project ID from step 1 |
| `GMAIL_USER` | the club Gmail address |
| `GMAIL_APP_PASSWORD` | the 16-letter app password from step 3 |
| `ADMIN_EMAIL` | **your personal email**. This becomes the admin account. |

## 5. Deploy the backend

1. Open the **Actions** tab.
2. Click **Deploy backend** on the left, then **Run workflow > Run workflow**.
3. Wait for the green tick (about 2 minutes). This workflow:
   - creates the database tables and security rules;
   - turns off public sign-ups, so only approved members get accounts;
   - uploads the server functions and the email settings;
   - schedules the email job (every 5 minutes);
   - rebuilds the website so the portal connects to Supabase.
4. Wait for the **Deploy OSMIC site** run that starts next to turn green too.

If a step turns red, click it to read the message. It usually names the secret that is missing or mistyped.

## 6. Create your admin account

1. Open https://bhavyaanil07.github.io/osmic/portal/
2. The login page shows **Set up the admin**. Enter the same email you used for `ADMIN_EMAIL`.
3. Open the email from the club Gmail and click the link.
4. Choose a password (at least 8 characters). You're in as admin.

After the first admin exists, the setup option disappears for good.

## 7. Turn on Face ID / fingerprint (optional)

In the portal, go to **Security > Add this device** and follow your phone's or laptop's prompt. After that, the login page has a **Face ID / fingerprint** button.

---

## Everyday use

- **New members** apply at **Member portal > Apply**. You approve them in **Applications** and pick a club lead for each. They get an email to set their password.
- **Emails** for new tasks, results, leave decisions, announcements, deadline reminders (the day before) and the 8 AM daily summary are sent automatically.
- **Changing the backend:** any push that changes `supabase/` redeploys it automatically. You can also run **Deploy backend** again by hand at any time. It is safe to run more than once.

## Running the portal on your computer with the real data (optional)

1. In Supabase, open **Project Settings > API Keys** and copy the **Publishable key** (`sb_publishable_...`). This key is safe to share, because the security rules protect the data.
2. Create the file `portal/.env.local` containing:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_KEY=sb_publishable_...
```

3. Run `npm run dev` inside `portal`. `.env.local` is ignored by git.

## Something not working?

| Problem | Fix |
|---|---|
| Portal says "almost ready" | Steps 4 and 5 aren't finished, or the site rebuild after them hasn't finished yet. |
| No admin setup email | Check spam. Make sure the email exactly matches `ADMIN_EMAIL`. Check that the Gmail app password is right, then run **Deploy backend** again. |
| "Set up the admin" says not allowed | You typed a different email from `ADMIN_EMAIL`. |
| Email link says it didn't work | Links expire after 24 hours, or after being used once. Use **Forgot password?** to get a new one. |
| Face ID button does nothing | Add the device first in **Security**. It works only on the live site or localhost. |
