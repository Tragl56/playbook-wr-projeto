import storage from '@system.storage'

// Chave do dia no formato AAAA-MM-DD (horário local do relógio)
export function todayKey() {
  const d = new Date()
  const p = function (n) { return n < 10 ? '0' + n : '' + n }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

// Lê um valor salvo (JSON). Se não existir ou estiver inválido, devolve o padrão.
export function load(key, def, cb) {
  storage.get({
    key: key,
    default: def,
    success: function (data) {
      let v
      try { v = JSON.parse(data) } catch (e) { v = JSON.parse(def) }
      cb(v)
    },
    fail: function () { cb(JSON.parse(def)) }
  })
}

export function save(key, value) {
  storage.set({ key: key, value: JSON.stringify(value) })
}
