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
| `site/index.html` | Generated — this is what gets published |

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
