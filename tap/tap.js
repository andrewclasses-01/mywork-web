/* ============================================================
   web/tap/tap.js — mục TẬP LUYỆN của myWork (v2.4.0, 26/10/2026)
   Giao diện từ mẫu thiet-ke/mau-tap-v4 (thầy "ok build" 26/10). Dữ liệu THẬT: web/js/kho.js → KHO.tap
   (mwUsers/{uid}/tap: hoso · n_<YYYY-MM> · anh). Giáo án mặc định: ./giao-an.js (chỉ để tạo hồ sơ lần đầu).

   Dùng (index.html):
     tapNoi(api)          — 1 lần sau đăng nhập. api = { ghiNgay, ghiHoso, ghiAnh, taiAnh, xoaAnh, toast }
     tapNap(dl, doi)      — mỗi lần kho đổi (KHO.tap.nghe)
     tapGan(host, {dev})  — vẽ mục vào host; trả { host, huy() }
     tapConLai()          — số mục hôm nay chưa xong (cột trái)
     tapDong()            — đăng xuất
   NHẬT KÝ 1 NGÀY: { sang:0|1, b:{ <mã bài>: [[kg, lần, xong], …] }, calo, buoc, can, vb, cg(1–5), gc }
   ============================================================ */
import { LIB as LIB0, SESS as SESS0, BYDOW as BY0 } from './giao-an.js';

/* ───────── ngày tháng ───────── */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = (s) => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
const add = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const dm = (s) => { const d = pd(s); return `${d.getDate()}/${d.getMonth() + 1}`; };
const monOf = (s) => add(s, -((pd(s).getDay() + 6) % 7));
const today = () => ymd(new Date());
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vn = (v, d) => (d == null ? String(v) : (+v).toFixed(d)).replace('.', ',');
const topRep = (r) => { const m = String(r).match(/(\d+)(?!.*\d)/); return m ? +m[1] : 0; };
const lowRep = (r) => { const m = String(r).match(/\d+/); return m ? +m[0] : 0; };
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ───────── biểu tượng ───────── */
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  dumb: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 20 3-6 3 3v4M7 12l3-4 4 1 3 3M10 8l-1 5"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.3 1.3 2.3 2.5 2.8z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m5 12 7-7 7 7M12 19V5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 9a6 6 0 0 1 8 0l-2 3h-4z"/>',
  ruler: '<path d="M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2-2M10.5 13.5l2-2M13.5 16.5l2-2"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  cam: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
};
const ic = (n, st = '') => `<svg class="i" viewBox="0 0 24 24"${st ? ` style="${st}"` : ''}>${P[n] || ''}</svg>`;

/* ───────── hồ sơ + giáo án mặc định (chỉ dùng khi tạo lần đầu) ───────── */
function hosoMau(t) {
  return { cao: 158, batDau: monOf(t), ngu: "22h45–5h45 · trưa 30'", an: '12h00 · 16h30',
    chang: [{ ten: 'Chặng 1 · Bụng bớt nhô', den: '2026-12-27', can: 61, vbGiam: 6 },
      { ten: 'Chặng 2 · Bụng gần phẳng', den: '2027-04-25', can: 57.5, vbGiam: 12 },
      { ten: 'Chặng 3 · Lộ múi mờ', den: '2027-10-31', can: 58, vbGiam: 16 }] };
}
const gaMau = (t) => [{ tu: monOf(t), ten: 'Giáo án v1', LIB: LIB0, SESS: SESS0, BYDOW: BY0 }];

/* ───────── dữ liệu ───────── */
let API = null, DL = null, H = null, taoHoso = false;
const LOG = {};                // nhật ký đang dùng trên máy này (ngày -> đối tượng)
const CHO = new Map();         // ngày đang chờ ghi (hẹn giờ) ⇒ kho gửi về bản cũ hơn thì KHÔNG đè
const HS = () => (DL && DL.hoso) || hosoMau(today());
const GAS = () => ((DL && DL.ga && DL.ga.length) ? DL.ga : gaMau(today())).slice().sort((a, b) => a.tu.localeCompare(b.tu));
const START = () => HS().batDau;
function gaOf(day) { const g = GAS(); let r = g[0]; g.forEach((x) => { if (x.tu <= day) r = x; }); return r; }
function libAll() { const o = {}; GAS().forEach((g) => Object.assign(o, g.LIB)); return o; }
const sessKey = (day) => { const g = gaOf(day); return g.BYDOW[pd(day).getDay()]; };
const sessOf = (day) => { const g = gaOf(day); return g.SESS[g.BYDOW[pd(day).getDay()]]; };
const LB = (day, id) => gaOf(day).LIB[id] || libAll()[id] || { ten: id, loai: 'tick', cach: [], loi: [] };
const dayIdx = (s) => Math.round((pd(s) - pd(START())) / 864e5);
const weekNo = (s) => Math.floor(dayIdx(s) / 7) + 1;
const hasMorning = (day) => pd(day).getDay() !== 0;
const lg = (d) => LOG[d] || (LOG[d] = { sang: 0, b: {} });
function setsOf(it, day) { const L = LB(day, it[0]); return weekNo(day) <= 2 && it[1] >= 3 && L.loai !== 'tick' ? it[1] - 1 : it[1]; }
function exState(day, it) { const n = setsOf(it, day), a = (LOG[day] && LOG[day].b && LOG[day].b[it[0]]) || []; const d = a.filter((x) => x && x[2]).length; return { n, d, done: d >= n }; }
function dayPct(day) {
  const s = sessOf(day), L = LOG[day]; if (!L || !s) return 0;
  const tot = s.items.length + (hasMorning(day) ? 1 : 0), ok = s.items.filter((it) => exState(day, it).done).length + (hasMorning(day) && L.sang ? 1 : 0);
  return Math.round(100 * ok / tot);
}
function lastOf(id, day) { for (let d = add(day, -1); d >= START(); d = add(d, -1)) { const a = LOG[d] && LOG[d].b && LOG[d].b[id]; if (a && a.some((x) => x && x[2])) return { day: d, a: a.filter((x) => x && x[2]) }; } return null; }
function suggest(it, day) {
  const lb = LB(day, it[0]), last = lastOf(it[0], day); if (!last || lb.loai === 'tick') return null;
  const top = topRep(it[2]), kg = Math.max(...last.a.map((x) => +x[0] || 0));
  if (lb.loai === 'kg') { const all = last.a.length >= setsOf(it, last.day) && last.a.every((x) => +x[1] >= top); return all ? { kg: kg + 2, up: 1, txt: `Lên <b>${vn(kg + 2)} kg</b>` } : { kg, txt: `Giữ <b>${vn(kg)} kg</b> · +1 lần` }; }
  const mx = Math.max(...last.a.map((x) => +x[1] || 0));
  if (lb.loai === 'lan') return { up: 1, txt: `Thử <b>${mx + 1} lần</b>` };
  if (lb.loai === 'giay') return { up: 1, txt: `Thử <b>${mx + 5}s</b>` };
  return null;
}
/* số điền sẵn cho ô trống (k: 0 = kg, 1 = lần): hiệp TRƯỚC trong cùng buổi → gợi ý → buổi trước → số mục tiêu */
function soMoi(day, it, i, k) {
  const id = it[0], lb = LB(day, id), a = (LOG[day] && LOG[day].b && LOG[day].b[id]) || [];
  for (let j = i - 1; j >= 0; j--) { const v = a[j] && a[j][k]; if (v != null && v !== '') return +v; }
  if (k === 0) { const sg = suggest(it, day), lk = lastOf(id, day); return sg && sg.kg != null ? sg.kg : lk ? +lk.a[0][0] || 0 : 0; }
  return lb.loai === 'tick' ? 1 : lb.loai === 'giay' ? lowRep(it[2]) : topRep(it[2]) || 0;
}
/* ghi 1 ngày: gộp 0,6 s rồi gửi đúng trường của ngày đó */
function luuNgay(day) {
  clearTimeout(CHO.get(day));
  CHO.set(day, setTimeout(() => {
    CHO.delete(day);
    if (!API) return;
    API.ghiNgay(day, LOG[day] || {}).catch(() => API.toast('Chưa lưu được — máy sẽ gửi lại khi có mạng'));
  }, 600));
}

/* ───────── nối với index.html ───────── */
export function tapNoi(api) { API = api; }
export function tapNap(dl, doi) {
  DL = dl;
  const ds = doi && doi.size ? [...doi] : Object.keys(dl.ngay);
  ds.forEach((k) => { if (k[0] === '#' || CHO.has(k)) return; if (dl.ngay[k]) LOG[k] = clone(dl.ngay[k]); });
  if (dl.san && !dl.hoso && !taoHoso && API) {           /* lần đầu: tạo hồ sơ + giáo án v1 (bắt đầu = thứ 2 tuần này) */
    taoHoso = true;
    API.ghiHoso({ hoso: hosoMau(today()), ga: gaMau(today()) }).catch(() => { taoHoso = false; });
  }
  if (H) H.veTuXa(doi);
}
export function tapConLai() {
  if (!DL || !DL.san) return '';
  const t = today(); if (t < START()) return '';
  const s = sessOf(t); if (!s) return '';
  const n = s.items.filter((it) => !exState(t, it).done).length + (hasMorning(t) && !(LOG[t] && LOG[t].sang) ? 1 : 0);
  return n || '✓';
}
export function tapDong() { Object.keys(LOG).forEach((k) => delete LOG[k]); CHO.forEach((x) => clearTimeout(x)); CHO.clear(); DL = null; taoHoso = false; if (H) H.huy(); }

/* ───────── vẽ ───────── */
const TABS = [['hom', 'Hôm nay', 'dumb'], ['tuan', 'Tuần', 'cal'], ['so', 'Số liệu', 'chart'], ['hs', 'Hồ sơ', 'user']];
const nho = (() => { try { return JSON.parse(localStorage.getItem('mywork.tap') || '{}'); } catch (e) { return {}; } })();
const ghiNho = () => { try { localStorage.setItem('mywork.tap', JSON.stringify(nho)); } catch (e) {} };
const S = { tab: 'hom', day: null, open: {}, wake: !!nho.wake, goc: false, big: null };

export function tapGan(host, opt) {
  if (H) H.huy();
  const phone = opt && opt.dev === 'phone';
  host.innerHTML = `<div class="tp${phone ? ' phone' : ''}"><div class="t-head" id="tH"></div><div class="t-body" id="tB"></div>
    <nav class="t-pnav" id="tN"></nav><div class="t-rest" id="tR"></div><div class="t-tipb" id="tT"></div><input type="file" accept="image/*" id="tF" hidden></div>`;
  const root = host.firstElementChild, $ = (id) => root.querySelector('#' + id);
  if (!S.day) S.day = today();
  const CH = {};
  let wl = null, R = { end: 0, total: 0, iv: 0 };

  /* màn hình luôn sáng khi đang ở trang tập (Wake Lock) */
  async function wake(on) {
    try {
      if (on && !wl && navigator.wakeLock) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); }
      if (!on && wl) { await wl.release(); wl = null; }
    } catch (e) { /* trình duyệt từ chối (vd tab ẩn) — thử lại khi tab hiện */ }
  }
  const onVis = () => { if (S.wake && document.visibilityState === 'visible') wake(true); };
  document.addEventListener('visibilitychange', onVis);
  if (S.wake) wake(true);

  function head() {
    const t = today(), sub = S.tab === 'hom' ? (t < START() ? `Bắt đầu ${dm(START())}` : `Tuần ${weekNo(t)} · ngày ${dayIdx(t) + 1}`) : '';
    $('tH').innerHTML = `<div class="t-h1"><h1>Tập luyện</h1>
      ${S.tab === 'hom' ? `<button class="t-ib t-wake${S.wake ? ' on' : ''}" data-a="wake" title="Giữ sáng màn hình">${ic('sun')}</button>` : ''}
      <div class="t-tabs" id="tTabs"${S.tab === 'hom' ? '' : ' style="margin-left:auto"'}><i class="t-pill" id="tPill"></i>${TABS.map(([k, l]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      ${sub || (S.tab === 'hom' && S.day !== t) ? `<div class="t-sub">${sub}${S.tab === 'hom' && S.day !== t ? `<button data-a="homnay">Về hôm nay</button>` : ''}</div>` : ''}`;
    requestAnimationFrame(pill);
    $('tN').innerHTML = TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${ic(i)}${l}</button>`).join('');
  }
  function pill() { const b = $('tTabs') && $('tTabs').querySelector('button.on'), p = $('tPill'); if (!b || !p) return; p.style.width = b.offsetWidth + 'px'; p.style.transform = `translateX(${b.offsetLeft}px)`; }
  function body(anim) {
    const b = $('tB'), y = b.scrollTop;
    b.innerHTML = { hom: homHtml, tuan: tuanHtml, so: soHtml, hs: hsHtml }[S.tab]();
    if (anim) { b.classList.remove('t-slide'); void b.offsetWidth; b.classList.add('t-slide'); b.scrollTop = 0; } else b.scrollTop = y;
    if (S.tab === 'so') bindCharts();
  }
  const ve = (anim) => { head(); body(anim); };

  /* ── HÔM NAY ── */
  function ring(p, sz = 22) {
    const r = sz / 2 - 2.5, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 ${sz} ${sz}"><circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" fill="none" stroke="var(--li)" stroke-width="3"/>
      ${p ? `<circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c * p / 100} ${c}" transform="rotate(-90 ${sz / 2} ${sz / 2})"/>` : ''}</svg>`;
  }
  const khoa = (day) => day > today() || day < START();     /* ngày chưa tới / trước ngày bắt đầu ⇒ chỉ xem */
  function homHtml() {
    const day = S.day, mon = monOf(day), s = sessOf(day), L = lg(day), t = today();
    if (!s) return '<div class="t-empty">Chưa có giáo án cho ngày này</div>';
    const strip = [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = add(mon, i), f = d > t; return `<button class="t-wd${d === day ? ' on' : ''}${f ? ' fut' : ''}" data-day="${d}">${WD[pd(d).getDay()]}<b>${dm(d)}</b>${ring(f ? 0 : dayPct(d))}</button>`; }).join('');
    const done = s.items.filter((it) => exState(day, it).done).length + (hasMorning(day) && L.sang ? 1 : 0), tot = s.items.length + (hasMorning(day) ? 1 : 0);
    const wn = weekNo(day);
    let h = `<div class="t-week">${strip}</div>
     <div class="t-sess"><span class="t-em">${ic(s.ic)}</span><div><h2>${esc(s.ten)}</h2><div class="t-s">${esc(s.phu)} · ${s.phut}'</div></div><div class="t-pr">${done}/${tot}</div></div>
     ${wn >= 1 && wn <= 2 ? '<div class="t-tip">Tuần làm quen · bớt 1 hiệp, tạ nhẹ</div>' : ''}
     ${day > t ? '<div class="t-tip">Chưa tới ngày · chỉ xem</div>' : day < START() ? '<div class="t-tip">Trước ngày bắt đầu</div>' : ''}`;
    if (hasMorning(day)) h += `<div class="t-grp">Sáng</div>${sangRow(day)}`;
    h += `<div class="t-grp">${sessKey(day) === 'NN' ? 'Tối' : 'Chiều'}</div>${s.items.map((it) => exRow(it, day)).join('')}`;
    const isMon = pd(day).getDay() === 1, canDay = [1, 3, 5].includes(pd(day).getDay());
    const mrow = (f, icn, lab, unit, mode, due) => `<label class="t-mrow"><span class="t-mi">${ic(icn)}</span><span class="t-ml">${lab}${due ? '<i class="t-due" title="Hôm nay nên đo"></i>' : ''}</span>
      <input class="t-num" data-f="${f}" inputmode="${mode}" value="${L[f] != null && L[f] !== '' ? vn(L[f]) : ''}" placeholder="—"><span class="t-mu">${unit}</span></label>`;
    h += `<div class="t-card t-ms"><h3>Chỉ số</h3><div class="t-mgrid">
       ${mrow('calo', 'fire', 'Calo tập', 'kcal', 'numeric')}
       ${mrow('buoc', 'walk', 'Số bước', 'bước', 'numeric')}
       ${mrow('can', 'scale', 'Cân', 'kg', 'decimal', canDay && !L.can && day === t)}
       ${mrow('vb', 'ruler', 'Vòng bụng', 'cm', 'decimal', isMon && !L.vb && day === t)}
       <div class="t-mrow fr"><span class="t-mi">${ic('smile')}</span><span class="t-ml">Cảm giác</span>
        <div class="t-feel">${['😫', '😕', '🙂', '😄', '💪'].map((e, i) => `<button data-cg="${i + 1}" class="${L.cg === i + 1 ? 'on' : ''}" title="${['Kiệt sức', 'Mệt', 'Ổn', 'Khoẻ', 'Rất khoẻ'][i]}">${e}</button>`).join('')}</div></div>
       <label class="t-mrow"><span class="t-mi">${ic('note')}</span><input class="t-note" data-f="gc" value="${esc(L.gc || '')}" placeholder="Ghi chú"></label>
      </div></div>`;
    return h;
  }
  function sangRow(day) {
    const on = !!lg(day).sang;
    return `<div class="t-ex${on ? ' dn' : ''}"><div class="t-exh" data-sang><span class="t-ck${on ? ' on' : ''}"></span><div class="t-tt">Đi bộ ngoài trời</div><span class="t-tg">25' · đi nhanh</span></div></div>`;
  }
  function exRow(it, day) {
    const id = it[0], lb = LB(day, id), st = exState(day, it), open = S.open[day + id], a = lg(day).b[id] || [];
    const pct = st.d && !st.done ? Math.round(100 * st.d / st.n) : 0;
    const sg = khoa(day) ? null : suggest(it, day), last = lastOf(id, day), unit = lb.loai === 'giay' ? 'giây' : 'lần';
    let sets;
    if (lb.loai === 'tick') {
      sets = `<div class="t-sets row">${Array.from({ length: st.n }, (_, i) => { const on = a[i] && a[i][2]; return `<span class="t-set${on ? ' dn' : ''}">${st.n > 1 ? 'Vòng ' + (i + 1) : 'Xong'} <span class="t-ck${on ? ' on' : ''}" data-sk="${id}|${i}"></span></span>`; }).join('')}</div>`;
    } else {
      const stp = (i, k, inner) => `<span class="t-stp"><button data-st="${id}|${i}|${k}|-1">−</button>${inner}<button data-st="${id}|${i}|${k}|1">+</button></span>`;
      sets = `<div class="t-sets"><div class="t-shd"><span></span>${lb.loai === 'kg' ? '<span>kg</span>' : ''}<span>${unit}${it[3] ? ' / bên' : ''}</span></div>${Array.from({ length: Math.max(st.n, a.length) }, (_, i) => {
        const x = a[i] || [], on = x[2];
        return `<div class="t-set${on ? ' dn' : ''}"><span class="t-no"><span class="w">Hiệp </span>${i + 1}</span>
          ${lb.loai === 'kg' ? stp(i, 0, `<input class="t-num" data-in="${id}|${i}|0" inputmode="decimal" value="${x[0] != null && x[0] !== '' ? vn(x[0]) : ''}" placeholder="${((v) => v ? vn(v) : '')(soMoi(day, it, i, 0))}">`) + '<span class="u"> kg ×</span>' : ''}
          ${stp(i, 1, `<input class="t-num" data-in="${id}|${i}|1" inputmode="numeric" value="${x[1] != null && x[1] !== '' ? x[1] : ''}" placeholder="${soMoi(day, it, i, 1) || ''}">`)}<span class="u"> ${unit}</span>
          <span class="t-ck${on ? ' on' : ''}" data-sk="${id}|${i}" title="Tích hiệp này"></span></div>`;
      }).join('')}<div><button class="t-addset" data-add="${id}">+ Hiệp</button></div></div>`;
    }
    const lastTxt = last && lb.loai !== 'tick' ? `${dm(last.day)}: ${last.a.map((x) => lb.loai === 'kg' ? `${vn(x[0])}×${x[1]}` : x[1]).join(' · ')}` : '';
    const tg = lb.loai === 'tick' && st.n === 1 ? it[2] : `${st.n} × ${it[2]}`;
    return `<div class="t-ex${st.done ? ' dn' : ''}${open ? ' op' : ''}">
      <div class="t-exh" data-tog="${id}"><span class="t-ck${st.done ? ' on' : pct ? ' part' : ''}" style="--p:${pct}%" data-ckall="${id}" title="Tích cả bài"></span>
       <div class="t-tt">${esc(lb.ten)}</div><span class="t-tg">${esc(tg)}</span><span class="t-car">${ic('down', 'width:16px;height:16px')}</span></div>
      <div class="t-exb"><div><div class="t-exin">
       ${sg || lastTxt ? `<div class="t-hint">${sg ? `<span class="t-sug${sg.up ? ' up' : ''}">${sg.up ? ic('up', 'width:13px;height:13px') : ''}<span>${sg.txt}</span></span>` : ''}${lastTxt ? `<span class="t-last" title="Lần trước">${lastTxt}</span>` : ''}</div>` : ''}
       ${sets}
       <details class="t-how"><summary>${ic('book', 'width:14px;height:14px')} Cách tập</summary>
        <ol>${(lb.cach || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        ${lb.de ? `<div style="margin-top:6px"><b>Bản dễ:</b> ${esc(lb.de)}</div>` : ''}
        ${lb.loi && lb.loi.length ? `<div class="t-bad"><b>Lỗi hay gặp:</b> ${esc(lb.loi.join(' '))}</div>` : ''}</details>
      </div></div></div></div>`;
  }

  /* ── TUẦN ── */
  const shade = (p) => p >= 90 ? ['var(--ac)', '#fff'] : p >= 60 ? ['#5fb3a6', '#fff'] : p >= 30 ? ['#b9e3da', '#0b4f46'] : p > 0 ? ['#e7f5f2', '#0b4f46'] : ['#f8e9e9', '#b45555'];
  const shortName = (d) => { const s = sessOf(d); return s ? s.ten.replace('Thân trên', 'Trên').replace('Thân dưới', 'Dưới').replace('Cardio + bụng', 'Cardio').replace('Nghỉ chủ động', 'Nghỉ') : ''; };
  const legend = `<div class="t-lg"><i style="background:#f8e9e9"></i>0 <i style="background:#e7f5f2"></i>&lt;30 <i style="background:#b9e3da"></i>&lt;60 <i style="background:#5fb3a6"></i>&lt;90 <i style="background:var(--ac)"></i>≥90%</div>`;
  function tuan(w) {
    const mon = add(START(), (w - 1) * 7), t = today(); let calo = 0; const cans = [], ps = []; let vb = null;
    const cells = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = add(mon, i), L = LOG[d];
      if (d > t) return { d, fut: 1 };
      const p = dayPct(d); ps.push(p); if (L) { calo += +L.calo || 0; if (L.can) cans.push(+L.can); if (L.vb) vb = +L.vb; }
      return { d, p };
    });
    return { mon, cells, calo, vb, avg: ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : 0, can: cans.length ? cans.reduce((a, b) => a + b, 0) / cans.length : null };
  }
  function tuanHtml() {
    const t = today(); if (t < START()) return `<div class="t-empty">Bắt đầu ${dm(START())}</div>`;
    let h = '';
    if (phone) {
      for (let w = weekNo(t); w >= 1; w--) {
        const W = tuan(w);
        h += `<div class="t-wkh"><b>Tuần ${w}</b>${dm(W.mon)}–${dm(add(W.mon, 6))}<span class="r"><b>${W.avg}%</b> · ${W.calo.toLocaleString('vi')} kcal${W.can ? ' · ' + vn(W.can, 1) + ' kg' : ''}${W.vb ? ' · bụng ' + vn(W.vb) : ''}</span></div>
         <div class="t-wkr">${W.cells.map((c) => c.fut ? `<div class="t-cell fut">${WD[pd(c.d).getDay()]}<span>${shortName(c.d)}</span></div>`
           : (([bg, fg]) => `<div class="t-cell${c.d === t ? ' tdy' : ''}" data-goday="${c.d}" style="background:${bg};color:${fg}">${WD[pd(c.d).getDay()]}<b>${c.p}%</b></div>`)(shade(c.p))).join('')}</div>`;
      }
      return h + legend;
    }
    for (let w = weekNo(t); w >= 1; w--) {
      const W = tuan(w);
      h += `<tr><td class="l"><b>Tuần ${w}</b>${dm(W.mon)} – ${dm(add(W.mon, 6))}</td>${W.cells.map((c) => c.fut ? `<td><div class="t-cell fut">${shortName(c.d)}</div></td>`
        : (([bg, fg]) => `<td><div class="t-cell${c.d === t ? ' tdy' : ''}" data-goday="${c.d}" style="background:${bg};color:${fg}" title="${WD[pd(c.d).getDay()]} ${dm(c.d)}"><b>${c.p}%</b>${shortName(c.d)}</div></td>`)(shade(c.p))).join('')}
        <td class="sum">Hoàn thành <b>${W.avg}%</b><br>Calo <b>${W.calo.toLocaleString('vi')}</b><br>Cân <b>${W.can ? vn(W.can, 1) : '—'}</b>${W.vb ? ` · Bụng <b>${vn(W.vb)}</b>` : ''}</td></tr>`;
    }
    return `<table class="t-wk"><thead><tr><th class="l"></th>${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => `<th>${x}</th>`).join('')}<th class="l"></th></tr></thead><tbody>${h}</tbody></table>${legend}`;
  }

  /* ── SỐ LIỆU ── */
  const series = (f) => Object.keys(LOG).sort().filter((d) => d >= START() && LOG[d][f] !== '' && LOG[d][f] != null && +LOG[d][f] > 0).map((d) => ({ d, y: +LOG[d][f] }));
  const avg7 = (pts) => pts.map((p) => { const xs = pts.filter((q) => dayIdx(q.d) <= dayIdx(p.d) && dayIdx(q.d) > dayIdx(p.d) - 7); return { d: p.d, y: +(xs.reduce((a, b) => a + b.y, 0) / xs.length).toFixed(2) }; });
  function lineChart(key, { pts, raw, target, tLabel, unit, dec = 1, yPad = 0.6 }) {
    if (!pts.length) return '<div class="t-empty">Chưa có số</div>';
    const W = 520, Hh = 150, l = 36, r = 56, tp = 10, b = 22, x0 = dayIdx(START()), x1 = Math.max(dayIdx(today()), ...pts.map((p) => dayIdx(p.d)), x0 + 7);
    const ys = [...pts, ...(raw || [])].map((p) => p.y).concat(target != null ? [target] : []);
    const lo = Math.min(...ys) - yPad, hi = Math.max(...ys) + yPad;
    const X = (d) => l + (W - l - r) * (dayIdx(d) - x0) / (x1 - x0), Y = (v) => tp + (Hh - tp - b) * (1 - (v - lo) / (hi - lo));
    let g = '';
    for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3; g += `<line class="gl" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${l - 6}" y="${Y(v) + 3.5}" text-anchor="end">${vn(v, dec ? 1 : 0)}</text>`; }
    const buoc = 7 * Math.max(1, Math.ceil((x1 - x0) / 7 / 5));
    for (let i = 0; x0 + i <= x1; i += buoc) { const d = add(START(), i); g += `<text class="ax" x="${X(d)}" y="${Hh - 5}" text-anchor="middle">${dm(d)}</text>`; }
    if (target != null) g += `<line x1="${l}" x2="${W - r}" y1="${Y(target)}" y2="${Y(target)}" stroke="#94a3b8" stroke-dasharray="4 4" stroke-width="1.2"/><text class="ax" x="${W - r + 6}" y="${Y(target) + 3.5}">${tLabel}</text>`;
    if (raw) g += raw.map((p) => `<circle cx="${X(p.d)}" cy="${Y(p.y)}" r="3" fill="#cbd5e1"/>`).join('');
    g += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + X(p.d).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('')}" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const lp = pts[pts.length - 1];
    g += `<circle cx="${X(lp.d)}" cy="${Y(lp.y)}" r="4.5" fill="var(--ac)" stroke="#fff" stroke-width="2"/><text class="vl" x="${X(lp.d) + 8}" y="${Y(lp.y) + 4}">${vn(lp.y, dec)}</text>`;
    g += `<line class="xh" x1="0" x2="0" y1="${tp}" y2="${Hh - b}" stroke="#94a3b8" stroke-width="1" opacity="0"/><circle class="xd" r="5" fill="var(--ac)" stroke="#fff" stroke-width="2" opacity="0"/>`;
    CH[key] = { pts, raw, X, Y, unit, dec, W };
    return `<svg viewBox="0 0 ${W} ${Hh}" data-ch="${key}">${g}<rect x="${l}" y="0" width="${W - l - r}" height="${Hh}" fill="transparent"/></svg>`;
  }
  function barChart(key, bars, unit) {
    if (!bars.some((x) => x.y)) return '<div class="t-empty">Chưa có số</div>';
    const W = 520, Hh = 150, l = 36, r = 10, tp = 12, b = 22, mx = Math.max(...bars.map((x) => x.y)) * 1.15, bw = (W - l - r) / bars.length;
    const Y = (v) => tp + (Hh - tp - b) * (1 - v / mx); let g = '';
    [0, mx / 2, mx].forEach((v) => { g += `<line class="gl" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${l - 6}" y="${Y(v) + 3.5}" text-anchor="end">${vn(Math.round(v / 100) / 10)}k</text>`; });
    bars.forEach((x, i) => {
      const w = Math.min(bw * 0.56, 60), bx = l + i * bw + (bw - w) / 2, y = Y(x.y);
      if (x.y) g += `<path d="M${bx} ${Hh - b}V${y + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4V${Hh - b}z" fill="${x.cur ? '#9fd3c9' : 'var(--ac)'}" data-bar="${i}"/><text class="vl" x="${bx + w / 2}" y="${y - 5}" text-anchor="middle" style="font-size:11.5px">${x.y.toLocaleString('vi')}</text>`;
      g += `<text class="ax" x="${bx + w / 2}" y="${Hh - 5}" text-anchor="middle">${x.l}</text>`;
    });
    CH[key] = { bars, unit };
    return `<svg viewBox="0 0 ${W} ${Hh}" data-ch="${key}">${g}</svg>`;
  }
  function spark(id) {
    const lb = libAll()[id]; if (!lb) return '';
    const pts = []; Object.keys(LOG).sort().forEach((d) => { const a = (LOG[d].b && LOG[d].b[id] || []).filter((x) => x && x[2]); if (a.length) pts.push({ d, y: Math.max(...a.map((x) => +(lb.loai === 'kg' ? x[0] : x[1]) || 0)) }); });
    if (!pts.length) return '<div class="v" style="color:#94a3b8">—</div>';
    const W = 200, Hh = 46, lo = Math.min(...pts.map((p) => p.y)) - 1, hi = Math.max(...pts.map((p) => p.y)) + 1, x0 = dayIdx(START()), x1 = Math.max(dayIdx(today()), x0 + 1);
    const X = (d) => 4 + (W - 8) * (dayIdx(d) - x0) / (x1 - x0), Y = (v) => 4 + (Hh - 8) * (1 - (v - lo) / (hi - lo));
    return `<svg viewBox="0 0 ${W} ${Hh}"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + X(p.d).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('')}" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linejoin="round"/>${pts.map((p) => `<circle cx="${X(p.d)}" cy="${Y(p.y)}" r="2.6" fill="var(--ac)"/>`).join('')}</svg>
      <div class="v">${vn(pts[0].y)} → ${vn(pts[pts.length - 1].y)} ${lb.loai === 'kg' ? 'kg' : 'lần'}</div>`;
  }
  function dau() { const c = series('can'), v = series('vb'); return { can: c.length ? c[0].y : null, vb: v.length ? v[0].y : null }; }
  function soHtml() {
    const t = today(), can = series('can'), ca = avg7(can), vb = series('vb'), D = dau(), c1 = HS().chang[0];
    const cur = ca.length ? ca[ca.length - 1].y : null, vbc = vb.length ? vb[vb.length - 1].y : null;
    const days = Object.keys(LOG).filter((d) => d >= START() && d < t), avgDone = days.length ? Math.round(days.map(dayPct).reduce((a, b) => a + b, 0) / days.length) : 0;
    let streak = 0; for (let d = add(t, -1); d >= START() && dayPct(d) >= 60; d = add(d, -1)) streak++;
    const bars = []; if (t >= START()) for (let w = 1; w <= weekNo(t); w++) { const W = tuan(w); bars.push({ l: 'T' + w, y: W.calo, cur: w === weekNo(t) }); }
    const down = (a, b, u) => a != null && b != null ? `<div class="d${b < a ? ' good' : ''}">${b <= a ? '↓' : '↑'} ${vn(Math.abs(a - b), 1)} ${u}</div>` : '<div class="d">—</div>';
    return `<div class="t-bar2"><button class="t-btn" data-a="report">${ic('copy')} Chép báo cáo cho Claude</button></div>
     <div class="t-tiles">
      <div class="t-tile"><div class="k">Cân · TB 7 ngày</div><div class="v">${cur != null ? vn(cur, 1) : '—'} <small>kg</small></div>${down(D.can, cur, 'kg')}</div>
      <div class="t-tile"><div class="k">Vòng bụng</div><div class="v">${vbc != null ? vn(vbc) : '—'} <small>cm</small></div>${down(D.vb, vbc, 'cm')}</div>
      <div class="t-tile"><div class="k">Hoàn thành</div><div class="v">${avgDone}<small>%</small></div><div class="d">${days.length} ngày</div></div>
      <div class="t-tile"><div class="k">Chuỗi tập đều</div><div class="v">${streak}</div><div class="d">ngày liên tiếp</div></div>
     </div>
     <div class="t-charts">
      <div class="t-ch"><h4>Cân nặng</h4><div class="t-s">Đường = TB 7 ngày · vạch = mục tiêu</div>${lineChart('can', { pts: ca, raw: can, target: c1.can, tLabel: 'Chặng 1', unit: 'kg', yPad: 0.5 })}</div>
      <div class="t-ch"><h4>Vòng bụng</h4><div class="t-s">${D.vb ? 'Vạch = mục tiêu' : ''}</div>${lineChart('vb', { pts: vb, target: D.vb ? D.vb - c1.vbGiam : null, tLabel: 'Chặng 1', unit: 'cm', yPad: 1 })}</div>
      <div class="t-ch"><h4>Calo tập / tuần</h4><div class="t-s"></div>${barChart('calo', bars, 'kcal')}</div>
      <div class="t-ch"><h4>Sức mạnh</h4><div class="t-s"></div>
       <div class="t-mini">${[['dbp', 'Đẩy ngực'], ['gsq', 'Goblet squat'], ['rdl', 'Romanian DL'], ['pull', 'Kéo xà']].map(([id, n]) => `<div class="m"><b>${n}</b>${spark(id)}</div>`).join('')}</div></div>
     </div>`;
  }
  function bindCharts() {
    const tip = $('tT');
    root.querySelectorAll('svg[data-ch]').forEach((svg) => {
      const c = CH[svg.dataset.ch]; if (!c) return;
      svg.onpointerdown = svg.onpointermove = (e) => {
        const r = svg.getBoundingClientRect(), ar = root.getBoundingClientRect();
        if (c.bars) { const el = e.target.closest('[data-bar]'); if (!el) { tip.classList.remove('on'); return; } const x = c.bars[+el.dataset.bar]; tip.innerHTML = `<b>Tuần ${x.l.slice(1)}</b><br>${x.y.toLocaleString('vi')} ${c.unit}`; }
        else {
          const vx = (e.clientX - r.left) * c.W / r.width; let best = null;
          c.pts.forEach((p) => { if (!best || Math.abs(c.X(p.d) - vx) < Math.abs(c.X(best.d) - vx)) best = p; });
          if (!best) return;
          const xh = svg.querySelector('.xh'), xd = svg.querySelector('.xd');
          xh.setAttribute('x1', c.X(best.d)); xh.setAttribute('x2', c.X(best.d)); xh.setAttribute('opacity', 1);
          xd.setAttribute('cx', c.X(best.d)); xd.setAttribute('cy', c.Y(best.y)); xd.setAttribute('opacity', 1);
          const rw = c.raw && c.raw.find((p) => p.d === best.d);
          tip.innerHTML = `<b>${WD[pd(best.d).getDay()]} ${dm(best.d)}</b><br>${c.raw ? 'TB 7 ngày: ' : ''}${vn(best.y, c.dec)} ${c.unit}${rw ? `<br>Cân hôm đó: ${vn(rw.y)} ${c.unit}` : ''}`;
        }
        tip.classList.add('on'); tip.style.left = Math.min(e.clientX - ar.left + 14, ar.width - 150) + 'px'; tip.style.top = (e.clientY - ar.top - 10) + 'px';
      };
      svg.onpointerleave = () => { tip.classList.remove('on'); svg.querySelectorAll('.xh,.xd').forEach((x) => x.setAttribute('opacity', 0)); };
    });
  }
  function report() {
    const t = today(), HSo = HS(), D = dau(), ca = avg7(series('can')), vb = series('vb'), all = libAll();
    let s = `# Báo cáo tập luyện — đến ${dm(t)}/${t.slice(0, 4)}\n`;
    s += `Hồ sơ: cao ${HSo.cao} cm · bắt đầu ${dm(START())} · cân đầu ${D.can ?? '—'} kg · bụng đầu ${D.vb ?? '—'} cm · giáo án ${gaOf(t).ten}\n`;
    s += `Cân TB 7 ngày: ${ca.length ? ca[ca.length - 1].y : '—'} kg · Vòng bụng: ${vb.map((p) => dm(p.d) + ' ' + p.y).join(', ') || '—'}\n\n## Từng ngày\n`;
    Object.keys(LOG).sort().filter((d) => d >= START() && d <= t).forEach((d) => {
      const L = LOG[d], se = sessOf(d);
      s += `- ${WD[pd(d).getDay()]} ${dm(d)} · ${se ? se.ten : '?'} · ${dayPct(d)}% · sáng ${L.sang ? '✓' : '✗'} · calo ${L.calo || '—'} · bước ${L.buoc || '—'}${L.can ? ' · cân ' + L.can : ''}${L.vb ? ' · bụng ' + L.vb : ''}${L.cg ? ' · cảm giác ' + L.cg + '/5' : ''}${L.gc ? ' · "' + L.gc + '"' : ''}\n`;
      Object.keys(L.b || {}).forEach((id) => { const lb = all[id]; if (!lb || lb.loai === 'tick') return; const a = L.b[id].filter((x) => x && x[2]); if (a.length) s += `  - ${lb.ten}: ${a.map((x) => lb.loai === 'kg' ? x[0] + '×' + x[1] : x[1]).join(', ')}\n`; });
    });
    const xong = () => API.toast(`Đã chép báo cáo (${s.split('\n').length} dòng)`);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(xong, () => API.toast('Không chép được'));
    else API.toast('Máy này không cho chép');
  }

  /* ── HỒ SƠ ── */
  const GOC = { truoc: 'Trước', nghieng: 'Nghiêng', sau: 'Sau' };
  function hsHtml() {
    const HSo = HS(), ca = avg7(series('can')), cur = ca.length ? ca[ca.length - 1].y : null, vb = series('vb'), vbc = vb.length ? vb[vb.length - 1].y : null, D = dau();
    const meas = Object.keys(LOG).sort().filter((d) => d >= START() && (+LOG[d].vb > 0 || +LOG[d].can > 0)).reverse().slice(0, 10);
    const anh = ((DL && DL.anh) || []).slice().sort((a, b) => b.ngay.localeCompare(a.ngay));
    return `<div class="t-pf">
     <div class="t-card"><h3>Thông tin</h3><div class="t-kv">
       <span>Chiều cao</span><b>${HSo.cao} cm</b><span>Bắt đầu</span><b>${dm(START())}</b>
       <span>Lúc đầu</span><b>${D.can != null ? vn(D.can) + ' kg' : '—'} · ${D.vb != null ? vn(D.vb) + ' cm' : '—'}</b>
       <span>Hiện tại</span><b>${cur != null ? vn(cur, 1) + ' kg' : '—'} · ${vbc != null ? vn(vbc) + ' cm' : '—'}</b>
       <span>Ngủ</span><b>${esc(HSo.ngu || '')}</b><span>Ăn</span><b>${esc(HSo.an || '')}</b></div></div>
     <div class="t-card"><h3>Mục tiêu</h3><div class="t-stg">
      ${HSo.chang.map((c, i) => {
        /* % chỉ cho chặng ĐANG chạy (chặng đầu tiên chưa tới hạn). Mục tiêu cân thấp hơn mốc trước ⇒ tính theo cân;
           không thì (chặng tăng cơ) tính theo vòng bụng. */
        const dang = HSo.chang.findIndex((x) => x.den >= today()) === i;
        const lui = (a, b, m) => a != null && b != null && a !== m ? Math.max(0, Math.min(100, Math.round(100 * (a - b) / (a - m)))) : 0;
        const p0 = i ? HSo.chang[i - 1].can : D.can, v0 = D.vb != null ? D.vb - (i ? HSo.chang[i - 1].vbGiam : 0) : null;
        const p = !dang ? 0 : p0 != null && c.can < p0 ? lui(p0, cur, c.can) : lui(v0, vbc, D.vb != null ? D.vb - c.vbGiam : null);
        const vbT = D.vb != null ? vn(D.vb - c.vbGiam) + ' cm' : '−' + c.vbGiam + ' cm';
        return `<div class="t-st"><div class="t"><b>${esc(c.ten)}</b><span>${dm(c.den)}/${c.den.slice(2, 4)}</span></div>
         <div class="br"><i style="width:${p}%"></i></div><div class="t2">${vn(c.can)} kg · ${vbT}${p ? ` · <b>${p}%</b>` : ''}</div></div>`;
      }).join('')}</div></div>
     <div class="t-card"><h3>Số đo</h3>${meas.length ? `<table class="t-tbl"><thead><tr><th>Ngày</th><th>kg</th><th>cm</th></tr></thead><tbody>
      ${meas.map((d) => `<tr><td>${WD[pd(d).getDay()]} ${dm(d)}</td><td>${+LOG[d].can > 0 ? vn(LOG[d].can) : '—'}</td><td>${+LOG[d].vb > 0 ? vn(LOG[d].vb) : '—'}</td></tr>`).join('')}</tbody></table>` : '<div class="t-empty">Chưa có số</div>'}</div>
     <div class="t-card"><h3>Ảnh <span class="t-s">2 tuần/lần</span></h3>
      <div class="t-ph">${anh.map((a) => `<div><img src="${esc(a.url)}" data-big="${esc(a.id)}" alt="" loading="lazy"><span class="cap">${dm(a.ngay)} · ${GOC[a.goc] || ''}</span></div>`).join('')}
       <button class="add${S.dangTai ? ' busy' : ''}" data-a="anh">${ic(S.dangTai ? 'cam' : 'plus')}${S.dangTai ? 'Đang gửi…' : dm(today())}</button></div>
      ${S.goc ? `<div class="t-goc">${Object.entries(GOC).map(([k, l]) => `<button data-goc="${k}">${l}</button>`).join('')}</div>` : ''}</div>
    </div>
    <div class="t-card t-plan"><h3>${esc(gaOf(today()).ten)} <span class="t-s">từ ${dm(gaOf(today()).tu)}</span></h3>
     ${['TA', 'DA', 'CD', 'TB', 'DB', 'TT', 'NN'].map((k, i) => { const g = gaOf(today()), s = g.SESS[k]; if (!s) return ''; return `<details><summary><b>${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</b>${esc(s.ten)}<span>${s.items.length} bài · ${s.phut}'</span></summary>
      <ul>${s.items.map((it) => `<li>${esc((g.LIB[it[0]] || {}).ten || it[0])} <em>— ${it[1]} × ${esc(it[2])}${it[3] ? ' / bên' : ''}</em></li>`).join('')}</ul></details>`; }).join('')}
     <div style="font-size:12.5px;color:var(--mu);margin-top:10px">Sáng T2–T7 đi bộ ngoài trời 25' · 10.000 bước/ngày</div></div>
    ${S.big ? bigHtml() : ''}`;
  }
  function bigHtml() {
    const a = ((DL && DL.anh) || []).find((x) => x.id === S.big); if (!a) return '';
    return `<div class="t-big" data-a="bigclose"><img src="${esc(a.url)}" alt=""><div class="r">${dm(a.ngay)}/${a.ngay.slice(0, 4)} · ${GOC[a.goc] || ''}
      <button data-a="bigdel" class="red">${S.xoaHoi ? 'Chắc chắn xoá?' : 'Xoá'}</button><button data-a="bigclose">Đóng</button></div></div>`;
  }
  /* ảnh: nén về ≤ 1400 px, JPEG (luật Storage chỉ nhận JPEG < 1,5 MB) */
  async function nenAnh(file) {
    let bm; try { bm = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bm = await createImageBitmap(file); }
    const k = Math.min(1, 1400 / Math.max(bm.width, bm.height)), cv = document.createElement('canvas');
    cv.width = Math.round(bm.width * k); cv.height = Math.round(bm.height * k); cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
    for (const q of [0.82, 0.7, 0.55]) { const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg', q)); if (b && b.size < 1.4 * 1024 * 1024) return b; }
    throw new Error('anh-qua-lon');
  }
  async function guiAnh(file, goc) {
    S.dangTai = true; body();
    try {
      const blob = await nenAnh(file), t = today(), id = t + '_' + goc + '_' + Date.now().toString(36);
      const r = await API.taiAnh(blob, id + '.jpg');
      const ds = ((DL && DL.anh) || []).concat([{ id, ngay: t, goc, p: r.p, url: r.url }]);
      if (DL) DL.anh = ds;
      await API.ghiAnh(ds);
      API.toast('Đã lưu ảnh');
    } catch (e) { console.error('[tap] ảnh', e); API.toast('Chưa gửi được ảnh — thử lại'); }
    S.dangTai = false; if (S.tab === 'hs') body();
  }

  /* ── hẹn giờ nghỉ ── */
  function restSec(id, day) { const s = sessOf(day), k = s.items.findIndex((x) => x[0] === id); return LB(day, id).loai === 'giay' ? 45 : k < 2 ? 90 : 60; }
  function startRest(sec, next) {
    R.total = sec; R.end = Date.now() + sec * 1000; clearInterval(R.iv);
    $('tR').innerHTML = `<div style="min-width:0"><div class="k">Tiếp: ${esc(next)}</div><div class="t">0:00</div></div><span style="margin-left:auto"></span>
      <button data-rs="-15">−15</button><button data-rs="15">+15</button><button class="ok" data-rs="x">Tập</button><i class="bar"></i>`;
    $('tR').classList.add('on'); tickRest(); R.iv = setInterval(tickRest, 250);
  }
  function tickRest() {
    const el = $('tR'); if (!el || !el.isConnected) return clearInterval(R.iv);
    const left = Math.max(0, Math.ceil((R.end - Date.now()) / 1000));
    el.querySelector('.t').textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`; el.querySelector('.bar').style.width = (100 * left / R.total) + '%';
    if (left <= 0) { stopRest(); if (navigator.vibrate) navigator.vibrate([300, 150, 300]); API.toast('Hết giờ nghỉ!'); }
  }
  function stopRest() { clearInterval(R.iv); const el = $('tR'); if (el) el.classList.remove('on'); }
  function nextLabel(id, i, day) {
    const s = sessOf(day), it = s.items.find((x) => x[0] === id), st = exState(day, it);
    if (!st.done) return `Hiệp ${Math.min(i + 2, st.n)} · ${LB(day, id).ten}`;
    const nx = s.items.find((x) => !exState(day, x).done); return nx ? LB(day, nx[0]).ten : '';
  }

  /* ── thao tác ── */
  const itemOf = (day, id) => sessOf(day).items.find((x) => x[0] === id);
  const doi = () => { luuNgay(S.day); if (API && API.khiDoi) API.khiDoi(); };
  function onClick(e) {
    const T = e.target;
    const tb = T.closest('[data-tab]'); if (tb) { if (S.tab === tb.dataset.tab) return; S.tab = tb.dataset.tab; S.big = null; S.goc = false; ve(true); return; }
    if (T.closest('[data-a="wake"]')) { S.wake = !S.wake; nho.wake = S.wake; ghiNho(); wake(S.wake); head(); API.toast(S.wake ? 'Giữ sáng màn hình: BẬT' : 'Giữ sáng màn hình: TẮT'); return; }
    if (T.closest('[data-a="homnay"]')) { S.day = today(); ve(); return; }
    if (T.closest('[data-a="report"]')) return report();
    const rs = T.closest('[data-rs]'); if (rs) { const v = rs.dataset.rs; if (v === 'x') return stopRest(); R.end += +v * 1000; R.total = Math.max(R.total, Math.ceil((R.end - Date.now()) / 1000)); tickRest(); return; }
    const dy = T.closest('[data-day]'); if (dy) { S.day = dy.dataset.day; ve(); return; }
    const gd = T.closest('[data-goday]'); if (gd) { S.day = gd.dataset.goday; S.tab = 'hom'; ve(true); return; }
    /* ảnh */
    if (T.closest('[data-a="anh"]')) { S.goc = !S.goc; body(); return; }
    const gc = T.closest('[data-goc]'); if (gc) { S.gocChon = gc.dataset.goc; S.goc = false; body(); $('tF').value = ''; $('tF').click(); return; }
    const bg = T.closest('[data-big]'); if (bg) { S.big = bg.dataset.big; S.xoaHoi = false; body(); return; }
    if (T.closest('[data-a="bigdel"]')) {
      e.stopPropagation(); const a = (DL.anh || []).find((x) => x.id === S.big); if (!a) return;
      if (!S.xoaHoi) { S.xoaHoi = true; body(); return; }    /* bấm 2 lần mới xoá (không dùng hộp confirm của trình duyệt) */
      const ds = DL.anh.filter((x) => x !== a); DL.anh = ds; S.big = null; S.xoaHoi = false; body();
      API.ghiAnh(ds).then(() => API.xoaAnh(a.p)).then(() => API.toast('Đã xoá ảnh'), () => API.toast('Chưa xoá được — thử lại'));
      return;
    }
    if (T.closest('[data-a="bigclose"]')) { S.big = null; S.xoaHoi = false; body(); return; }
    /* tích / nhập */
    const day = S.day, ro = khoa(day);
    if (T.closest('[data-sang]')) { if (ro) return API.toast(day > today() ? 'Chưa tới ngày' : 'Trước ngày bắt đầu'); const L = lg(day); L.sang = L.sang ? 0 : 1; doi(); body(); return; }
    const cg = T.closest('[data-cg]'); if (cg) { if (ro) return; const L = lg(day), v = +cg.dataset.cg; L.cg = L.cg === v ? 0 : v; doi(); body(); return; }
    const stb = T.closest('[data-st]'); if (stb) {
      if (ro) return API.toast('Chưa tới ngày');
      const [id, i, k, dir] = stb.dataset.st.split('|'), L = lg(day), a = L.b[id] || (L.b[id] = []), lb = LB(day, id), it = itemOf(day, id);
      while (a.length <= +i) a.push([]); const x = a[+i];
      /* ô trống: lần bấm đầu = điền số gợi ý; sau đó mỗi bấm đổi 1 kg / 1 lần / 5 giây */
      if (x[+k] == null || x[+k] === '') x[+k] = soMoi(day, it, +i, +k);
      else x[+k] = Math.max(0, +(+x[+k] + (+k === 1 && lb.loai === 'giay' ? 5 : 1) * +dir).toFixed(1));
      doi(); body(); return;
    }
    const sk = T.closest('[data-sk]'); if (sk) {
      if (ro) return API.toast('Chưa tới ngày');
      const [id, i] = sk.dataset.sk.split('|'), L = lg(day), a = L.b[id] || (L.b[id] = []), it = itemOf(day, id), lb = LB(day, id);
      while (a.length <= +i) a.push([]); const x = a[+i];
      if (x[2]) x[2] = 0;
      else {   /* tích hiệp: ô trống thì lấy số hiệp trước / gợi ý / mục tiêu */
        if (lb.loai === 'kg' && (x[0] == null || x[0] === '')) x[0] = soMoi(day, it, +i, 0);
        if (x[1] == null || x[1] === '') x[1] = soMoi(day, it, +i, 1);
        x[2] = 1;
      }
      doi(); body();
      const ck = root.querySelector(`[data-sk="${id}|${i}"]`); if (ck) ck.classList.add('just');
      if (exState(day, it).done && x[2]) { const c2 = root.querySelector(`[data-ckall="${id}"]`); if (c2) c2.classList.add('just'); }
      if (x[2] && day === today() && lb.loai !== 'tick') { const nx = nextLabel(id, +i, day); if (nx) startRest(restSec(id, day), nx); else { stopRest(); API.toast('Xong buổi! 💪'); } }
      return;
    }
    const ca = T.closest('[data-ckall]'); if (ca) {
      if (ro) return API.toast('Chưa tới ngày');
      const id = ca.dataset.ckall, it = itemOf(day, id), lb = LB(day, id), L = lg(day), st = exState(day, it);
      if (st.done) (L.b[id] || []).forEach((x) => { if (x) x[2] = 0; });
      else {
        const a = L.b[id] || (L.b[id] = []);
        for (let i = 0; i < st.n; i++) { a[i] = a[i] || []; const x = a[i]; if (lb.loai === 'kg' && (x[0] == null || x[0] === '')) x[0] = soMoi(day, it, i, 0); if (x[1] == null || x[1] === '') x[1] = soMoi(day, it, i, 1); x[2] = 1; }
      }
      doi(); body(); const c2 = root.querySelector(`[data-ckall="${id}"]`); if (c2) c2.classList.add('just'); return;
    }
    const ad = T.closest('[data-add]'); if (ad) { if (ro) return; const L = lg(day), id = ad.dataset.add, a = L.b[id] || (L.b[id] = []), n = exState(day, itemOf(day, id)).n; while (a.length < n) a.push([]); a.push([]); doi(); body(); return; }
    const tg = T.closest('[data-tog]'); if (tg && !T.closest('input')) { const k = day + tg.dataset.tog; S.open[k] = !S.open[k]; tg.closest('.t-ex').classList.toggle('op', !!S.open[k]); }
  }
  /* ô số an toàn: lăn chuột KHÔNG đổi số (ô là text), Enter = nhận ô và nhảy ô kế tiếp */
  function onKey(e) {
    const t = e.target; if (e.key !== 'Enter' || !t.matches('input.t-num,input.t-note')) return; e.preventDefault();
    /* rời ô ⇒ 'change' vẽ lại khung ⇒ tìm lại ô kế tiếp THEO KHOÁ (phần tử cũ đã bị thay) */
    const all = [...root.querySelectorAll('input.t-num,input.t-note')], nx = all[all.indexOf(t) + 1];
    const khoaO = nx && (nx.dataset.in ? `[data-in="${nx.dataset.in}"]` : `[data-f="${nx.dataset.f}"]`);
    t.blur(); if (khoaO && t.matches('.t-num')) { const o = root.querySelector(khoaO); if (o) o.focus(); }
  }
  function onChange(e) {
    const t = e.target;
    if (t === $('tF')) { const f = t.files && t.files[0]; if (f) guiAnh(f, S.gocChon || 'truoc'); return; }
    if (khoa(S.day)) { body(); return; }
    const L = lg(S.day), num = (s) => { const v = String(s).replace(',', '.').trim(); return v === '' || isNaN(+v) ? null : +v; };
    if (t.dataset.in) { const [id, i, k] = t.dataset.in.split('|'), a = L.b[id] || (L.b[id] = []); while (a.length <= +i) a.push([]); a[+i][+k] = num(t.value); doi(); body(); return; }
    if (t.dataset.f) { const v = t.dataset.f === 'gc' ? t.value.trim() : num(t.value); if (v == null || v === '') delete L[t.dataset.f]; else L[t.dataset.f] = v; doi(); if (t.dataset.f !== 'gc') body(); }
  }
  function onInput(e) { const t = e.target; if (t.classList.contains('t-num')) t.value = t.value.replace(/[^0-9.,]/g, ''); }
  root.addEventListener('click', onClick); root.addEventListener('keydown', onKey); root.addEventListener('change', onChange); root.addEventListener('input', onInput);
  const onRs = () => pill(); addEventListener('resize', onRs);

  ve();
  H = {
    host,
    /* kho vừa đổi (máy khác / tiếng vọng): đang gõ dở thì đợi rời ô */
    veTuXa() { const f = document.activeElement; if (f && root.contains(f) && f.matches('input')) { f.addEventListener('blur', () => setTimeout(() => H && H.host === host && ve(), 0), { once: true }); return; } ve(); },
    huy() { stopRest(); wake(false); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onRs); if (H && H.host === host) H = null; },
  };
  return H;
}
