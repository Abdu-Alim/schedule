const DN = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const T = [...new Set(L.map(x => x.t))].sort((a, b) => tm(a) - tm(b));
function tm(s) {const [h, m] = s.split(':'); return +h * 60 + parseInt(m)}
const VIRT = /^(Online|Outside IUCA)$/;
const ROOMS = [...new Set(L.flatMap(x => x.r))].sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
const PHYS = ROOMS.filter(r => !VIRT.test(r));
const bld = r => /^\(?A/.test(r) ? 'A' : /^\(?B/.test(r) ? 'B' : 'Другое';
const $ = id => document.getElementById(id);
const opt = (el, arr, first) => {el.innerHTML = (first != null ? `<option value="">${first}</option>` : '') + arr.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')};
const FACS = [...new Set(L.flatMap(x => x.f))].sort(), GRS = [...new Set(L.flatMap(x => x.g))].sort((a, b) => a.localeCompare(b, 'en', {numeric: true})), TCH = [...new Set(L.flatMap(x => x.e))].sort();
const facOf = g => g.replace(/\d.*/, '');
$('stat').textContent = `${L.length} занятий · ${GRS.length} групп · ${PHYS.length} аудиторий`;
function tab(t) {document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == t));['sch', 'mx', 'fr2'].forEach(s => $(s).hidden = s != (t == 'fr' ? 'fr2' : t));}
$('nav').onclick = e => {if (e.target.dataset.t) {tab(e.target.dataset.t); if (e.target.dataset.t == 'mx') mx(); if (e.target.dataset.t == 'fr') fr()} };
/* schedule */
opt($('ff'), FACS.map(f => [f, f]), 'Все'); opt($('ft'), TCH.map(f => [f, f]), 'Все'); opt($('fr'), ROOMS.map(f => [f, f]), 'Все'); opt($('fd'), DN.map((d, i) => [i, d]), 'Все');
function fillG() {const f = $('ff').value; opt($('fg'), GRS.filter(g => !f || facOf(g) == f).map(g => [g, g]), 'Все')}
fillG();
function sch() {
    const f = $('ff').value, g = $('fg').value, t = $('ft').value, r = $('fr').value, d = $('fd').value, q = $('fq').value.toLowerCase().trim();
    const R = L.filter(x => (!f || x.f.includes(f) && (g || x.g.some(h => facOf(h) == f))) && (!g || x.g.includes(g)) && (!t || x.e.includes(t)) && (!r || x.r.includes(r)) && (d === '' || x.d == d) && (!q || (x.x + x.r.join(' ') + x.g.join(' ')).toLowerCase().includes(q)))
        .sort((a, b) => a.d - b.d || tm(a.t) - tm(b.t));
    $('c1').textContent = `Найдено: ${R.length}`;
    $('tb').innerHTML = R.length ? R.map(x => `<tr><td class="d">${DN[x.d]}</td><td class="d">${x.t}</td><td>${x.r.map(a => `<span class="rm" data-r="${a}">${a}</span>`).join('<br>') || '—'}</td><td>${x.s}</td><td>${x.e.join('<br>') || '—'}</td><td>${x.g.map(h => `<span class="g" data-g="${h}">${h}</span>`).join('')}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Ничего не найдено</td></tr>'
}
['ff', 'fg', 'ft', 'fr', 'fd'].forEach(i => $(i).onchange = () => {if (i == 'ff') fillG(); sch()}); $('fq').oninput = sch;
$('rs').onclick = () => {['ff', 'ft', 'fr', 'fd'].forEach(i => $(i).value = ''); fillG(); $('fq').value = ''; sch()};
$('tb').onclick = e => {const g = e.target.dataset.g, r = e.target.dataset.r; if (g) {$('ff').value = facOf(g); fillG(); $('fg').value = g; sch()} if (r) {$('fr').value = r; sch()} };
/* matrix */
const today = (new Date().getDay() + 6) % 7;
opt($('md'), DN.map((d, i) => [i, d])); opt($('xd'), DN.map((d, i) => [i, d])); $('md').value = $('xd').value = today;
opt($('mb'), [['A', 'Корпус A'], ['B', 'Корпус B'], ['Другое', 'Другое']], 'Все корпуса'); opt($('xb'), [['A', 'Корпус A (старый)'], ['B', 'Корпус B (новый)']], 'Все корпуса');
const occ = (r, d, t) => L.filter(x => x.d == d && x.t == t && x.r.includes(r));
function mx() {
    const d = +$('md').value, b = $('mb').value, q = $('mq').value.toLowerCase();
    $('mh').innerHTML = '<tr><th>Аудитория</th>' + T.map(t => `<th>${t}</th>`).join('') + '</tr>';
    $('mt').innerHTML = ROOMS.filter(r => (!b || bld(r) == b) && r.toLowerCase().includes(q)).map(r => `<tr><td><span class="rm" data-r="${r}">${r}</span></td>` + T.map(t => {const o = occ(r, d, t); return o.length ? `<td class="o">${o.map(x => `${x.s.slice(0, 45)}<small>${x.g.slice(0, 4).join(', ')}${x.g.length > 4 ? '…' : ''}</small>`).join('')}</td>` : '<td class="f">свободно</td>'}).join('') + '</tr>').join('')
}
['md', 'mb'].forEach(i => $(i).onchange = mx); $('mq').oninput = mx;
$('mt').onclick = e => {const r = e.target.dataset.r; if (r) {$('fr').value = r;['ff', 'ft', 'fd'].forEach(i => $(i).value = ''); fillG(); sch(); tab('sch')} };
/* free */
let sel = new Set();
$('xs').innerHTML = T.map((t, i) => `<button class="chip" data-i="${i}">${t}</button>`).join('');
$('xs').onclick = e => {const i = e.target.dataset.i; if (i == null) return; sel.has(+i) ? sel.delete(+i) : sel.add(+i); fr()};
$('now').onclick = () => {const n = new Date(), m = n.getHours() * 60 + n.getMinutes(); $('xd').value = (n.getDay() + 6) % 7; let i = T.findIndex(t => m <= tm(t.split(' - ')[1].replace(/^(\d+):/, '$1:'))); sel = new Set(i < 0 ? [] : [i]); fr()};
function fr() {
    const d = +$('xd').value, b = $('xb').value; document.querySelectorAll('#xs .chip').forEach(c => c.classList.toggle('on', sel.has(+c.dataset.i)));
    const S = [...sel].map(i => T[i]); if (!S.length) {$('c3').textContent = 'Выберите одну или несколько пар.'; $('xo').innerHTML = ''; return }
    const rows = PHYS.filter(r => !b || bld(r) == b).map(r => ({r, o: S.flatMap(t => occ(r, d, t).map(x => ({t, x})))}));
    const F = rows.filter(a => !a.o.length), B = rows.filter(a => a.o.length);
    $('c3').textContent = `${DN[d]}, ${S.join(' и ')}: свободно ${F.length} из ${rows.length}`;
    let h = '';['A', 'B', 'Другое'].forEach(k => {const a = F.filter(z => bld(z.r) == k); if (a.length) h += `<div class="bld">Корпус ${k}: свободно</div><div class="chips">${a.map(z => `<span class="free">${z.r}</span>`).join('')}</div>`});
    if (B.length) h += `<div class="bld">Заняты</div><div class="chips">${B.map(z => `<span class="busy" title="${z.o.map(q => q.t + ': ' + q.x.s + ' (' + q.x.g.join(', ') + ')').join('\n').replace(/"/g, '&quot;')}">${z.r}</span>`).join('')}</div><p class="cnt">Наведите на занятую аудиторию, чтобы увидеть, кто там.</p>`;
    $('xo').innerHTML = h || '<div class="empty">Нет данных</div>'
}
['xd', 'xb'].forEach(i => $(i).onchange = fr);
sch(); $('now').click();
