// Site/deploy checks: what Vercel serves at "/" and the size of the link-preview image.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const html = readFileSync(root('shrinkle.html'), 'utf8');
const meta = (attr, name) => (html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`)) || [])[1];

test('Vercel serves the game (not the GitHub Pages redirect) at /', () => {
  assert.ok(existsSync(root('.vercelignore')), '.vercelignore missing');
  const ignored = readFileSync(root('.vercelignore'), 'utf8').split('\n').map((s) => s.trim());
  assert.ok(ignored.includes('index.html'), 'index.html must be ignored on Vercel so the rewrite applies');
  const v = JSON.parse(readFileSync(root('vercel.json'), 'utf8'));
  assert.deepEqual(v.rewrites, [{ source: '/', destination: '/shrinkle.html' }]);
});

test('the address bar never shows /shrinkle.html on Vercel (it redirects to /)', () => {
  const v = JSON.parse(readFileSync(root('vercel.json'), 'utf8'));
  assert.deepEqual(v.redirects, [{ source: '/shrinkle.html', destination: '/', permanent: false }]);
});

// shrinkle.vercel.app belongs to an unrelated game; previews and share text must point at our own domain.
const SITE = 'https://shrinkle.lol/';
test('link tags in both pages point at shrinkle.lol, never shrinkle.vercel.app', () => {
  for (const page of ['shrinkle.html', 'index.html']) {
    const src = readFileSync(root(page), 'utf8');
    const get = (attr, name) => (src.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`)) || [])[1];
    assert.equal(get('property', 'og:url'), SITE, `${page} og:url`);
    assert.equal(get('property', 'og:image'), SITE + 'og.jpg', `${page} og:image`);
    assert.equal(get('name', 'twitter:image'), SITE + 'og.jpg', `${page} twitter:image`);
    assert.ok(!src.includes('shrinkle.vercel.app'), `${page} still mentions shrinkle.vercel.app`);
  }
  assert.ok(!readFileSync(root('README.md'), 'utf8').includes('shrinkle.vercel.app'), 'README still links shrinkle.vercel.app');
});

test('link-preview image exists, matches twitter:image and is under 300 KB', () => {
  const og = meta('property', 'og:image'), tw = meta('name', 'twitter:image');
  assert.ok(og, 'og:image tag missing');
  assert.equal(tw, og);
  const file = new URL(og).pathname.slice(1);
  assert.ok(existsSync(root(file)), `${file} missing`);
  assert.ok(statSync(root(file)).size < 300 * 1024, `${file} is ${statSync(root(file)).size} bytes`);
});
