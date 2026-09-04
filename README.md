# Fast Life Glory

A one-page link hub, published as a Claude Artifact:
https://claude.ai/code/artifact/3b0baf66-8b0b-47c2-9be1-a4e011369b0e

The page edits itself. "Edit page" appears for anyone with write access to the
artifact; changing the name, tagline or links and hitting **Publish** republishes
the page as a new version, and every open view reloads to it. No dashboard, no
deploy step.

## Layout

| File | Role |
| --- | --- |
| `site/state.json` | Seed content: eyebrow, name, tagline, links |
| `site/styles.css` | All styling, tokenised for light/dark/system |
| `site/app.js` | `renderApp()` plus the live page's editor and publish path |
| `site/build.js` | Renders `site/index.html` from the three files above |
| `site/index.html` | Generated — the fragment the Artifact host wraps |
| `index.html` | Generated — standalone page, served by GitHub Pages |

## Publishing to everyone

The Artifact copy is shared by link, but that share is pinned to a version:
publishing a new one does not move the pin, so viewers keep seeing the old
page. GitHub Pages has no such pin — it serves whatever is on the default
branch. Two one-time settings changes turn it on:

1. **Settings → General → Danger Zone → Change visibility → Public.**
   Pages on a private repo needs a paid GitHub plan.
2. **Settings → Pages → Source: Deploy from a branch**, branch
   `claude/instant-website-deployment-a3zjdu`, folder `/ (root)`.

The site is then live at `https://fastlifeglory.github.io/glory/` and
redeploys on every push — nothing to re-share.

Off the Artifact host `window.claude` does not exist, so `claude.use()` never
resolves and the in-page editor stays hidden. The Pages copy is static; content
changes go through `state.json` and a rebuild.

## Building

```sh
node site/build.js
```

`renderApp()` is shared by the build step and the live page. The page rebuilds
its replacement document by reading its own `<style>` and `<script>` text nodes
back out of the served markup and re-rendering the body from state, so the
committed source and any version the page publishes for itself cannot drift.

Editing `state.json` and rebuilding is the other way in — useful for a change
that is easier to make in a file than in the browser.
