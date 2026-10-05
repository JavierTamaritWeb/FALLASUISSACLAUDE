// robots.txt y llms.txt: guardias de la política de rastreo (v4.43.0).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SITEMAP_FILES, ORIGIN } = require('../../scripts/seo-artifacts.cjs');

const root = path.resolve(__dirname, '../..');
const robots = fs.readFileSync(path.join(root, 'src/robots.txt'), 'utf8');
const llms = fs.readFileSync(path.join(root, 'src/llms.txt'), 'utf8');

const KNOWN = new Set(['user-agent', 'allow', 'disallow', 'sitemap', 'content-signal']);
const BOTS_IA = ['Googlebot', 'Google-Extended', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended', 'DuckDuckBot', 'DuckAssistBot', 'CCBot', 'Amazonbot', 'meta-externalagent', 'cohere-ai', 'MistralAI-User'];
const BLOQUEADOS = ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'Bytespider'];
const RUTAS_PUBLICAS = ['/css/', '/js/', '/img/', '/data/', '/pdf/', '/seo/', '/va/', '/.well-known/', '/llms.txt', '/sitemap.xml'];
// Páginas publicables que no tienen por qué figurar en el resumen curado (sí en llms-full.txt).
const OPCIONALES_FUERA_DE_LLMS = /^(galeria_\d+|blog-[a-z0-9-]+|autorizacion-imagen(?:-menor)?)\.html$/;

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  const unknown = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) { current = current && current.rules.length ? null : current; continue; }
    const [directive, ...rest] = line.split(':');
    const key = directive.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (!KNOWN.has(key)) { unknown.push(key); continue; }
    if (key === 'sitemap') { sitemaps.push(value); continue; }
    if (key === 'user-agent') {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value);
      continue;
    }
    if (!current) { unknown.push(`${key} sin grupo`); continue; }
    current.rules.push({ directive: key, value });
  }
  return { groups, sitemaps, unknown };
}

const groupFor = (parsed, agent) => parsed.groups.find(group => group.agents.some(a => a.toLowerCase() === agent.toLowerCase()));
const allows = group => group.rules.filter(rule => rule.directive === 'allow').map(rule => rule.value);
const disallows = group => group.rules.filter(rule => rule.directive === 'disallow').map(rule => rule.value);
// Patrón robots → regex: * = cualquier cosa, $ final = fin de URL, el resto es prefijo.
const blocks = (pattern, route) => {
  if (pattern === '') return false;
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern).split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(route);
};

test('robots.txt: sintaxis limpia, salto final, sin Crawl-delay y sitemaps publicados', () => {
  const parsed = parseRobots(robots);
  assert.ok(robots.endsWith('\n'), 'termina en salto de línea');
  assert.deepEqual(parsed.unknown, [], 'solo directivas conocidas (Content-Signal se admite a propósito)');
  assert.doesNotMatch(robots, /crawl-delay/i);
  assert.ok(parsed.sitemaps.length >= 1);
  for (const sitemap of parsed.sitemaps) {
    assert.ok(sitemap.startsWith(`${ORIGIN}/`), sitemap);
    assert.ok(SITEMAP_FILES.includes(sitemap.slice(ORIGIN.length + 1)), `${sitemap} lo genera el build`);
  }
  assert.ok(parsed.sitemaps.includes(`${ORIGIN}/sitemap-index.xml`));
  assert.ok(!fs.existsSync(path.join(root, 'src/robots-ai-optimized.txt')), 'robots-ai-optimized.txt se retiró en 4.43.0 (301 en .htaccess)');
});

test('robots.txt: el grupo * permite todo lo público y Content-Signal sigue abierto', () => {
  const parsed = parseRobots(robots);
  const general = groupFor(parsed, '*');
  assert.ok(general, 'existe User-agent: *');
  assert.ok(allows(general).includes('/'));
  for (const route of RUTAS_PUBLICAS) for (const pattern of disallows(general)) assert.ok(!blocks(pattern, route), `${pattern} bloquearía ${route}`);
  assert.ok(disallows(general).includes('/mantenimiento.html'));
  const signal = general.rules.find(rule => rule.directive === 'content-signal');
  assert.equal(signal && signal.value, 'search=yes, ai-train=yes, ai-input=yes');
});

test('robots.txt: los rastreadores de IA están permitidos y los scrapers SEO bloqueados', () => {
  const parsed = parseRobots(robots);
  for (const bot of BOTS_IA) {
    const group = groupFor(parsed, bot);
    assert.ok(group, `${bot} tiene grupo propio`);
    assert.ok(allows(group).includes('/'), `${bot} Allow: /`);
    assert.deepEqual(disallows(group), [], `${bot} sin Disallow`);
  }
  for (const bot of BLOQUEADOS) {
    const group = groupFor(parsed, bot);
    assert.ok(group, `${bot} tiene grupo propio`);
    assert.ok(disallows(group).includes('/'), `${bot} Disallow: /`);
  }
});

test('llms.txt: formato llmstxt.org, enlaces que existen y toda página publicable cubierta', () => {
  const lines = llms.split('\n');
  assert.match(lines[0], /^# Falla Suïssa - L'Alqueria del Favero$/);
  assert.equal(lines[1], '');
  assert.match(lines[2], /^> .{80,}/, 'blockquote de resumen en la línea 3');
  assert.ok(llms.endsWith('\n'));
  const generados = new Set(['llms-full.txt', ...SITEMAP_FILES, 'seo/ai-enhanced-schema.json', '.well-known/agent-skills/index.json']);
  const urls = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(match => match[1]);
  assert.ok(urls.length >= 20);
  for (const url of urls) {
    assert.ok(url.startsWith(`${ORIGIN}/`), url);
    const relative = url.slice(ORIGIN.length + 1).replace(/^va\//, '').replace(/#.*$/, '') || 'index.html';
    assert.ok(generados.has(relative) || fs.existsSync(path.join(root, 'src', relative)), `${url} no existe en src/ ni lo genera el build`);
  }
  const publicables = fs.readdirSync(path.join(root, 'src')).filter(file => /\.html$/.test(file) && !/^(google.*|ai-info|base|mantenimiento)\.html$/.test(file));
  const enLlms = new Set(urls.map(url => url.slice(ORIGIN.length + 1).replace(/^va\//, '').replace(/#.*$/, '') || 'index.html'));
  for (const file of publicables) {
    if (OPCIONALES_FUERA_DE_LLMS.test(file)) continue;
    assert.ok(enLlms.has(file), `${file} falta en src/llms.txt (o declárala opcional en el test)`);
  }
});
