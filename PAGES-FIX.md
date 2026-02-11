# Why the redirect still happens (and how to fix it)

## If you see "crawlme not found" with Deploy from a branch

**Cause:** The branch being built is **update-spacepotato**, which still has the **crawlme** submodule. The crawlme repo doesn’t exist on GitHub, so the build fails.

**Fix:** Use the **main** branch for deployment.

1. Open **https://github.com/kumarjdas/kumarjdas.github.io/settings/pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. Set **Branch** to **`main`** (not `update-spacepotato`)
4. Set **Folder** to **/ (root)**
5. Click **Save**

**main** has crawlme removed and only the **spacepotato** submodule, so the build will succeed.

---

## What’s going on

- **On GitHub:** The `main` branch has the **correct** `index.html` (portfolio page, no redirect). You can confirm: https://raw.githubusercontent.com/kumarjdas/kumarjdas.github.io/main/index.html
- **Live site:** https://kumarjdas.github.io/ still shows the **old** “Redirecting to Space Potato” page (and the response has `last-modified: Sun, 23 Mar 2025`).

So the repo is fine; the **published site** is an old build from March 2025.

---

## Why the previous fix didn’t work

The most likely reason is: **the GitHub Pages build is failing.**  

When the build fails, GitHub does **not** update the live site. The last **successful** deployment stays live—in your case, the one from March 23, 2025 with the redirect page. So even after:

- Setting Source to **main** and **/ (root)**  
- Pushing new commits  

…the site doesn’t change because **each new build fails** and the old deployment is left in place.

Common causes for Pages builds to fail with this repo:

1. **Submodules** – The repo has `spacepotato` and `crawlme` as submodules. If the build can’t clone them (e.g. URL, permissions, or nested submodule issues), the build fails. See [GitHub: Using submodules with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-submodules-with-github-pages) and [Failed to publish static site with submodules](https://github.com/orgs/community/discussions/23615).
2. **Wrong branch as source** – If the source was (or still is) **update-spacepotato** or another branch that has the old redirect, the live site will keep showing it.
3. **Local commits not pushed** – Your local `main` can be ahead of `origin/main`. If the fix commits were never pushed, GitHub never built them. Run `git status` and `git push origin main` to be sure.

---

## Step 1: See whether the build is failing

1. Open: **https://github.com/kumarjdas/kumarjdas.github.io**
2. Check the **Environments** or **Deployments** (or the **Actions** tab for “Pages” / “pages build and deployment”).
3. See if the latest run for your site is **Failed** (red) or **Success** (green).

- If the latest run is **Failed**, open it and read the **build log**. The error (e.g. submodule clone failed) is why the site isn’t updating.
- If you don’t see any recent runs, the source might be wrong (e.g. branch or folder).

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

---

## If the build keeps failing (e.g. submodules)

If the default “Deploy from a branch” build fails (often due to submodules), you can deploy with **GitHub Actions** instead so you control the build and see logs:

1. In repo **Settings → Pages**, set **Source** to **“GitHub Actions”** (instead of “Deploy from a branch”) and save.
2. Add the workflow file below. It checks out the repo with submodules and deploys the root (your `index.html` plus the submodule folders).

Create the file **`.github/workflows/pages.yml`** in the repo:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. Commit and push to `main`. The Actions tab will show the run; if it fails, the log will show the real error.
4. After a successful run, the live site should update (give it a minute, then hard refresh or use a private window).

---

## Fix applied: "repository not found" for crawlme

The build was failing with:
- `clone of 'https://github.com/kumarjdas/crawlme.git' into submodule path '.../crawlme' failed`
- `repository 'https://github.com/kumarjdas/crawlme.git/' not found`

That means the **crawlme** repo does not exist at that URL (or it is private and the build can’t access it). The Pages build only has access to public repos.

**What was changed:**
- **crawlme** was removed as a submodule from this repo (so the build no longer tries to clone it).
- **.gitmodules** now only lists **spacepotato**.
- The portfolio **Crawlme** card link was updated from `crawlme/` to **https://github.com/kumarjdas/crawlme** (“View on GitHub”) so it works even when the submodule isn’t deployed.

**If you create the crawlme repo later:** Create `https://github.com/kumarjdas/crawlme`, push your crawlme code, then you can add it back as a submodule (`git submodule add https://github.com/kumarjdas/crawlme.git crawlme`) and change the portfolio link back to `crawlme/` if you want it on the site.
