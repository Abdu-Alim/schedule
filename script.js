const DN = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const T = [...new Set(L.map(x => x.t))].sort((a, b) => tm(a) - tm(b));
function tm(s) {
    const [h, m] = s.split(':'); return +h * 60 + parseInt(m)
}
const VIRT = /^(Online|Outside IUCA)$/;
const ROOMS = [...new Set(L.flatMap(x => x.r))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const PHYS = ROOMS.filter(r => !VIRT.test(r));
const bld = r => /^\(?A/.test(r) ? 'A' : /^\(?B/.test(r) ? 'B' : /^C\d/.test(r) ? 'C' : 'Не в МУЦА';
const $ = id => document.getElementById(id);
const opt = (el, arr, first) => { el.innerHTML = (first != null ? `<option value="">${first}</option>` : '') + arr.map(([v, t]) => `<option value="${v}">${t}</option>`).join('') };
const FACS = [...new Set(L.flatMap(x => x.f))].sort(), GRS = [...new Set(L.flatMap(x => x.g))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })), TCH = [...new Set(L.flatMap(x => x.e))].sort();
const facOf = g => g.replace(/\d.*/, '');
$('stat').textContent = `${L.length} занятий · ${GRS.length} групп · ${PHYS.length} аудиторий`;
function tab(t) {
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == t));
    ['sch', 'mx', 'fr2', 'err'].forEach(s => $(s).hidden = s != (t == 'fr' ? 'fr2' : t));
}
$('nav').onclick = e => {
    if (e.target.dataset.t) {
        tab(e.target.dataset.t);
        if (e.target.dataset.t == 'mx') mx();
        if (e.target.dataset.t == 'fr') fr();
        if(e.target.dataset.t == 'err') loadReports();
    }
};
/* schedule */
const COL = new Set(['ITC', 'LAWC', 'LNGC', 'PEDC', 'TIS', 'TOUR']), og = (l, a) => a.length ? `<optgroup label="${l}">${a.map(f => `<option value="${f}">${f}</option>`).join('')}</optgroup>` : '';
$('ff').innerHTML = '<option value="">Все</option>' + og('Университет', FACS.filter(f => !COL.has(f))) + og('Колледж', FACS.filter(f => COL.has(f)));
opt($('ft'), TCH.map(f => [f, f]), 'Все');
opt($('fr'), ROOMS.map(f => [f, f]), 'Все');
opt($('fd'), DN.map((d, i) => [i, d]), 'Все');
function fillG() {
    const f = $('ff').value; opt($('fg'), GRS.filter(g => !f || facOf(g) == f).map(g => [g, g]), 'Все')
}
fillG();
function sch() {
    const f = $('ff').value, g = $('fg').value, t = $('ft').value, r = $('fr').value, d = $('fd').value, q = $('fq').value.toLowerCase().trim();
    const R = L.filter(x => (!f || x.f.includes(f) && (g || x.g.some(h => facOf(h) == f))) && (!g || x.g.includes(g)) && (!t || x.e.includes(t)) && (!r || x.r.includes(r)) && (d === '' || x.d == d) && (!q || (x.x + x.r.join(' ') + x.g.join(' ')).toLowerCase().includes(q)))
        .sort((a, b) => a.d - b.d || tm(a.t) - tm(b.t));
    $('c1').textContent = `Найдено: ${R.length}`;
    $('tb').innerHTML = R.length ? R.map(x => `<tr><td class="d">${DN[x.d]}</td><td class="d">${x.t}</td><td>${x.r.map(a => `<span class="rm" data-r="${a}">${a}</span>`).join('<br>') || '—'}</td><td>${x.s}</td><td>${x.e.join('<br>') || '—'}</td><td>${x.g.map(h => `<span class="g" data-g="${h}">${h}</span>`).join('')}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Ничего не найдено</td></tr>'
}
['ff', 'fg', 'ft', 'fr', 'fd'].forEach(i => $(i).onchange = () => {
    if (i == 'ff') fillG();
    sch()
});
$('fq').oninput = sch;
$('rs').onclick = () => {
    ['ff', 'ft', 'fr', 'fd'].forEach(i => $(i).value = '');
    fillG();
    $('fq').value = '';
    sch()
};
$('tb').onclick = e => {
    const g = e.target.dataset.g, r = e.target.dataset.r;
    if (g) {
        $('ff').value = facOf(g);
        fillG();
        $('fg').value = g;
        sch()
    }
    if (r) {
        $('fr').value = r; sch()
    }
};
/* matrix */
const today = (new Date().getDay() + 6) % 7;
opt($('md'), DN.map((d, i) => [i, d])); opt($('xd'), DN.map((d, i) => [i, d])); $('md').value = $('xd').value = today;
opt($('mb'), [['A', 'Корпус A'], ['B', 'Корпус B'], ['C', 'Корпус C (колледж)'], ['Не в МУЦА', 'Не в МУЦА']], 'Все корпуса');
opt($('xb'), [['A', 'Корпус A (старый)'], ['B', 'Корпус B (новый)'], ['C', 'Корпус C (колледж)']], 'Все корпуса');
const occ = (r, d, t) => L.filter(x => x.d == d && x.t == t && x.r.includes(r));
function mx() {
    const d = +$('md').value, b = $('mb').value, q = $('mq').value.toLowerCase();
    $('mh').innerHTML = '<tr><th>Аудитория</th>' + T.map(t => `<th>${t}</th>`).join('') + '</tr>';
    $('mt').innerHTML = ROOMS.filter(r => (!b || bld(r) == b) && r.toLowerCase().includes(q)).map(r => `<tr><td><span class="rm" data-r="${r}">${r}</span></td>` + T.map(t => {
        const o = occ(r, d, t);
        return o.length ? `<td class="o">${o.map(x => `${x.s.slice(0, 45)}<small>${x.g.slice(0, 4).join(', ')}${x.g.length > 4 ? '…' : ''}</small>`).join('')}</td>` : '<td class="f">свободно</td>'
    }).join('') + '</tr>').join('')
}
['md', 'mb'].forEach(i => $(i).onchange = mx);
$('mq').oninput = mx;
$('mt').onclick = e => {
    const r = e.target.dataset.r;
    if (r) {
        $('fr').value = r;
        ['ff', 'ft', 'fd'].forEach(i => $(i).value = '');
        fillG();
        sch();
        tab('sch')
    }
};
/* free */
let sel = new Set();
$('xs').innerHTML = T.map((t, i) => `<button class="chip" data-i="${i}">${t}</button>`).join('');
$('xs').onclick = e => {
    const i = e.target.dataset.i;
    if (i == null) return;
    sel.has(+i) ? sel.delete(+i) : sel.add(+i);
    fr()
};
$('now').onclick = () => {
    const n = new Date(), m = n.getHours() * 60 + n.getMinutes();
    $('xd').value = (n.getDay() + 6) % 7;
    let i = T.findIndex(t => m <= tm(t.split(' - ')[1].replace(/^(\d+):/, '$1:')));
    sel = new Set(i < 0 ? [] : [i]);
    fr()
};
function fr() {
    const d = +$('xd').value, b = $('xb').value; document.querySelectorAll('#xs .chip').forEach(c => c.classList.toggle('on', sel.has(+c.dataset.i)));
    const S = [...sel].sort((a, b) => a - b).map(i => T[i]); if (!S.length) {
        $('c3').textContent = 'Выберите одну или несколько пар.';
        $('xo').innerHTML = '';
        return
    }
    const rows = PHYS.filter(r => !b || bld(r) == b).map(r => ({ r, o: S.flatMap(t => occ(r, d, t).map(x => ({ t, x }))) }));
    const F = rows.filter(a => !a.o.length), B = rows.filter(a => a.o.length);
    $('c3').textContent = `${DN[d]}, ${S.join(' и ')}: свободно ${F.length} из ${rows.length}`;
    let h = '';['A', 'B', 'C', 'Не в МУЦА'].forEach(k => {
        const a = F.filter(z => bld(z.r) == k);
        if (a.length) h += `<div class="bld">Корпус ${k}: свободно</div><div class="chips">${a.map(z => `<button type="button" class="free" data-r="${z.r}">${z.r}</button>`).join('')}</div>`
    });
    if (B.length) h += `<p class="cnt">Нажмите на аудиторию, чтобы посмотреть фотографии и расписание на выбранное время.</p><div class="bld">Заняты</div><div class="chips">${B.map(z => `<button type="button" class="busy" data-r="${z.r}" title="${z.o.map(q => q.t + ': ' + q.x.s + ' (' + q.x.g.join(', ') + ')').join('\n').replace(/"/g, '&quot;')}">${z.r}</button>`).join('')}</div>`;
    $('xo').innerHTML = h || '<div class="empty">Нет данных</div>'
}
['xd', 'xb'].forEach(i => $(i).onchange = fr);
/* photo modal */
const slug = r => r.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); // A108 -> a108, "(A) Cyber Lab" -> a-cyber-lab
const EXT = ['jpg', 'jpeg', 'png', 'webp'], MAXP = 6, cache = new Map();
const probe = src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(src);
    im.onerror = () => res(null);
    im.src = src
});
async function findPhotos(r) {
    if (cache.has(r)) return cache.get(r);
    const s = slug(r), out = [];
    for (let i = 1;
        i <= MAXP; i++) {
        let f = null;
        for (const e of EXT) {
            f = await probe(`images/${s}_${i}.${e}`);
            if (f) break
        }
        if (!f) break;
        out.push(f)
    }
    cache.set(r, out);
    return out;
}
let pm = { r: '', ph: [], i: 0 };
function pshow() {
    const n = pm.ph.length, has = n > 0;
    $('pi').hidden = !has; $('pe').hidden = has;
    $('pp').hidden = $('pn').hidden = n < 2;
    if (has) {
        $('pi').src = pm.ph[pm.i];
        $('pi').alt = `${pm.r}, фото ${pm.i + 1}`;
        $('pc').textContent = `Фото ${pm.i + 1} из ${n}`
    } else $('pc').textContent = '';
    $('th').innerHTML = '';
    if (n > 1) pm.ph.forEach((s, k) => {
        const im = document.createElement('img');
        im.src = s;
        im.alt = ''; im.className = k == pm.i ? 'on' : '';
        im.onclick = () => {
            pm.i = k; pshow()
        };
        $('th').appendChild(im)
    });
}
const pstep = k => {
    if (pm.ph.length > 1) {
        pm.i = (pm.i + k + pm.ph.length) % pm.ph.length; pshow()
    }
};
async function openRoom(r) {
    const d = +$('xd').value, S = [...sel].sort((a, b) => a - b).map(i => T[i]);
    const o = S.flatMap(t => occ(r, d, t).map(x => `${t}: ${x.s} (${x.g.join(', ')})`));
    $('pt').textContent = `Аудитория ${r}`;
    $('ps').textContent = o.length ? `${DN[d]} — занята: ${o.join('; ')}` : `${DN[d]}, ${S.join(' и ')} — свободна`;
    pm = { r, ph: [], i: 0 };
    $('pe').textContent = 'Загрузка фотографий…';
    pshow();
    $('pm').hidden = false; document.body.style.overflow = 'hidden';
    $('px').focus();
    const ph = await findPhotos(r);
    if (pm.r != r) return;
    pm.ph = ph;
    $('pe').textContent = `Фотографий пока нет. Скорро я добавлю фотографии всех аудиторий. Если хотите помочь, можете прислать на shirakhunov_al@iuca.kg`;
    pshow();
}
function pclose() {
    $('pm').hidden = true;
    document.body.style.overflow = '';
    $('pi').removeAttribute('src')
}
$('xo').onclick = e => {
    const b = e.target.closest('[data-r]');
    if (b) openRoom(b.dataset.r)
};
$('px').onclick = pclose;
$('pp').onclick = () => pstep(-1); $('pn').onclick = () => pstep(1);
$('pm').onclick = e => {
    if (e.target == $('pm')) pclose()
};
document.addEventListener('keydown', e => {
    if ($('pm').hidden) return; if (e.key == 'Escape') pclose();
    if (e.key == 'ArrowLeft') pstep(-1); if (e.key == 'ArrowRight') pstep(1)
});
sch();
$('now').click();
//Добавление ГТК
opt($('er'), PHYS.map(f => [f, f]), 'Выберите аудиторию');
opt($('ed'), DN.map((d, i) => [i, d]), 'Выберите день');
opt($('et'), T.map(f => [f, f]), 'Выберите время');

const sb = supabase.createClient('https://chitzdhsisjxrsxyasvp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXR6ZGhzaXNqeHJzeHlhc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDIzODMsImV4cCI6MjEwODc3ODM4M30.yCxWv4GcasmcehqleIgvqOD--BHmlmeLyEUIcd4CjiM');

$('es').onclick = async () => {
    const room = $('er').value;
    const day = $('ed').value;
    const slot = $('et').value;
    const comment = $('ec').value.trim();

    if (room === '' || day === '' || slot === '') {
        $('est').textContent = 'Выберите аудиторию, день и время.';
        return;
    }

    $('es').disabled = true;
    $('est').textContent = 'Отправляю…';
    // loadReports();

    const { error } = await sb.from('reports').insert({
        room: room,
        day: Number(day),
        slot: slot,
        comment: comment || null
    });

    $('es').disabled = false;

    if (error) {
        console.error(error);
        if (error.code === '23505') {
            $('est').textContent = 'Об этом уже сообщили, спасибо! Смотрите список ниже.';
            loadReports();
        } else {
            $('est').textContent = 'Не удалось отправить: ' + error.message;
        }
    } else {
        $('est').textContent = 'Отправлено, спасибо!';
        $('er').value = '';
        $('ed').value = '';
        $('et').value = '';
        $('ec').value = '';
    }
};

//для отображения уже отправленных сообщений
async function loadReports() {
    const box = $('el');
    box.textContent = 'Загрузка…';

    const { data, error } = await sb
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        box.textContent = 'Не удалось загрузить список.';
        return;
    }

    if (data.length === 0) {
        box.textContent = 'Пока никто ничего не сообщал.';
        return;
    }

    box.textContent = '';

    data.forEach(r => {
        const row = document.createElement('div');
        row.className = 'rep';

        const status = r.status === 'added' ? 'учтено' : 'ожидает проверки';
        const date = new Date(r.created_at).toLocaleDateString('ru-RU');

        row.textContent = `${r.room}, ${DN[r.day]}, ${r.slot} - занято (${status}, ${date}). `
            + (r.comment ? `Комментарий: ${r.comment}` : '');

        box.appendChild(row);
    });
}