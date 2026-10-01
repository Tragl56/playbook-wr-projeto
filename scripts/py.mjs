// Roda scripts Python em sequência com o Python que existir: python3 (Mac/Linux), python ou py (Windows).
// Uso: node scripts/py.mjs arquivo1.py [arquivo2.py ...]
import { spawnSync } from 'node:child_process';

const cmd = ['python3', 'python', 'py'].find((c) => {
  const r = spawnSync(c, ['-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)'], { stdio: 'ignore' });
  return r.status === 0;
});
if (!cmd) { console.error('Python 3 não encontrado. Instale em https://www.python.org/downloads/ e rode de novo.'); process.exit(1); }

for (const file of process.argv.slice(2)) {
  const r = spawnSync(cmd, [file], { stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1' } });
  if (r.status !== 0) process.exit(r.status || 1);
}
