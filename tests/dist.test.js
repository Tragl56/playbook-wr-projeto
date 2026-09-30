// Confere se o build gerou um site consistente (arquivos existem, JS válido, dados iguais aos de data/).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const SITE = path.join(__dirname, '..', 'dist', 'site');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const rd = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');

const need = ['index.html', 'style.css', 'data.js', 'app1.js', 'app2.js', 'app3.js', 'app4.js', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png'];
const missing = need.filter((f) => !fs.existsSync(path.join(SITE, f)));
ok(missing.length === 0, 'todos os arquivos do site existem' + (missing.length ? ' (faltam: ' + missing.join(', ') + ')' : ''));

for (const f of ['data.js', 'app1.js', 'app2.js', 'app3.js', 'app4.js', 'sw.js']) {
  let good = true;
  try { new vm.Script(rd(f), { filename: f }); } catch (e) { good = false; console.log('   ' + f + ': ' + e.message); }
  ok(good, f + ' tem sintaxe válida');
}

const html = rd('index.html');
const refs = [...html.matchAll(/(?:src|href)="\/([^"#?]+)"/g)].map((m) => m[1]).filter((r) => !r.startsWith('http'));
const dangling = refs.filter((r) => !fs.existsSync(path.join(SITE, r)));
ok(refs.length > 5 && dangling.length === 0, `index.html referencia ${refs.length} arquivos e todos existem` + (dangling.length ? ' (faltam: ' + dangling.join(', ') + ')' : ''));

const sw = rd('sw.js');
const shell = JSON.parse(sw.match(/const SHELL=(\[.*?\]);/)[1].replace(/'/g, '"'));
const shellMissing = shell.filter((r) => r !== '/' && !fs.existsSync(path.join(SITE, r.slice(1))));
ok(shellMissing.length === 0, 'cache do service worker lista só arquivos que existem');
ok(!sw.includes('__BUILD__'), 'sw.js recebeu a versão do build');

const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'app-data.json'), 'utf8'));
const fromSite = JSON.parse(rd('data.js').replace(/^var D=/, '').replace(/;\s*$/, ''));
ok(JSON.stringify(D) === JSON.stringify(fromSite), 'data.js é igual a data/app-data.json');

const single = fs.readFileSync(path.join(__dirname, '..', 'dist', 'playbook-wr.html'), 'utf8');
ok(!/<!--@|__LOGO__|__BUILD__/.test(single + html + sw), 'nenhum marcador ficou sem substituir');
console.log('ERROS: nenhum');
