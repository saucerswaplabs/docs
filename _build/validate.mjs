#!/usr/bin/env node
// Adversarial validator for the SaucerSwap docs overhaul worktree.
// Prints failures grouped by check; exit code 1 if any failure.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

// ---------- helpers ----------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const allFiles = walk(ROOT);
const mdxFiles = allFiles.filter((f) => f.endsWith('.mdx'));
const rel = (f) => path.relative(ROOT, f);

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: null, body: src, fmLines: 0 };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      let v = kv[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      fm[kv[1]] = v;
    }
  }
  return { fm, body: src.slice(m[0].length), fmLines: m[0].split('\n').length - 1 };
}

// ---------- (a) docs.json ----------
let docs;
try {
  docs = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'));
} catch (e) {
  fail('a:docs.json', `docs.json does not parse: ${e.message}`);
}

const navPages = [];
(function collect(node) {
  if (node == null) return;
  if (typeof node === 'string') { navPages.push(node); return; }
  if (Array.isArray(node)) { node.forEach(collect); return; }
  if (typeof node === 'object') {
    for (const k of ['pages', 'groups', 'tabs', 'anchors', 'navigation']) if (node[k]) collect(node[k]);
  }
})(docs?.navigation);

for (const p of navPages) {
  if (/^https?:/.test(p)) continue;
  const f = path.join(ROOT, p + '.mdx');
  if (!fs.existsSync(f)) fail('a:nav', `nav page "${p}" has no matching ${p}.mdx`);
}

// __REST placeholders anywhere
for (const f of allFiles) {
  if (/\.(mdx|md|json|yml|yaml|mjs|js|css)$/.test(f) && !f.includes('_build/validate.mjs')) {
    const src = fs.readFileSync(f, 'utf8');
    if (src.includes('__REST')) fail('a:placeholder', `${rel(f)} contains __REST placeholder`);
  }
}

// redirects well-formed
const redirects = docs?.redirects || [];
const redirectSources = [];
const redirectDests = [];
redirects.forEach((r, i) => {
  if (typeof r !== 'object' || typeof r.source !== 'string' || typeof r.destination !== 'string') {
    fail('a:redirects', `redirect[${i}] malformed: ${JSON.stringify(r)}`);
    return;
  }
  if (!r.source.startsWith('/')) fail('a:redirects', `redirect[${i}] source not root-relative: ${r.source}`);
  if (!r.destination.startsWith('/') && !/^https?:\/\//.test(r.destination))
    fail('a:redirects', `redirect[${i}] destination neither root-relative nor absolute URL: ${r.destination}`);
  const extra = Object.keys(r).filter((k) => !['source', 'destination', 'permanent'].includes(k));
  if (extra.length) fail('a:redirects', `redirect[${i}] unknown keys: ${extra.join(',')}`);
  redirectSources.push(r.source);
  redirectDests.push(r.destination);
});
// internal redirect destinations must resolve to a page (no :slug in destination unless source has one)
const pageSet = new Set(mdxFiles.map((f) => '/' + rel(f).replace(/\.mdx$/, '')));
pageSet.add('/'); // index.mdx
pageSet.add('/index');
for (const r of redirects) {
  if (typeof r?.destination !== 'string' || !r.destination.startsWith('/')) continue;
  if (r.destination.includes(':')) continue; // pattern destination, validated by pattern source
  if (!pageSet.has(r.destination.replace(/#.*$/, ''))) fail('a:redirects', `redirect destination "${r.destination}" (from ${r.source}) is not an existing page`);
}

function matchesRedirectSource(link) {
  for (const s of redirectSources) {
    if (!s.includes(':')) { if (s === link) return true; continue; }
    const re = new RegExp('^' + s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)\*/g, '.*').replace(/:(\w+)/g, '[^/]+') + '$');
    if (re.test(link)) return true;
  }
  return false;
}

// ---------- (b) frontmatter ----------
const emojiRe = /\p{Extended_Pictographic}/u;
for (const f of mdxFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const { fm } = parseFrontmatter(src);
  const r = rel(f);
  if (r.startsWith('snippets/')) continue; // snippets are includes, not pages
  if (!fm) { fail('b:frontmatter', `${r}: no frontmatter block`); continue; }
  if (!fm.title || !fm.title.trim()) fail('b:frontmatter', `${r}: empty/missing title`);
  if (fm.title && emojiRe.test(fm.title)) fail('b:frontmatter', `${r}: emoji in title "${fm.title}"`);
  const d = fm.description || '';
  if (!d.trim()) fail('b:frontmatter', `${r}: missing description`);
  else {
    if (d.length < 80 || d.length > 200) fail('b:frontmatter', `${r}: description length ${d.length} (want 80-200): "${d.slice(0, 60)}..."`);
    if (/^last modified/i.test(d.trim())) fail('b:frontmatter', `${r}: description starts with "Last modified"`);
  }
}

// ---------- (c) images ----------
const imageRefs = new Map(); // resolved abs path -> [where]
const refRe = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(?:src|img|icon)\s*=\s*["']([^"']+)["']|(?:src|img)\s*=\s*\{\s*["']([^"']+)["']\s*\}|\]\((\/[^)\s]+\.(?:png|jpe?g|gif|svg|webp|avif|pdf|zip|csv))\)/gi;
for (const f of [...mdxFiles, path.join(ROOT, 'docs.json')]) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = refRe.exec(src)) !== null) {
    const raw = (m[1] || m[2] || m[3] || m[4] || '').split('#')[0].split('?')[0];
    if (!raw || /^(https?:|data:|mailto:)/.test(raw)) continue;
    const abs = raw.startsWith('/') ? path.join(ROOT, raw) : path.resolve(path.dirname(f), raw);
    const line = src.slice(0, m.index).split('\n').length;
    if (!imageRefs.has(abs)) imageRefs.set(abs, []);
    imageRefs.get(abs).push(`${rel(f)}:${line}`);
  }
}
// docs.json logo/favicon/background refs too
for (const v of JSON.stringify(docs || {}).matchAll(/"(\/(?:images|logo|fonts)\/[^"]+|\/favicon\.\w+)"/g)) {
  const abs = path.join(ROOT, v[1]);
  if (!imageRefs.has(abs)) imageRefs.set(abs, []);
  imageRefs.get(abs).push('docs.json');
}
const assetExt = /\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?)$/i;
for (const [abs, where] of imageRefs) {
  if (!assetExt.test(abs)) continue;
  if (!fs.existsSync(abs)) fail('c:image-missing', `${path.relative(ROOT, abs)} referenced at ${where.join(', ')} does not exist`);
}
// orphans in images/
const imagesDir = path.join(ROOT, 'images');
if (fs.existsSync(imagesDir)) {
  for (const f of walk(imagesDir)) {
    if (!imageRefs.has(f)) fail('c:image-orphan', `images/ orphan (never referenced): ${rel(f)}`);
  }
}

// ---------- (d) internal links ----------
const linkRe = /\]\((\/[^)\s#?]*)[^)]*\)|href\s*=\s*["'](\/[^"'#?]*)[^"']*["']/g;
for (const f of mdxFiles) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = linkRe.exec(src)) !== null) {
    const raw = m[1] || m[2];
    if (!raw) continue;
    const link = raw.replace(/\/$/, '') || '/';
    if (assetExt.test(link)) continue; // image refs handled in (c)
    if (link.endsWith('.pdf') || link.endsWith('.csv')) {
      if (!fs.existsSync(path.join(ROOT, link))) {
        const line = src.slice(0, m.index).split('\n').length;
        fail('d:link', `${rel(f)}:${line} dead file link ${link}`);
      }
      continue;
    }
    if (pageSet.has(link) || matchesRedirectSource(link) || redirectDests.includes(link)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    fail('d:link', `${rel(f)}:${line} dead internal link ${link}`);
  }
}

// ---------- (e) banned strings, second H1, untagged fences ----------
const banned = ['gitbook-x-prod', '1058806683-files.gitbook.io', '875e1017', 'external-link-', '/v/developer', 'developerx'];
for (const f of allFiles) {
  const r = rel(f);
  if (r.startsWith('_build/')) continue;
  if (!/\.(mdx|md|json|yml|yaml|css|js|mjs)$/.test(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  for (const b of banned) {
    lines.forEach((ln, i) => {
      if (!ln.includes(b)) return;
      if (r === 'docs.json' && (b === '/v/developer' || b === 'developerx' || b === 'external-link-')) return; // allowed inside redirects
      fail('e:banned', `${r}:${i + 1} contains "${b}"`);
    });
  }
  if (f.endsWith('.mdx')) {
    const { body, fmLines } = parseFrontmatter(src);
    const bodyLines = body.split('\n');
    let inFence = false, fenceTicks = 0, h1s = 0, untagged = 0;
    const untaggedAt = [];
    bodyLines.forEach((ln, i) => {
      const fm2 = ln.match(/^\s*(`{3,}|~{3,})(.*)$/);
      if (fm2) {
        const ticks = fm2[1].length;
        if (!inFence) {
          inFence = true; fenceTicks = ticks;
          if (!fm2[2].trim()) { untagged++; untaggedAt.push(fmLines + i + 1); }
        } else if (ticks >= fenceTicks && !fm2[2].trim()) {
          inFence = false;
        }
        return;
      }
      if (inFence) return;
      if (/^# /.test(ln)) { h1s++; if (h1s >= 1) fail('e:h1', `${r}:${fmLines + i + 1} H1 in body (title comes from frontmatter): "${ln.slice(0, 60)}"`); }
    });
    if (untagged) fail('e:fence', `${r}: ${untagged} untagged code fence(s) at line(s) ${untaggedAt.join(', ')}`);
  }
}

// ---------- (f) legacy trees deleted ----------
const mustBeGone = [
  'v', 'developerx', 'essentials', 'archive',
  'home.mdx', 'introduction.mdx', 'quickstart.mdx', 'development.mdx',
  'external-link-0.mdx', 'external-link-1.mdx', 'external-link-2.mdx', 'external-link-3.mdx',
  'snippets/snippet-intro.mdx',
  'api-reference/introduction.mdx', 'api-reference/endpoint', 'api-reference/openapi.json',
  'contributors/galactic-pioneers.mdx',
  'get-started/hedera-guide.mdx', 'get-started/hedera-guide',
  'get-started/saucerswap-tutorials.mdx', 'get-started/saucerswap-tutorials',
];
for (const p of mustBeGone) {
  if (fs.existsSync(path.join(ROOT, p))) fail('f:legacy', `legacy path still present: ${p}`);
}

// ---------- report ----------
if (failures.length === 0) {
  console.log('CLEAN: all checks passed.');
  console.log(`Pages: ${mdxFiles.length} mdx, nav entries: ${navPages.length}, redirects: ${redirects.length}, image refs: ${imageRefs.size}`);
} else {
  console.log(`FAILURES: ${failures.length}`);
  for (const f of failures) console.log('  ' + f);
  process.exitCode = 1;
}
