// Utilidades compartilhadas pelos testes.
const path = require('path');

// App em arquivo único gerado por `npm run build`.
const FILE = path.join(__dirname, '..', 'dist', 'playbook-wr.html');

// Próximo dia da semana `wd` (0=domingo ... 6=sábado) às `hour` h, a partir de agora.
function nextWeekday(wd, hour = 18) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
  return d;
}

// Faz o relógio da página simulada andar a partir de `target` (por padrão, uma quarta-feira às 18h).
// Assim os testes dão o mesmo resultado em qualquer dia da semana em que forem executados.
function mockDate(w, target = nextWeekday(3)) {
  const off = target.getTime() - Date.now();
  const R = w.Date;
  w.Date = class extends R {
    constructor(...a) { if (a.length) super(...a); else super(R.now() + off); }
    static now() { return R.now() + off; }
  };
}

// Perfil fictício para os testes (o app sem perfil salvo abre a configuração inicial).
const PROFILE = { peso: 80, altura: 178, idade: 30, sexo: 'M', obj: 'Definir' };

// Dados salvos no aparelho = perfil de teste + o que o teste precisar (`seed`).
const withProfile = (seed = {}) => Object.assign({ profile: Object.assign({}, PROFILE) }, seed);

// Grava no localStorage da página simulada (chamar dentro de beforeParse).
function seedStore(w, seed) { w.localStorage.setItem('wr_playbook_v1', JSON.stringify(withProfile(seed))); }

module.exports = { FILE, nextWeekday, mockDate, PROFILE, withProfile, seedStore };
