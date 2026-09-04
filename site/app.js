(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Pure rendering. Shared by the build step (Node) and the live page,
     so the served markup and any version the page republishes are
     produced by exactly the same code.
  ------------------------------------------------------------------ */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    var v = String(u == null ? '' : u).trim();
    if (!v || v === '#') return '';
    return /^(https?:\/\/|mailto:)/i.test(v) ? v : '';
  }

  function normalizeUrl(u) {
    var v = String(u == null ? '' : u).trim();
    if (!v || v === '#') return '';
    if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
    if (v.indexOf('@') > 0 && v.indexOf('/') === -1 && v.indexOf(' ') === -1) return 'mailto:' + v;
    return 'https://' + v.replace(/^\/+/, '');
  }

  function renderRow(link) {
    var url = safeUrl(link.url);
    var channel = esc(link.channel || 'Link');
    var title = esc(link.title || '');

    if (!url) {
      return '<div class="row row--unset">' +
        '<span class="row-ch">' + channel + '</span>' +
        '<span class="row-title">' + (title || '&mdash;') + '</span>' +
        '<span class="chip">Not set</span>' +
        '</div>';
    }

    return '<a class="row" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="row-ch">' + channel + '</span>' +
      '<span class="row-title">' + (title || esc(url)) + '</span>' +
      '<span class="row-go" aria-hidden="true">&rarr;</span>' +
      '</a>';
  }

  function renderApp(state) {
    var links = Array.isArray(state.links) ? state.links : [];
    var live = links.filter(function (l) { return !!safeUrl(l.url); }).length;
    var blank = links.length - live;

    var lights = '';
    for (var i = 0; i < 5; i++) lights += '<i></i>';

    var rows = links.map(renderRow).join('');

    var foot = 'Last updated <b>' + esc(state.updated || '') + '</b> &middot; ' +
      live + (live === 1 ? ' link live' : ' links live');
    if (blank > 0) {
      foot += '<br>' + blank + (blank === 1 ? ' slot still empty' : ' slots still empty');
    }

    return '<div class="wrap">' +
      '<div class="bar"><button class="btn" id="editBtn" hidden>Edit page</button></div>' +
      '<header class="hero">' +
        '<div class="lights" aria-hidden="true">' + lights + '</div>' +
        '<p class="eyebrow">' + esc(state.eyebrow || '') + '</p>' +
        '<h1 class="name">' + esc(state.name || '') + '</h1>' +
        '<p class="tagline">' + esc(state.tagline || '') + '</p>' +
      '</header>' +
      '<nav class="board" aria-label="Links">' + rows + '</nav>' +
      '<p class="foot">' + foot + '</p>' +
      '</div>';
  }

  /* Build step stops here. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderApp: renderApp, normalizeUrl: normalizeUrl };
    return;
  }

  /* ------------------------------------------------------------------
     Live page
  ------------------------------------------------------------------ */

  var CLOSE = '<' + '/script>';
  var app = document.getElementById('app');
  var state = JSON.parse(document.getElementById('state').textContent);
  var api = null;
  var writable = false;
  var editing = false;

  function field(key, label, value) {
    return '<label class="ed-field">' +
      '<span class="ed-label">' + esc(label) + '</span>' +
      '<input class="inp" id="f-' + key + '" value="' + esc(value || '') + '">' +
      '</label>';
  }

  function editRow(link, i) {
    return '<div class="ed-row" data-i="' + i + '">' +
      '<input class="inp" data-k="channel" aria-label="Channel" placeholder="Channel" value="' + esc(link.channel || '') + '">' +
      '<input class="inp" data-k="title" aria-label="Label" placeholder="Label" value="' + esc(link.title || '') + '">' +
      '<input class="inp" data-k="url" aria-label="Address" placeholder="https://" value="' + esc(link.url || '') + '">' +
      '<button class="btn btn--quiet" data-del="' + i + '" aria-label="Remove this link">&times;</button>' +
      '</div>';
  }

  function renderEditor(s) {
    var links = Array.isArray(s.links) ? s.links : [];
    return '<div class="wrap"><div class="editor">' +
      '<p class="ed-head">Editing &mdash; nothing changes for anyone until you publish</p>' +
      field('eyebrow', 'Eyebrow', s.eyebrow) +
      field('name', 'Name', s.name) +
      field('tagline', 'Tagline', s.tagline) +
      '<div class="ed-links" id="edLinks">' + links.map(editRow).join('') + '</div>' +
      '<div class="ed-actions">' +
        '<span class="ed-msg" id="edMsg"></span>' +
        '<button class="btn" id="edAdd">Add link</button>' +
        '<button class="btn" id="edCancel">Cancel</button>' +
        '<button class="btn btn--go" id="edSave">Publish</button>' +
      '</div>' +
      '</div></div>';
  }

  function paint() {
    app.innerHTML = editing ? renderEditor(state) : renderApp(state);
    var btn = document.getElementById('editBtn');
    if (btn) btn.hidden = !writable;
  }

  function value(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function collect() {
    var next = {
      eyebrow: value('f-eyebrow'),
      name: value('f-name'),
      tagline: value('f-tagline'),
      updated: state.updated,
      links: []
    };
    var rows = document.querySelectorAll('#edLinks .ed-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var read = function (k) {
        var el = row.querySelector('[data-k="' + k + '"]');
        return el ? el.value.trim() : '';
      };
      next.links.push({
        channel: read('channel'),
        title: read('title'),
        url: normalizeUrl(read('url'))
      });
    }
    return next;
  }

  function message(text, tone) {
    var el = document.getElementById('edMsg');
    if (!el) return;
    el.textContent = text;
    if (tone) el.setAttribute('data-tone', tone);
    else el.removeAttribute('data-tone');
  }

  function buildDoc(s) {
    var css = document.getElementById('sheet').textContent;
    var boot = document.getElementById('boot').textContent;
    var fonts = document.getElementById('fonts').getAttribute('href');
    var json = JSON.stringify(s).replace(/</g, '\\u003c');

    return '<!doctype html>\n<html lang="en">\n<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Fast Life Glory</title>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link id="fonts" rel="stylesheet" href="' + esc(fonts) + '">\n' +
      '<style id="sheet">' + css + '</style>\n' +
      '</head>\n<body>\n' +
      '<div id="app">' + renderApp(s) + '</div>\n' +
      '<script type="application/json" id="state">' + json + CLOSE + '\n' +
      '<script id="boot">' + boot + CLOSE + '\n' +
      '</body>\n</html>\n';
  }

  function readOnly() {
    writable = false;
    editing = false;
    paint();
  }

  function publish(button) {
    var next = collect();
    next.updated = new Date().toISOString().slice(0, 10);
    state = next;

    if (!api) {
      message('This view cannot publish changes.', 'bad');
      return;
    }

    button.disabled = true;
    message('Publishing...');

    api.publish(buildDoc(next)).then(function () {
      message('Published. Reloading...');
    }).catch(function (err) {
      var code = err && err.code;
      button.disabled = false;

      if (code === 'conflict') {
        message('A newer version arrived first. Reloading to it.');
        return;
      }
      if (code === 'not_writer' || code === 'not_granted' || code === 'not_declared' ||
          code === 'consent_required' || code === 'capability_disabled' || code === 'capability_removed') {
        readOnly();
        return;
      }
      if (code === 'rate_limited') {
        message('Publishing too fast. Wait a moment, then publish again.', 'bad');
        return;
      }
      if (code === 'too_large') {
        message('There is too much content to publish. Shorten it and retry.', 'bad');
        return;
      }
      message('Publishing failed. Your edits are still here - try again.', 'bad');
    });
  }

  app.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('button') : null;
    if (!button) return;

    if (button.id === 'editBtn') { editing = true; paint(); return; }
    if (button.id === 'edCancel') { editing = false; paint(); return; }
    if (button.id === 'edAdd') {
      state = collect();
      state.links.push({ channel: 'Link', title: '', url: '' });
      paint();
      return;
    }
    if (button.hasAttribute('data-del')) {
      state = collect();
      state.links.splice(Number(button.getAttribute('data-del')), 1);
      paint();
      return;
    }
    if (button.id === 'edSave') { publish(button); }
  });

  if (window.claude && typeof window.claude.use === 'function') {
    Promise.resolve(window.claude.use('artifact')).then(function (ns) {
      api = ns || null;
      writable = !!ns;
      var btn = document.getElementById('editBtn');
      if (btn) btn.hidden = !writable;
    }).catch(function () { /* stays read-only */ });
  }
})();
