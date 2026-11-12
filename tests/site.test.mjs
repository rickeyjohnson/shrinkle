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

test('link-preview image exists, matches twitter:image and is under 300 KB', () => {
  const og = meta('property', 'og:image'), tw = meta('name', 'twitter:image');
  assert.ok(og, 'og:image tag missing');
  assert.equal(tw, og);
  const file = new URL(og).pathname.slice(1);
  assert.ok(existsSync(root(file)), `${file} missing`);
  assert.ok(statSync(root(file)).size < 300 * 1024, `${file} is ${statSync(root(file)).size} bytes`);
});
