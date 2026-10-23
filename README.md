# OSMIC Website

An animated website for the OSMIC club. No Python or Streamlit needed.

## Files

```
osmic-site/
  index.html    the page (don't need to edit)
  style.css     colours and animations (don't need to edit)
  script.js     animation code (don't need to edit)
  content.js    ALL the text, projects, members, events  <- edit this
  images/       your logo, photos, project pictures
  portal/       the member portal (React app, see portal/README.md)
```

## See it on your Mac

Double-click `index.html`. It opens in your browser. That's it.

## Change the content

1. Open `content.js` with **VS Code** (recommended) or TextEdit.
   - If you use TextEdit: first go to **TextEdit > Settings** and choose **Plain Text**, and turn off **Smart quotes** (Edit > Substitutions). Curly quotes break the site.
2. Change the text inside the quotes and save with **Command + S**.
3. Refresh the browser with **Command + R**.

If the page shows "content.js has a mistake", a comma or quote is missing near the last thing you changed.

## Photos

- **Logo:** save it as `images/logo.png`.
- **Background photos:** put e.g. `hero.jpg` in `images`, then in content.js set `hero: "images/hero.jpg"`.
- **Project picture:** in a project, set `image: "images/jalanetra.jpg"`. Empty `""` shows an automatic design.
- **Member photo:** set `photo: "images/bhavya.jpg"`. Empty `""` shows initials.
- File names must match exactly, including capital letters.

## Put it online free (GitHub Pages)

The website and the member portal are published together:

- Website: **https://bhavyaanil07.github.io/osmic/**
- Member portal: **https://bhavyaanil07.github.io/osmic/portal/**

One-time setup: in this repository, **Settings > Pages > Source**, choose **GitHub Actions**.
After that, every change pushed to `main` (website or portal) goes live in 1 to 2 minutes.
You can follow each release in the **Actions** tab.

To update the text later: open `content.js` on GitHub, click the pencil, edit, **Commit changes**.

## Run it on your computer

Use two windows and keep both open:

```
cd osmic/portal
npm install
npm run dev
```

```
cd osmic
npx http-server . -p 8000 -c-1 -a 127.0.0.1
```

Open http://localhost:8000. On your computer, the Member portal button opens the portal running at localhost:5173.
