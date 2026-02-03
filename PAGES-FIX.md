# Why the redirect still happens (and how to fix it)

## What’s going on

- **On GitHub:** The `main` branch has the **correct** `index.html` (portfolio page, no redirect). You can confirm: https://raw.githubusercontent.com/kumarjdas/kumarjdas.github.io/main/index.html
- **Live site:** https://kumarjdas.github.io/ still shows the **old** “Redirecting to Space Potato” page.

So the repo is fine; the **published site** is either built from the wrong source or is a **stale/cached** build.

---

## Fix 1: Check GitHub Pages source (most important)

1. Open: **https://github.com/kumarjdas/kumarjdas.github.io/settings/pages**
2. Under **“Build and deployment”** → **“Source”**:
   - Choose **“Deploy from a branch”**.
   - **Branch:** must be **`main`** (not `update-spacepotato` or `gh-pages`).
   - **Folder:** must be **“/ (root)”** (not `/docs`).
3. Click **Save** if you changed anything. That can trigger a new build.

If the branch or folder was wrong, fixing it and saving is often enough for the redirect to stop.

---

## Fix 2: Force a new deployment

If the source is already **main** and **/ (root)** but the live site still shows the redirect:

1. **Trigger a new build** by making a small change and pushing to `main`, e.g.:
   - Edit `index.html` (e.g. add a space or comment), commit, push to `main`, or
   - From repo root:  
     `git commit --allow-empty -m "Trigger GitHub Pages rebuild"`  
     then push.
2. Wait **2–5 minutes** for GitHub Pages to rebuild and deploy.
3. **Hard refresh** the site: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows), or open the site in a **private/incognito** window.

---

## Fix 3: Browser and CDN cache

Browsers and GitHub’s CDN can keep serving the old page:

- Try **https://kumarjdas.github.io/** in a **private/incognito** window.
- Or **clear site data** for `kumarjdas.github.io` in your browser (e.g. Chrome: lock icon → Site settings → Clear data).

---

## Summary

| Check | What to do |
|-------|------------|
| **Pages source** | Settings → Pages → Source: branch **main**, folder **/ (root)**. Save. |
| **New build** | Push a small change (or empty commit) to `main`, wait a few minutes. |
| **Cache** | Private window or clear site data / hard refresh. |

The redirect isn’t “still in the repo”; it’s the **old built site** or **caching**. Fixing the source and forcing a fresh build (plus cache bypass) should resolve it.
