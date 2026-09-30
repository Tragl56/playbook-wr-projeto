// Monta o app a partir de src/ e data/.
//
// Saídas (em dist/):
//   site/                 versão para publicar (Vercel): index.html, style.css, data.js, app1-4.js, sw.js, manifest, ícones
//   playbook-wr.html      versão em arquivo único, legível (usada nos testes e como artefato do Claude)
//   hashes.txt            sha1 de cada arquivo do site (para conferir o que foi publicado)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { minify as terser } from 'terser';
import CleanCSS from 'clean-css';
import { minify as htmlmin } from 'html-minifier-terser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sha1 = (b) => crypto.createHash('sha1').update(b).digest('hex');

const D = JSON.parse(read('data/app-data.json'));
const logo = read('src/assets/logo-mini.svg').trim();
if (logo.includes('\n')) throw new Error('logo-mini.svg precisa ficar em uma linha só (ele entra dentro de uma string JS)');
const css = read('src/css/styles.css');
const tpl = read('src/index.html');

// Fontes JS, na ordem em que são carregadas. Cada grupo vira um arquivo no site.
const GROUPS = [
  ['app1.js', ['src/js/00-core.js']],
  ['app2.js', ['src/js/10-telas-hoje-treino.js']],
  ['app3.js', ['src/js/20-telas-comida-evolucao-perfil.js']],
  ['app4.js', ['src/js/90-acoes.js']],
];
const jsOf = (files) => files.map((f) => read(f).replaceAll('__LOGO__', logo)).join('');

const PWA_HEAD =
  '<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0A1810">' +
  '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">' +
  '<meta name="apple-mobile-web-app-title" content="Playbook WR"><meta name="apple-mobile-web-app-status-bar-style" content="black">' +
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="icon" type="image/svg+xml" href="/icon.svg">';
const SW_REG =
  "<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>";

const out = path.join(ROOT, 'dist');
const site = path.join(out, 'site');
// limpa só o que este script gera (a planilha em dist/ é gerada por outro comando)
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });

// ---------- arquivo único (legível) ----------
const allJs = '"use strict";\n' + GROUPS.map(([, fs_]) => jsOf(fs_)).join('\n');
// Atenção: String.replace interpreta "$&", "$'" etc. na string de troca, e o JS do app tem isso (regex de escape).
// Por isso a troca sempre usa função: () => texto.
const put = (t, marker, text) => t.replace(marker, () => text);
let single = tpl;
single = put(single, '<!--@PWA_HEAD-->\n', '');
single = put(single, '<!--@STYLE-->', `<style>\n${css}\n</style>`);
single = put(single, '<!--@LOGO-->', logo);
single = put(single, '<!--@DATA-->', `<script>\nconst D = ${JSON.stringify(D)};\n</script>`);
single = put(single, '<!--@SCRIPTS-->', `<script>\n${allJs}\n</script>`);
single = put(single, '<!--@SW-->\n', '');
fs.writeFileSync(path.join(out, 'playbook-wr.html'), single);

// ---------- site ----------
const files = {};
for (const [name, srcs] of GROUPS) {
  const r = await terser('"use strict";\n' + jsOf(srcs), { compress: true, mangle: true });
  if (r.error) throw r.error;
  files[name] = r.code;
}
files['style.css'] = new CleanCSS({}).minify(css).styles;
files['data.js'] = 'var D=' + JSON.stringify(D) + ';\n';

let html = tpl;
html = put(html, '<!--@PWA_HEAD-->', PWA_HEAD);
html = put(html, '<!--@STYLE-->', '<link rel="stylesheet" href="/style.css">');
html = put(html, '<!--@LOGO-->', logo);
html = put(html, '<!--@DATA-->', '<script src="/data.js"></script>');
html = put(html, '<!--@SCRIPTS-->', GROUPS.map(([n]) => `<script src="/${n}"></script>`).join(''));
html = put(html, '<!--@SW-->', SW_REG);
files['index.html'] = await htmlmin(html, { collapseWhitespace: true, removeComments: true });

// versão do cache do service worker = hash curto do conteúdo (muda a cada build diferente)
const build = sha1(Object.keys(files).sort().map((k) => files[k]).join('\n')).slice(0, 8);
files['sw.js'] = put(read('public/sw.js'), '__BUILD__', build);

for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(site, name), content);
for (const f of ['icon.svg', 'manifest.webmanifest', 'apple-touch-icon.png']) {
  fs.copyFileSync(path.join(ROOT, 'public', f), path.join(site, f));
}

const lines = fs.readdirSync(site).sort().map((f) => {
  const b = fs.readFileSync(path.join(site, f));
  return `${sha1(b)}  ${String(b.length).padStart(6)}  ${f}`;
});
fs.writeFileSync(path.join(out, 'hashes.txt'), lines.join('\n') + '\n');

console.log('Build pronto (versão ' + build + ')');
console.log(lines.join('\n'));
console.log('\nArquivo único: dist/playbook-wr.html (' + single.length + ' bytes)');
