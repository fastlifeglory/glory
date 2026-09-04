/*
 * Renders site/index.html from state.json + styles.css + app.js.
 *
 * The published page can republish itself: it reads its own <style> and
 * <script> text nodes back out of the served document and re-renders the
 * markup from state with the same renderApp() used here, so the two paths
 * can never drift.
 *
 *   node site/build.js
 */
const fs = require('fs');
const path = require('path');
const { renderApp } = require('./app.js');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

const FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Big+Shoulders+Display:wght@600;800' +
  '&family=Instrument+Sans:wght@400;500;600' +
  '&family=JetBrains+Mono:wght@400;500' +
  '&display=swap';

const state = JSON.parse(read('state.json'));
const close = '<' + '/script>';

const head = [
  '<title>Fast Life Glory</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link id="fonts" rel="stylesheet" href="' + FONTS.replace(/&/g, '&amp;') + '">',
  '<style id="sheet">' + read('styles.css') + '</style>'
].join('\n');

const body = [
  '<div id="app">' + renderApp(state) + '</div>',
  '<script type="application/json" id="state">' +
    JSON.stringify(state).replace(/</g, '\\u003c') + close,
  '<script id="boot">' + read('app.js') + close,
  ''
].join('\n');

/* The Artifact host wraps the file in its own <html>/<head>/<body>, so it
   takes the bare fragment. */
const fragment = head + '\n' + body;
fs.writeFileSync(path.join(dir, 'index.html'), fragment);
console.log('wrote site/index.html   (fragment, ' + fragment.length + ' bytes)');

/* GitHub Pages serves the file as-is, so it needs a whole document. The
   editor hides itself there: window.claude does not exist off the Artifact
   host, so claude.use() never resolves and the page stays static. */
const page = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="description" content="Links for Glory.">',
  head,
  '</head>',
  '<body>',
  body + '</body>',
  '</html>',
  ''
].join('\n');
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), page);
console.log('wrote index.html        (standalone, ' + page.length + ' bytes)');
