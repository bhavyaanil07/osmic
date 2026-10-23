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

1. github.com > **+** > **New repository** > name it `osmic` > **Public** > **Create repository**.
2. Click **uploading an existing file**, drag in everything inside `osmic-site`, click **Commit changes**.
3. In the repository: **Settings > Pages**. Under "Branch", choose **main** and **/(root)**, click **Save**.
4. Wait 1-2 minutes. Your site is at **https://YOUR-GITHUB-NAME.github.io/osmic/**

To update later: open `content.js` on GitHub, click the pencil, edit, **Commit changes**.
