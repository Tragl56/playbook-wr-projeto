#!/usr/bin/env node
// Executa todos os testes e falha (código 1) se algum deles falhar.
// Uso: npm test            (precisa de `npm run build` antes)
//      node tests/run.js food pair   (só alguns)
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist', 'playbook-wr.html');
if (!fs.existsSync(dist)) { console.error('dist/playbook-wr.html não existe. Rode `npm run build` primeiro.'); process.exit(1); }

const all = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort();
const only = process.argv.slice(2);
const files = only.length ? all.filter((f) => only.some((o) => f.startsWith(o))) : all;

let okTotal = 0, failTotal = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 120000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n');
  const ok = lines.filter((l) => l.startsWith('OK')).length;
  const fails = lines.filter((l) => l.startsWith('FALHA'));
  const errLine = lines.find((l) => /^ERR(OS|ORS):/.test(l));
  const jsErr = errLine && !/nenhum/.test(errLine);
  const crashed = r.status !== 0 || !errLine;
  const bad = fails.length > 0 || jsErr || crashed;
  okTotal += ok; failTotal += fails.length + (jsErr || crashed ? 1 : 0);
  console.log(`${bad ? '✗' : '✓'} ${f.replace('.test.js', '').padEnd(8)} ${String(ok).padStart(2)} ok${bad ? '  ← falhou' : ''}`);
  if (bad) console.log(out.split('\n').filter((l) => l.startsWith('FALHA') || /^ERR/.test(l) || /Error|at /.test(l)).slice(0, 12).map((l) => '    ' + l).join('\n'));
}
console.log(`\n${failTotal === 0 ? 'Tudo certo' : failTotal + ' problema(s)'}: ${okTotal} verificações ok em ${files.length} arquivos de teste.`);
process.exit(failTotal === 0 ? 0 : 1);
