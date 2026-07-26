#!/usr/bin/env node
// Galaxy Explorer — static-site validator.
//
// Dependency-free CI check (Node built-ins only) that catches the mistakes most
// likely to break this single-file WebGL site before it ships to GitHub Pages:
//
//   1. JS syntax   — every vendored script and the big inline <script> in
//                    index.html must parse.
//   2. Assets      — every locally-referenced image/audio/vendor file must
//                    actually exist on disk (a typo'd path is invisible until
//                    the browser 404s).
//   3. HTML sanity — doctype present, a <title>, and balanced <script> tags.
//
// Run it locally the same way CI does:  node .github/scripts/validate.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..'); // .github/scripts -> repo root
const rel = (p) => path.relative(root, p) || '.';

const errors = [];
const notes = [];
const fail = (msg) => errors.push(msg);
const note = (msg) => notes.push(msg);

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

// Pull the body of every inline <script> (i.e. one without a src attribute).
function inlineScripts(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// --- 1. JavaScript syntax --------------------------------------------------
// vm.Script compiles (parses) the source without executing it, so undefined
// browser globals like THREE or window are irrelevant — only syntax matters.
function checkJsSyntax(html) {
  let checked = 0;
  const compile = (code, label) => {
    checked++;
    try {
      new vm.Script(code, { filename: label });
    } catch (e) {
      fail(`JS syntax error in ${label}: ${e.message}`);
    }
  };

  for (const f of fs.readdirSync(path.join(root, 'vendor')).sort()) {
    if (f.endsWith('.js')) compile(read(`vendor/${f}`), `vendor/${f}`);
  }
  inlineScripts(html).forEach((code, i) => compile(code, `index.html <script #${i}>`));

  note(`JS syntax: ${checked} script(s) parsed`);
}

// --- 2. Asset integrity ----------------------------------------------------
const ASSET_EXT = 'jpg|jpeg|png|webp|gif|svg|mp3|ogg|m4a|js|css|json';

// Literal, fully-qualified local paths in index.html (dynamic path prefixes
// built by string concatenation don't end in an extension, so they're skipped).
function checkHtmlAssets(html) {
  const re = new RegExp(
    `['"]((?:images|audio|vendor|docs)/[^'"]+?\\.(?:${ASSET_EXT}))['"]`,
    'gi'
  );
  const seen = new Set();
  let m;
  while ((m = re.exec(html))) seen.add(m[1]);
  let missing = 0;
  for (const p of [...seen].sort()) {
    if (!exists(p)) {
      fail(`index.html references missing asset: ${p}`);
      missing++;
    }
  }
  note(`Assets (index.html): ${seen.size} literal reference(s), ${missing} missing`);
}

// Relative asset references inside markdown docs — markdown ](path) and inline
// html src="path". External URLs, anchors and absolute paths are ignored.
function checkMarkdownAssets() {
  const mdFiles = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const child = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) walk(child);
      else if (e.name.toLowerCase().endsWith('.md')) mdFiles.push(child);
    }
  };
  walk('');

  const re = /\]\(([^)\s]+)(?:\s[^)]*)?\)|src="([^"]+)"/gi;
  const extRe = new RegExp(`\\.(?:${ASSET_EXT})$`, 'i');
  let checked = 0;
  let missing = 0;
  for (const md of mdFiles) {
    const txt = read(md);
    let m;
    while ((m = re.exec(txt))) {
      let p = (m[1] || m[2] || '').trim().replace(/^<|>$/g, '');
      if (!p || /^(https?:|mailto:|data:|#|\/)/i.test(p)) continue;
      if (!extRe.test(p)) continue;
      checked++;
      const resolved = path.normalize(path.join(path.dirname(md), p));
      if (!exists(resolved)) {
        fail(`${md} references missing asset: ${p}`);
        missing++;
      }
    }
  }
  note(`Assets (markdown): ${checked} relative reference(s), ${missing} missing`);
}

// --- 3. HTML sanity --------------------------------------------------------
function checkHtml(html) {
  if (!/<!doctype html>/i.test(html)) fail('index.html: missing <!doctype html>');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail('index.html: missing non-empty <title>');

  const open = (html.match(/<script\b/gi) || []).length;
  const close = (html.match(/<\/script>/gi) || []).length;
  if (open !== close) {
    fail(`index.html: unbalanced <script> tags (${open} open vs ${close} close)`);
  }
  note(`HTML: doctype/title OK, ${open} <script> tag(s) balanced`);
}

// --- run -------------------------------------------------------------------
const html = read('index.html');
checkJsSyntax(html);
checkHtmlAssets(html);
checkMarkdownAssets();
checkHtml(html);

for (const n of notes) console.log(`  ✓ ${n}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) found:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n✓ All checks passed.');
