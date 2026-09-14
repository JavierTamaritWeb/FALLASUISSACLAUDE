// tests/unit/buscador.test.cjs — matcher del buscador (src/js/buscador.js, parte sin DOM; v4.34.0)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const B = require('../../src/js/buscador.js');

const reg = (id, tituloEs, extra = {}) => ({
  id, tipo: extra.tipo || 'pagina', prio: extra.prio || 1,
  titulo: { es: tituloEs, va: extra.va || tituloEs }, desc: { es: extra.desc || '', va: extra.descVa || extra.desc || '' },
  seccion: '', url: `${id}.html`, fecha: extra.fecha || '', ejercicio: extra.ejercicio || '', hasta: extra.hasta || '', kw: extra.kw || []
});
const idx = () => [
  reg('ofrenda', 'Ofrenda', { va: 'Ofrena', desc: 'Ofrenda a la Virgen', kw: ['ofrenda floral'] }),
  reg('calendario', 'Calendario', { va: 'Calendari' }),
  reg('rep2425', 'Representantes 2024-25', { va: 'Representants 2024-25', ejercicio: '2024-25', tipo: 'seccion', prio: 2 }),
  reg('rep2526', 'Representantes 2025-26', { va: 'Representants 2025-26', ejercicio: '2025-26', tipo: 'seccion', prio: 2 }),
  reg('fm', 'Nosotros · La Fallera Mayor', { va: 'Nosaltres · La Fallera Major', desc: 'Lucía Gutiérrez Martín', tipo: 'seccion', prio: 2 }),
  reg('lucia', 'Lucía Gutiérrez Martín', { desc: 'Fallera Mayor', tipo: 'persona', kw: ['Fallera Mayor', 'Fallera Major'] }),
  reg('pres', 'Nosotros · El Presidente', { va: 'Nosaltres · El President', desc: 'José Santos Quilis', tipo: 'seccion', prio: 2 }),
  reg('sanjuan', 'San Juan 2026', { va: 'Sant Joan 2026', ejercicio: '2025-26', tipo: 'galeria', prio: 3, kw: ['paella'] }),
  reg('evtpasado', 'Presentación de la Falla', { tipo: 'evento', prio: 4, fecha: '2026-01-18', hasta: '2026-01-18', ejercicio: '2025-26', desc: 'Acto de presentación' }),
  reg('galerias', 'Galería', { va: 'Galeria', kw: ['fotos', 'imágenes'] })
];
const HOY = '2026-09-14';
const ids = (q, opts) => B.buscar(idx(), q, Object.assign({ hoy: HOY }, opts)).map((r) => r.registro.id);

test('normalizar: minúsculas, sin tildes ni diéresis, punto volado y apóstrofo', () => {
  assert.equal(B.normalizar('Suïssa - L\'Alqueria, Col·laboracions ÀÉÍ'), 'suissa l alqueria collaboracions aei');
});

test('variantes: plural -s/-es y vocal de género en palabras largas', () => {
  assert.deepEqual(B.variantes('llibrets'), ['llibrets', 'llibret']);
  assert.ok(B.variantes('representantes').includes('representant'));
  assert.ok(B.variantes('presidenta').includes('president'));
  assert.ok(B.variantes('fallera').includes('faller') && B.variantes('fallero').includes('faller'));
  assert.deepEqual(B.variantes('santos'), ['santos', 'santo']); // sin recorte de género en palabras cortas
  assert.deepEqual(B.variantes('mayor'), ['mayor']);
});

test('enEjercicio: el año casa con cualquiera de los dos del ejercicio', () => {
  assert.equal(B.enEjercicio('2025', '2024-25', ''), true);
  assert.equal(B.enEjercicio('2024', '2024-25', ''), true);
  assert.equal(B.enEjercicio('2026', '2024-25', ''), false);
  assert.equal(B.enEjercicio('2026', '', '2026-01-18'), true);
});

test('año dentro del ejercicio: «representantes 2025» prefiere 2025-26 y también devuelve 2024-25', () => {
  const r = ids('representantes 2025');
  assert.equal(r[0], 'rep2526');
  assert.ok(r.includes('rep2425'));
});

test('puntuación aditiva: título + palabra clave suman (persona por su cargo)', () => {
  const res = B.buscar(idx(), 'fallera mayor', { hoy: HOY });
  assert.equal(res[0].registro.id, 'fm'); // sección (prio 2) antes que la persona (prio 1) solo si puntúa más… aquí gana por frase exacta en título
  const lucia = res.find((r) => r.registro.id === 'lucia');
  assert.ok(lucia && lucia.score >= 8, 'la persona puntúa por palabra clave y descripción');
});

test('plural y género puntúan como palabra entera del título', () => {
  assert.equal(ids('presidenta')[0], 'pres');
  assert.equal(ids('representants')[0], 'rep2526'); // ejercicio más reciente primero
  assert.equal(ids('calendari')[0], 'calendario');
});

test('sinónimos ES↔VA: fotos → Galería, ofrena → Ofrenda', () => {
  assert.equal(ids('fotos')[0], 'galerias');
  assert.equal(ids('ofrena')[0], 'ofrenda');
});

test('erratas: calendrio → calendario, ofrendaa → ofrenda; sin corrección si sinErratas', () => {
  const r = B.buscar(idx(), 'calendrio', { hoy: HOY });
  assert.equal(r[0].registro.id, 'calendario');
  assert.equal(r[0].corregido, true);
  assert.deepEqual(r.consulta.corr, { calendrio: 'calendario' });
  assert.equal(ids('ofrendaa')[0], 'ofrenda');
  assert.equal(ids('calendrio', { sinErratas: true }).length, 0);
  assert.equal(B.distancia('calendrio', 'calendario', 2), 1);
  assert.equal(B.distancia('cremaa', 'crema', 2), 1);
  assert.equal(B.distancia('ofrneda', 'ofrenda', 2), 1); // transposición
});

test('bigrama: «lucia gutierrez» y «san juan» refuerzan el título que los lleva seguidos', () => {
  assert.equal(ids('lucia gutierrez')[0], 'lucia');
  assert.equal(ids('sant joan')[0], 'sanjuan');
});

test('los registros pasados no desaparecen: penalizados y marcados', () => {
  const res = B.buscar(idx(), 'presentación', { hoy: HOY });
  const evt = res.find((r) => r.registro.id === 'evtpasado');
  assert.ok(evt, 'el evento pasado sigue en los resultados');
  assert.equal(evt.pasado, true);
  const res2 = B.buscar(idx(), 'acto', { hoy: HOY }); // solo casa en la descripción (1 − 4 < 0) y aun así aparece
  assert.equal(res2[0].registro.id, 'evtpasado');
  // Con año explícito no se penaliza
  const con = B.buscar(idx(), 'presentación 2026', { hoy: HOY }).find((r) => r.registro.id === 'evtpasado');
  assert.ok(con.score > evt.score);
});

test('orden estable: puntuación, prioridad, ejercicio reciente, título ES', () => {
  const a = ids('representantes');
  assert.deepEqual(a.slice(0, 2), ['rep2526', 'rep2425']);
  assert.deepEqual(ids('xyz123'), []);
  assert.deepEqual(ids(''), []);
});
