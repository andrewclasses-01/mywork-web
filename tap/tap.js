/* ============================================================
   web/tap/tap.js — mục TẬP LUYỆN của myWork (v2.4.0, 26/10/2026 · v2.7.0 Giáo án v2 + clip hướng dẫn, 30/10 · v2.8.0 mẫu v7: nút ⓘ, lưới hiệp gọn, thêm/xoá hiệp, 31/10)
   Giao diện từ mẫu thiet-ke/mau-tap-v4 (thầy "ok build" 26/10). Dữ liệu THẬT: web/js/kho.js → KHO.tap
   (mwUsers/{uid}/tap: hoso · n_<YYYY-MM> · anh). Giáo án mặc định: ./giao-an.js (chỉ để tạo hồ sơ lần đầu).

   Dùng (index.html):
     tapNoi(api)          — 1 lần sau đăng nhập. api = { ghiNgay, ghiHoso, ghiAnh, taiAnh, xoaAnh, toast, clip(tên) ⇒ Promise<url> }
     tapNap(dl, doi)      — mỗi lần kho đổi (KHO.tap.nghe)
     tapGan(host, {dev})  — vẽ mục vào host; trả { host, huy() }
     tapConLai()          — số mục hôm nay chưa xong (cột trái)
     tapDong()            — đăng xuất
   NHẬT KÝ 1 NGÀY: { sang:0|1, sx:1 (sáng đạp xe), mua:1 (trời mưa ⇒ bài `mua`), b:{ <mã bài>: [[kg, lần, xong], …] }, calo, buoc, can, vb, cg(1–5), gc }
   ============================================================ */
import { LIB as LIB0, SESS as SESS0, BYDOW as BY0, LIB2, SESS2, BYDOW2, CLIP } from './giao-an.js';
import { chayHinh } from './hinh.js';

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
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2"/>',
  replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.6v.1"/>', trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  rain: '<path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3"/><path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/>',
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
/* (v2.7.0) Giáo án v2 — (v2.7.1) áp từ T7 31/10/2026 (trước: T2 2/11): THÊM vào `ga` của hồ sơ (ngày cũ giữ giáo án cũ) */
export const GA2 = { tu: '2026-10-31', ten: 'Giáo án v2', LIB: LIB2, SESS: SESS2, BYDOW: BYDOW2 };

/* ───────── dữ liệu ───────── */
let API = null, DL = null, H = null, taoHoso = false, themGa = false;
const LOG = {};                // nhật ký đang dùng trên máy này (ngày -> đối tượng)
const CHO = new Map();         // ngày đang chờ ghi (hẹn giờ) ⇒ kho gửi về bản cũ hơn thì KHÔNG đè
const HS = () => (DL && DL.hoso) || hosoMau(today());
const GAS = () => ((DL && DL.ga && DL.ga.length) ? DL.ga : gaMau(today())).slice().sort((a, b) => a.tu.localeCompare(b.tu));
const START = () => HS().batDau;
function gaOf(day) { const g = GAS(); let r = g[0]; g.forEach((x) => { if (x.tu <= day) r = x; }); return r; }
function libAll() { const o = {}; GAS().forEach((g) => Object.assign(o, g.LIB)); return o; }
const sessKey = (day) => { const g = gaOf(day); return g.BYDOW[pd(day).getDay()]; };
const sessOf = (day) => { const g = gaOf(day); return g.SESS[g.BYDOW[pd(day).getDay()]]; };
/* (v2.7.0) bài của ngày: buổi có `mua` + thầy bật ☔ ⇒ bộ bài trời mưa */
const itemsOf = (day) => { const s = sessOf(day); if (!s) return []; return s.mua && LOG[day] && LOG[day].mua ? s.mua : s.items; };
const LB = (day, id) => gaOf(day).LIB[id] || libAll()[id] || { ten: id, loai: 'tick', cach: [], loi: [] };
const dayIdx = (s) => Math.round((pd(s) - pd(START())) / 864e5);
const weekNo = (s) => Math.floor(dayIdx(s) / 7) + 1;
const hasMorning = (day) => pd(day).getDay() !== 0;
const lg = (d) => LOG[d] || (LOG[d] = { sang: 0, b: {} });
/* (v2.8.0) nhật ký `sn:{<mã bài>: số hiệp}` = thầy tự thêm/xoá hiệp trong ngày đó (đè số hiệp của giáo án) */
function setsOf(it, day) { const sn = LOG[day] && LOG[day].sn && LOG[day].sn[it[0]]; if (sn) return sn; const L = LB(day, it[0]); return weekNo(day) <= 2 && it[1] >= 3 && L.loai !== 'tick' ? it[1] - 1 : it[1]; }
function exState(day, it) { const n = setsOf(it, day), a = (LOG[day] && LOG[day].b && LOG[day].b[it[0]]) || []; const d = a.filter((x) => x && x[2]).length; return { n, d, done: d >= n }; }
function dayPct(day) {
  const s = sessOf(day), L = LOG[day]; if (!L || !s) return 0;
  const its = itemsOf(day), tot = its.length + (hasMorning(day) ? 1 : 0), ok = its.filter((it) => exState(day, it).done).length + (hasMorning(day) && L.sang ? 1 : 0);
  return Math.round(100 * ok / tot);
}
function lastOf(id, day) { for (let d = add(day, -1); d >= START(); d = add(d, -1)) { const a = LOG[d] && LOG[d].b && LOG[d].b[id]; if (a && a.some((x) => x && x[2])) return { day: d, a: a.filter((x) => x && x[2]) }; } return null; }
function suggest(it, day) {
  const lb = LB(day, it[0]), last = lastOf(it[0], day); if (!last || lb.loai === 'tick') return null;
  const top = topRep(it[2]), kg = Math.max(...last.a.map((x) => +x[0] || 0));
  if (lb.loai === 'kg' && kg) { const all = last.a.length >= setsOf(it, last.day) && last.a.every((x) => +x[1] >= top); return all ? { kg: kg + 2, up: 1, txt: `Lên <b>${vn(kg + 2)} kg</b>` } : { kg, txt: `Giữ <b>${vn(kg)} kg</b> · +1 lần` }; }
  const mx = Math.max(...last.a.map((x) => +x[1] || 0));
  if (lb.loai === 'lan' || lb.loai === 'kg') return { up: 1, txt: `Thử <b>${mx + 1} lần</b>` };
  if (lb.loai === 'giay') return { up: 1, txt: `Thử <b>${mx + 5}s</b>` };
  return null;
}
/* số điền sẵn cho ô trống (k: 0 = kg, 1 = lần): hiệp TRƯỚC trong cùng buổi → gợi ý → buổi trước → số mục tiêu.
   (v2.6.1) kg chưa từng có ⇒ null (ô ĐỂ TRỐNG, không điền 0 — thầy chốt 28/10) */
function soMoi(day, it, i, k) {
  const id = it[0], lb = LB(day, id), a = (LOG[day] && LOG[day].b && LOG[day].b[id]) || [];
  for (let j = i - 1; j >= 0; j--) { const v = a[j] && a[j][k]; if (v != null && v !== '' && !(k === 0 && !+v)) return +v; }
  if (k === 0) { const sg = suggest(it, day), lk = lastOf(id, day), v = sg && sg.kg ? sg.kg : lk ? +lk.a[0][0] || 0 : 0; return v || null; }
  return lb.loai === 'tick' ? 1 : lb.loai === 'giay' ? lowRep(it[2]) : topRep(it[2]) || 0;
}
/* (v2.5.0) Ô SỐ TỰ HIỂU (thầy chốt mẫu v5): gõ không cần dấu phẩy — 634 ⇒ 63,4 kg · 905 ⇒ 90,5 cm · 1m58 / 1,58 ⇒ 158 cm.
   Ngoài khoảng hợp lý ⇒ báo sai; lệch xa lần trước ⇒ HỎI LẠI (Đúng / Sửa), không tự lưu. */
const LUAT_SO = {
  can: { dv: 'kg', min: 30, max: 200, lech: 5 },
  vb: { dv: 'cm', min: 50, max: 160, lech: 6 },
  cao: { dv: 'cm', min: 120, max: 220, lech: 4 },
};
function hieuSo(raw, k, truoc) {
  const L = LUAT_SO[k]; let s = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/(kg|cm)$/, '');
  if (k === 'cao') { const m = s.match(/^(\d)m(\d{1,2})$/); if (m) s = m[1] + '.' + m[2].padEnd(2, '0'); }
  s = s.replace(',', '.'); if (!/^\d+(\.\d+)?$/.test(s)) return { loi: 'Chỉ gõ số' };
  let v = +s;
  if (k === 'cao' && v > 0 && v < 3) v = Math.round(v * 100);          /* 1.58 m ⇒ 158 cm */
  if (!s.includes('.')) while (v > L.max && v >= 10) v /= 10;          /* 634 ⇒ 63,4 */
  v = Math.round(v * 10) / 10;
  if (v < L.min || v > L.max) return { loi: `${vn(v)} ${L.dv} không hợp lý — gõ lại` };
  if (truoc != null && Math.abs(v - truoc) > L.lech) return { v, hoi: `${vn(v)} ${L.dv}? Lần trước ${vn(truoc)} ${L.dv}` };
  return { v };
}
/* số đo gần nhất TRƯỚC ngày đang xem (để so lệch) */
function soTruoc(f, day) { for (let d = add(day, -1); d >= add(START(), -60); d = add(d, -1)) { const v = LOG[d] && +LOG[d][f]; if (v > 0) return v; } return null; }
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
  /* (v2.7.0) hồ sơ cũ chưa có Giáo án v2 ⇒ thêm 1 lần (2 máy cùng thêm thì giống hệt nhau, không sao)
     (v2.7.1) thầy đổi áp từ 31/10 ⇒ thêm bản tu 31/10; bản tu 2/11 cũ (nếu có) giữ nguyên — cùng nội dung, máy chạy code cũ không thêm lại */
  if (dl.san && dl.hoso && dl.ga && dl.ga.length && !dl.ga.some((g) => g.tu === GA2.tu) && !themGa && API) {
    themGa = true;
    API.ghiHoso({ ga: dl.ga.concat([GA2]) }).catch(() => { themGa = false; });
  }
  if (H) H.veTuXa(doi);
}
export function tapConLai() {
  if (!DL || !DL.san) return '';
  const t = today(); if (t < START()) return '';
  const s = sessOf(t); if (!s) return '';
  const n = itemsOf(t).filter((it) => !exState(t, it).done).length + (hasMorning(t) && !(LOG[t] && LOG[t].sang) ? 1 : 0);
  return n || '✓';
}
export function tapDong() { Object.keys(LOG).forEach((k) => delete LOG[k]); CHO.forEach((x) => clearTimeout(x)); CHO.clear(); DL = null; taoHoso = false; themGa = false; if (H) H.huy(); }

/* ───────── vẽ ───────── */
const TABS = [['hom', 'Hôm nay', 'dumb'], ['tuan', 'Tuần', 'cal'], ['so', 'Số liệu', 'chart'], ['hs', 'Hồ sơ', 'user']];
const nho = (() => { try { return JSON.parse(localStorage.getItem('mywork.tap') || '{}'); } catch (e) { return {}; } })();
const ghiNho = () => { try { localStorage.setItem('mywork.tap', JSON.stringify(nho)); } catch (e) {} };
const S = { tab: 'hom', day: null, open: {}, how: {}, wake: !!nho.wake, big: null, hoi: {} };

export function tapGan(host, opt) {
  if (H) H.huy();
  const phone = opt && opt.dev === 'phone';
  host.innerHTML = `<div class="tp${phone ? ' phone' : ''}"><div class="t-head" id="tH"></div><div class="t-body" id="tB"></div>
    <nav class="t-pnav" id="tN"></nav><div class="t-tipb" id="tT"></div><input type="file" accept="image/*" id="tF" hidden><div class="t-menu" id="tM"></div></div>`;
  const root = host.firstElementChild, $ = (id) => root.querySelector('#' + id);
  /* (v2.5.0) điện thoại: 4 thẻ vẽ vào THANH DƯỚI của app (opt.nav = #pbar) ⇒ thanh nhạc myMusic nằm ngay trên nó */
  const NAV = (opt && opt.nav) || null;
  if (NAV) root.classList.add('ngoainav');
  const onNav = (e) => { const tb = e.target.closest('[data-tab]'); if (!tb || S.tab === tb.dataset.tab) return; e.stopPropagation(); S.tab = tb.dataset.tab; S.big = null; ve(true); };
  if (NAV) NAV.addEventListener('click', onNav);
  if (!S.day) S.day = today();
  const CH = {};
  let wl = null;

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
    vePnav();
  }
  function vePnav() {
    const el = NAV || $('tN'); if (!el) return;
    el.innerHTML = TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${ic(i)}${l}</button>`).join('');
  }
  function pill() { const b = $('tTabs') && $('tTabs').querySelector('button.on'), p = $('tPill'); if (!b || !p) return; p.style.width = b.offsetWidth + 'px'; p.style.transform = `translateX(${b.offsetLeft}px)`; }
  /* (v2.6.1) VÁ TẠI CHỖ: chỉ thay khối con nào ĐỔI (so với chuỗi HTML lần vẽ trước). iPhone Safari: thay cả trang
     (innerHTML) khi đang gõ/tích ⇒ ô đang chọn bị xoá khỏi trang ⇒ Safari tự cuộn tụt xuống cuối. */
  let cu = null;          /* { tab, ds: [chuỗi HTML từng khối con] } của lần vẽ trước */
  function body(anim) {
    const b = $('tB'), y = b.scrollTop, tmp = document.createElement('div');
    requestAnimationFrame(() => b.querySelectorAll('.t-how.on[data-how]').forEach(chayClip));
    tmp.innerHTML = { hom: homHtml, tuan: tuanHtml, so: soHtml, hs: hsHtml }[S.tab]();
    const moi = [...tmp.children], ds = moi.map((el) => el.outerHTML);
    if (!anim && cu && cu.tab === S.tab && cu.ds.length === ds.length && b.children.length === ds.length) {
      const goc = [...b.children];
      ds.forEach((h, i) => { if (h !== cu.ds[i]) goc[i].replaceWith(moi[i]); });
    } else b.replaceChildren(...moi);
    cu = { tab: S.tab, ds };
    if (anim) { b.classList.remove('t-slide'); void b.offsetWidth; b.classList.add('t-slide'); b.scrollTop = 0; } else if (b.scrollTop !== y) b.scrollTop = y;
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
    const its = itemsOf(day), done = its.filter((it) => exState(day, it).done).length + (hasMorning(day) && L.sang ? 1 : 0), tot = its.length + (hasMorning(day) ? 1 : 0);
    const wn = weekNo(day);
    let h = `<div class="t-week">${strip}</div>
     <div class="t-sess"><span class="t-em">${ic(s.ic)}</span><div><h2>${esc(s.ten)}</h2><div class="t-s">${esc(s.phu)} · ${s.phut}'</div></div><div class="t-pr">${done}/${tot}</div></div>
     ${s.mua ? `<button class="t-mua${L.mua ? ' on' : ''}" data-a="mua">${ic('rain')}<span>${L.mua ? 'Trời mưa · đang tập bài trong nhà' : 'Trời mưa? Đổi sang bài trong nhà'}</span></button>` : ''}
     ${wn >= 1 && wn <= 2 ? '<div class="t-tip">Tuần làm quen · bớt 1 hiệp, tạ nhẹ</div>' : ''}
     ${day > t ? '<div class="t-tip">Chưa tới ngày · chỉ xem</div>' : day < START() ? '<div class="t-tip">Trước ngày bắt đầu</div>' : ''}`;
    if (hasMorning(day)) h += `<div class="t-grp">Sáng</div>${sangRow(day)}`;
    h += `<div class="t-grp">${s.buoi || (sessKey(day) === 'NN' ? 'Tối' : 'Chiều')}</div>${its.map((it) => exRow(it, day)).join('')}`;
    const isMon = pd(day).getDay() === 1, canDay = [1, 3, 5].includes(pd(day).getDay());
    const mrow = (f, icn, lab, unit, mode, due) => `<label class="t-mrow"><span class="t-mi">${ic(icn)}</span><span class="t-ml">${lab}${due ? '<i class="t-due" title="Hôm nay nên đo"></i>' : ''}</span>
      <input class="t-num" data-f="${f}" inputmode="${mode}" value="${+L[f] ? vn(L[f]) : ''}" placeholder="—"><span class="t-mu">${unit}</span></label>${hoiHtml(f)}`;
    h += `<div class="t-card t-ms"><h3>Chỉ số</h3><div class="t-mgrid">
       ${mrow('calo', 'fire', 'Calo tập', 'kcal', 'numeric')}
       ${mrow('buoc', 'walk', 'Số bước', 'bước', 'numeric')}
       ${mrow('can', 'scale', 'Cân', 'kg', 'decimal', canDay && !L.can && day === t)}
       ${mrow('vb', 'ruler', 'Vòng bụng', 'cm', 'decimal', isMon && !L.vb && day === t)}
       <div class="t-mrow fr"><span class="t-mi">${ic('smile')}</span><span class="t-ml">Cảm giác</span>
        <div class="t-feel">${['😫', '😕', '🙂', '😄', '💪'].map((e, i) => `<button data-cg="${i + 1}" class="${L.cg === i + 1 ? 'on' : ''}" title="${['Kiệt sức', 'Mệt', 'Ổn', 'Khoẻ', 'Rất khoẻ'][i]}">${e}</button>`).join('')}</div></div>
       <label class="t-mrow"><span class="t-mi">${ic('note')}</span><input class="t-note" data-f="gc" value="${esc(L.gc || '')}" placeholder="Ghi chú"></label>
      </div></div>`;
    /* (v2.5.0) ảnh của RIÊNG ngày này — bấm ＋ trên iPhone: iOS hiện Chụp ảnh / Thư viện / Tệp */
    const anhNgay = ((DL && DL.anh) || []).filter((a) => a.ngay === day);
    h += `<div class="t-card"><h3>Ảnh <span class="t-s">${WD[pd(day).getDay()]} · ${dm(day)}</span></h3><div class="t-ph">
       ${anhNgay.map((a) => `<div><img src="${esc(a.url)}" data-big="${esc(a.id)}" alt="" loading="lazy"></div>`).join('')}
       ${khoa(day) ? '' : `<button class="add${S.dangTai ? ' busy' : ''}" data-a="anh">${ic(S.dangTai ? 'cam' : 'plus')}${S.dangTai ? 'Đang gửi…' : 'Thêm'}</button>`}</div></div>
      ${S.big ? bigHtml() : ''}`;
    return h;
  }
  /* hộp hỏi lại dưới ô số (lệch xa lần trước / số sai) */
  function hoiHtml(f) {
    const q = S.hoi && S.hoi[f]; if (!q) return '';
    return `<div class="t-hoi">${q.loi ? `<span>${esc(q.loi)}</span>` : `<span><b>${esc(q.hoi)}</b></span><button class="ok" data-hoiok="${f}">Đúng</button><button data-hoisua="${f}">Sửa</button>`}</div>`;
  }
  function sangRow(day) {
    const L = lg(day), on = !!L.sang, xe = !!L.sx, v2 = !!gaOf(day).SESS.DOI3;
    if (!v2) return `<div class="t-ex${on ? ' dn' : ''}"><div class="t-exh" data-sang><span class="t-ck${on ? ' on' : ''}"></span><div class="t-tt">Đi bộ ngoài trời</div><span class="t-tg">25' · đi nhanh</span></div></div>`;
    /* (v2.7.0) giáo án v2: chọn Đi bộ / Đạp xe rồi tích */
    return `<div class="t-ex${on ? ' dn' : ''}"><div class="t-exh" data-sang><span class="t-ck${on ? ' on' : ''}"></span><div class="t-tt">${xe ? 'Đạp xe' : 'Đi bộ'} 25'</div>
      <span class="t-seg2"><button data-sx="0" class="${xe ? '' : 'on'}">${ic('walk')}Đi bộ</button><button data-sx="1" class="${xe ? 'on' : ''}">${ic('bike')}Đạp xe</button></span></div></div>`;
  }
  function exRow(it, day) {
    const id = it[0], lb = LB(day, id), st = exState(day, it), open = S.open[day + id], a = lg(day).b[id] || [];
    const pct = st.d && !st.done ? Math.round(100 * st.d / st.n) : 0;
    const sg = khoa(day) ? null : suggest(it, day), last = lastOf(id, day), unit = lb.loai === 'giay' ? 'giây' : 'lần';
    /* (v2.8.0) MỌI loại bài cùng 1 lưới: số thứ tự · ô số (hoặc nhãn) · ô tích VUÔNG nhỏ bên phải.
       Mỗi dòng hiệp: vuốt trái ⇒ nút Xoá (điện thoại) · chuột phải ⇒ menu Xoá hiệp (máy tính). Dòng cuối: ＋ thẳng cột số thứ tự. */
    const ro = khoa(day), rows = lb.loai === 'tick' ? st.n : Math.max(st.n, a.length);
    const stp = (i, k, inner) => `<span class="t-stp"><button data-st="${id}|${i}|${k}|-1">−</button>${inner}<button data-st="${id}|${i}|${k}|1">+</button></span>`;
    const row = (i, mid) => { const on = a[i] && a[i][2]; return `<div class="t-set${on ? ' dn' : ''}" data-row="${id}|${i}"><div class="t-sw"><span class="t-no">${i + 1}</span>${mid}
      <span class="t-sq${on ? ' on' : ''}" data-sk="${id}|${i}" title="Tích hiệp này"></span></div>${ro ? '' : `<button class="t-del" data-del="${id}|${i}">Xoá</button>`}</div>`; };
    let sets = '';
    if (lb.loai === 'tick') {
      if (st.n > 1) sets = `<div class="t-sets k1">${Array.from({ length: rows }, (_, i) => row(i, `<span class="t-lb">Vòng ${i + 1}</span>`)).join('')}${ro ? '' : `<button class="t-addset" data-add="${id}" title="Thêm vòng">${ic('plus')}</button>`}</div>`;
    } else {
      const kg = lb.loai === 'kg';
      sets = `<div class="t-sets${kg ? ' k2' : ' k1'}"><div class="t-shd"><span></span>${kg ? '<span>kg</span>' : ''}<span>${unit}${it[3] ? ' / bên' : ''}</span></div>${Array.from({ length: rows }, (_, i) => {
        const x = a[i] || [];
        return row(i, `${kg ? stp(i, 0, `<input class="t-num" data-in="${id}|${i}|0" inputmode="decimal" value="${+x[0] ? vn(x[0]) : ''}" placeholder="${((v) => v ? vn(v) : '')(soMoi(day, it, i, 0))}">`) : ''}
          ${stp(i, 1, `<input class="t-num" data-in="${id}|${i}|1" inputmode="numeric" value="${x[1] != null && x[1] !== '' ? x[1] : ''}" placeholder="${soMoi(day, it, i, 1) || ''}">`)}`);
      }).join('')}${ro ? '' : `<button class="t-addset" data-add="${id}" title="Thêm hiệp">${ic('plus')}</button>`}</div>`;
    }
    const lastTxt = last && lb.loai !== 'tick' ? `${dm(last.day)}: ${last.a.map((x) => lb.loai === 'kg' && +x[0] ? `${vn(x[0])}×${x[1]}` : x[1]).join(' · ')}` : '';
    const tg = lb.loai === 'tick' && st.n === 1 ? it[2] : `${st.n} × ${it[2]}`;
    return `<div class="t-ex${st.done ? ' dn' : ''}${open ? ' op' : ''}">
      <div class="t-exh" data-tog="${id}"><span class="t-ck${st.done ? ' on' : pct ? ' part' : ''}" style="--p:${pct}%" data-ckall="${id}" title="Tích cả bài"></span>
       <div class="t-tt"><span>${esc(lb.ten)}</span><button class="t-info${S.how[day + id] ? ' on' : ''}" data-info="${day + id}" title="Cách tập">${ic('info')}</button></div><span class="t-tg">${esc(tg)}</span><span class="t-car">${ic('down', 'width:16px;height:16px')}</span></div>
      <div class="t-exb"><div><div class="t-exin">
       <div class="t-how${S.how[day + id] ? ' on' : ''}" data-how="${day + id}"><div><div class="t-howin">
        ${API && API.clip && CLIP[id] ? `<div class="t-clipw"><video class="t-clip" data-clip="${CLIP[id]}" muted playsinline preload="none"></video><button class="t-replay" data-replay title="Xem lại">${ic('replay')}</button></div>` : `<div class="t-fig" data-fig="${id}"></div>`}
        <ol>${(lb.cach || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        ${lb.de ? `<div style="margin-top:6px"><b>Bản dễ:</b> ${esc(lb.de)}</div>` : ''}
        ${lb.loi && lb.loi.length ? `<div class="t-bad"><b>Lỗi hay gặp:</b> ${esc(lb.loi.join(' '))}</div>` : ''}</div></div></div>
       ${sg || lastTxt ? `<div class="t-hint">${sg ? `<span class="t-sug${sg.up ? ' up' : ''}">${sg.up ? ic('up', 'width:13px;height:13px') : ''}<span>${sg.txt}</span></span>` : ''}${lastTxt ? `<span class="t-last" title="Lần trước">${lastTxt}</span>` : ''}</div>` : ''}
       ${sets}
      </div></div></div></div>`;
  }

  /* ── TUẦN ── */
  const shade = (p) => p >= 90 ? ['var(--ac)', '#fff'] : p >= 60 ? ['#5fb3a6', '#fff'] : p >= 30 ? ['#b9e3da', '#0b4f46'] : p > 0 ? ['#e7f5f2', '#0b4f46'] : ['#f8e9e9', '#b45555'];
  const shortName = (d) => { const s = sessOf(d); return s && s.ngan ? s.ngan : s ? s.ten.replace('Thân trên', 'Trên').replace('Thân dưới', 'Dưới').replace('Cardio + bụng', 'Cardio').replace('Nghỉ chủ động', 'Nghỉ') : ''; };
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
      s += `- ${WD[pd(d).getDay()]} ${dm(d)} · ${se ? se.ten : '?'} · ${dayPct(d)}% · sáng ${L.sang ? '✓' + (L.sx ? ' (đạp xe)' : '') : '✗'}${L.mua ? ' · trời mưa' : ''} · calo ${L.calo || '—'} · bước ${L.buoc || '—'}${L.can ? ' · cân ' + L.can : ''}${L.vb ? ' · bụng ' + L.vb : ''}${L.cg ? ' · cảm giác ' + L.cg + '/5' : ''}${L.gc ? ' · "' + L.gc + '"' : ''}\n`;
      Object.keys(L.b || {}).forEach((id) => { const lb = all[id]; if (!lb || lb.loai === 'tick') return; const a = L.b[id].filter((x) => x && x[2]); if (a.length) s += `  - ${lb.ten}: ${a.map((x) => lb.loai === 'kg' && +x[0] ? x[0] + '×' + x[1] : x[1]).join(', ')}\n`; });
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
       <span>Chiều cao</span><b class="t-kvin"><input class="t-num" data-hs="cao" inputmode="decimal" value="${HSo.cao ? vn(HSo.cao) : ''}" placeholder="—"> cm</b>${hoiHtml('cao')}<span>Bắt đầu</span><b>${dm(START())}</b>
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
     <div class="t-card"><h3>Ảnh <span class="t-s">mọi ngày</span></h3>
      <div class="t-ph">${anh.map((a) => `<div><img src="${esc(a.url)}" data-big="${esc(a.id)}" alt="" loading="lazy"><span class="cap">${dm(a.ngay)}${GOC[a.goc] ? ' · ' + GOC[a.goc] : ''}</span></div>`).join('')}
       <button class="add${S.dangTai ? ' busy' : ''}" data-a="anh" data-ngay="${today()}">${ic(S.dangTai ? 'cam' : 'plus')}${S.dangTai ? 'Đang gửi…' : dm(today())}</button></div></div>
    </div>
    <div class="t-card t-plan"><h3>${esc(gaOf(today()).ten)} <span class="t-s">từ ${dm(gaOf(today()).tu)}</span></h3>
     ${[1, 2, 3, 4, 5, 6, 0].map((wd) => { const g = gaOf(today()), s = g.SESS[g.BYDOW[wd]]; if (!s) return ''; const li = (its) => its.map((it) => `<li>${esc((g.LIB[it[0]] || {}).ten || it[0])} <em>— ${it[1]} × ${esc(it[2])}${it[3] ? ' / bên' : ''}</em></li>`).join('');
      return `<details><summary><b>${WD[wd]}</b>${esc(s.ten)}${s.buoi ? ` <em>(${esc(s.buoi.toLowerCase())})</em>` : ''}<span>${s.items.length} bài · ${s.phut}'</span></summary>
      <ul>${li(s.items)}</ul>${s.mua ? `<div class="t-muad">${ic('rain', 'width:14px;height:14px')} Trời mưa</div><ul>${li(s.mua)}</ul>` : ''}</details>`; }).join('')}
     <div style="font-size:12.5px;color:var(--mu);margin-top:10px">${gaOf(today()).SESS.DOI3 ? "Sáng T2–T7 đi bộ hoặc đạp xe 25' · máy chạy dốc cố định 8%" : "Sáng T2–T7 đi bộ ngoài trời 25'"} · 10.000 bước/ngày</div></div>
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
  /* (v2.5.0) ảnh gắn với NGÀY (ngày đang xem ở Hôm nay / hôm nay ở Hồ sơ); không còn chọn góc */
  async function guiAnh(file, ngay) {
    S.dangTai = true; body();
    try {
      const blob = await nenAnh(file), id = ngay + '_' + Date.now().toString(36);
      const r = await API.taiAnh(blob, id + '.jpg');
      const ds = ((DL && DL.anh) || []).concat([{ id, ngay, p: r.p, url: r.url }]);
      if (DL) DL.anh = ds;
      await API.ghiAnh(ds);
      API.toast('Đã lưu ảnh');
    } catch (e) { console.error('[tap] ảnh', e); API.toast('Chưa gửi được ảnh — thử lại'); }
    S.dangTai = false; body();
  }

  /* (v2.6.1) BỎ pop-up đếm giờ nghỉ "Tiếp: hiệp x" (thầy không dùng — 28/10) */

  /* ── thao tác ── */
  const itemOf = (day, id) => itemsOf(day).find((x) => x[0] === id);
  const doi = () => { luuNgay(S.day); if (API && API.khiDoi) API.khiDoi(); };
  function onClick(e) {
    const T = e.target;
    if (Date.now() - chanBam < 350) return;
    const tb = T.closest('[data-tab]'); if (tb) { if (S.tab === tb.dataset.tab) return; S.tab = tb.dataset.tab; S.big = null; S.goc = false; ve(true); return; }
    if (T.closest('[data-a="wake"]')) { S.wake = !S.wake; nho.wake = S.wake; ghiNho(); wake(S.wake); head(); API.toast(S.wake ? 'Giữ sáng màn hình: BẬT' : 'Giữ sáng màn hình: TẮT'); return; }
    if (T.closest('[data-a="homnay"]')) { S.day = today(); ve(); return; }
    if (T.closest('[data-a="report"]')) return report();
    const dy = T.closest('[data-day]'); if (dy) { S.day = dy.dataset.day; ve(); return; }
    const gd = T.closest('[data-goday]'); if (gd) { S.day = gd.dataset.goday; S.tab = 'hom'; ve(true); return; }
    /* ảnh */
    const ah = T.closest('[data-a="anh"]'); if (ah) { if (S.dangTai) return; S.anhNgay = ah.dataset.ngay || S.day; $('tF').value = ''; $('tF').click(); return; }
    /* hỏi lại ô số: Đúng = lưu số đã hỏi · Sửa = xoá ô, gõ lại */
    const hk = T.closest('[data-hoiok]'); if (hk) { const f = hk.dataset.hoiok, q = S.hoi[f]; delete S.hoi[f]; luuSo(f, q.v); return; }
    const hs = T.closest('[data-hoisua]'); if (hs) { const f = hs.dataset.hoisua; delete S.hoi[f]; body(); const o = root.querySelector(f === 'cao' ? '[data-hs="cao"]' : `[data-f="${f}"]`); if (o) { o.value = ''; o.focus(); } return; }
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
    const sx = T.closest('[data-sx]'); if (sx) { if (ro) return; const L = lg(day); L.sx = +sx.dataset.sx; if (!L.sx) delete L.sx; doi(); body(); return; }
    if (T.closest('[data-a="mua"]')) { if (ro) return API.toast('Chưa tới ngày'); const L = lg(day); if (L.mua) delete L.mua; else L.mua = 1; doi(); body(); return; }
    if (T.closest('[data-sang]')) { if (ro) return API.toast(day > today() ? 'Chưa tới ngày' : 'Trước ngày bắt đầu'); const L = lg(day); L.sang = L.sang ? 0 : 1; doi(); body(); return; }
    const cg = T.closest('[data-cg]'); if (cg) { if (ro) return; const L = lg(day), v = +cg.dataset.cg; L.cg = L.cg === v ? 0 : v; doi(); body(); return; }
    const stb = T.closest('[data-st]'); if (stb) {
      if (ro) return API.toast('Chưa tới ngày');
      const [id, i, k, dir] = stb.dataset.st.split('|'), L = lg(day), a = L.b[id] || (L.b[id] = []), lb = LB(day, id), it = itemOf(day, id);
      while (a.length <= +i) a.push([]); const x = a[+i];
      /* ô trống: lần bấm đầu = điền số gợi ý; sau đó mỗi bấm đổi 1 kg / 1 lần / 5 giây */
      if (x[+k] == null || x[+k] === '' || (+k === 0 && !+x[+k])) { const v = soMoi(day, it, +i, +k); x[+k] = v != null ? v : +dir > 0 ? 1 : null; }
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
      if (x[2] && day === today() && lb.loai !== 'tick' && !itemsOf(day).some((y) => !exState(day, y).done)) API.toast('Xong buổi! 💪');
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
    /* (v2.8.0) ＋ = thêm 1 hiệp (ghi số hiệp của ngày vào `sn`) */
    const ad = T.closest('[data-add]'); if (ad) { if (ro) return; const L = lg(day), id = ad.dataset.add, a = L.b[id] || (L.b[id] = []), lb = LB(day, id), n = exState(day, itemOf(day, id)).n;
      const m = (lb.loai === 'tick' ? n : Math.max(n, a.length)) + 1; while (a.length < m) a.push([]); (L.sn || (L.sn = {}))[id] = m; doi(); body(); return; }
    const dl = T.closest('[data-del]'); if (dl) { e.stopPropagation(); xoaHiep(dl.dataset.del); return; }
    /* (v2.8.0) nút ⓘ cạnh tên bài: mở/đóng hướng dẫn ngay dưới tiêu đề */
    const rp = T.closest('[data-replay]'); if (rp) { e.stopPropagation(); const hb = rp.closest('[data-how]'); if (hb) { LUOT[hb.dataset.how] = 0; const v = hb.querySelector('video.t-clip'); if (v && v.src) v.currentTime = 0; chayClip(hb); } return; }
    const inf = T.closest('[data-info]'); if (inf) { e.stopPropagation(); const k = inf.dataset.info, on = !S.how[k]; S.how[k] = on; inf.classList.toggle('on', on);
      if (on) LUOT[k] = 0;   /* mở lại ⓘ = muốn xem ⇒ phát lại 3 lượt */
      const hb = root.querySelector(`.t-how[data-how="${k}"]`); if (hb) { hb.classList.toggle('on', on); chayClip(hb); } return; }
    const tg = T.closest('[data-tog]'); if (tg && !T.closest('input')) {
      /* (v2.8.0) mở 1 bài ⇒ các bài khác của ngày đó gập lại */
      const k = day + tg.dataset.tog, on = !S.open[k];
      Object.keys(S.open).forEach((x) => { if (x.startsWith(day)) delete S.open[x]; });
      if (on) S.open[k] = true;
      root.querySelectorAll('.t-ex.op').forEach((el) => { if (el !== tg.closest('.t-ex')) el.classList.remove('op'); });
      tg.closest('.t-ex').classList.toggle('op', on);
      root.querySelectorAll('.t-how.on[data-how]').forEach(chayClip);
    }
  }
  /* (v2.8.0) xoá 1 hiệp: bỏ dòng đó, các hiệp sau dồn lên; số hiệp của ngày giảm 1 (tối thiểu 1) */
  function xoaHiep(key) {
    const day = S.day; dongMenu(); if (khoa(day)) return;
    const [id, i] = key.split('|'), L = lg(day), a = L.b[id] || (L.b[id] = []), lb = LB(day, id), n = exState(day, itemOf(day, id)).n;
    const m = lb.loai === 'tick' ? n : Math.max(n, a.length); if (m <= 1) { API.toast('Bài cần ít nhất 1 hiệp'); dongVuot(); return; }
    a.splice(+i, 1); (L.sn || (L.sn = {}))[id] = m - 1; dongVuot(); doi(); body();
  }
  /* (v2.8.0) VUỐT TRÁI dòng hiệp ⇒ lộ nút Xoá (kiểu iPhone) · chuột phải ⇒ menu nhỏ "Xoá hiệp" */
  let vu = null, moVuot = null, chanBam = 0;
  const dongVuot = (tru) => { if (moVuot && moVuot !== tru) { moVuot.style.transform = ''; moVuot.parentNode.classList.remove('sw'); } if (moVuot !== tru) moVuot = null; };
  root.addEventListener('pointerdown', (e) => {
    if (S.menu && !e.target.closest('#tM')) dongMenu();
    const sw = e.target.closest('.t-sw'); if (!sw || e.button !== 0 || e.target.closest('input')) { if (!e.target.closest('.t-del')) dongVuot(); return; }
    dongVuot(sw); vu = { sw, x: e.clientX, y: e.clientY, dx: 0, go: false, x0: moVuot === sw ? -76 : 0 };
  });
  root.addEventListener('pointermove', (e) => {
    if (!vu) return; const dx = e.clientX - vu.x, dy = e.clientY - vu.y;
    if (!vu.go) { if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { vu = null; return; } if (Math.abs(dx) < 8) return; vu.go = true; vu.sw.classList.add('keo'); vu.sw.parentNode.classList.add('kv'); if (root.contains(document.activeElement)) document.activeElement.blur(); try { vu.sw.setPointerCapture(e.pointerId); } catch (x) {} }
    vu.dx = Math.min(0, Math.max(-110, vu.x0 + dx)); vu.sw.style.transform = `translateX(${vu.dx}px)`;
  });
  const thaVuot = () => {
    if (!vu) return; const { sw, go, dx } = vu; vu = null; sw.classList.remove('keo'); sw.parentNode.classList.remove('kv'); if (!go) return;
    const mo = dx < -38; sw.style.transform = mo ? 'translateX(-76px)' : ''; sw.parentNode.classList.toggle('sw', mo); moVuot = mo ? sw : null;
    chanBam = Date.now();   /* vuốt xong không tính là bấm */
  };
  root.addEventListener('pointerup', thaVuot); root.addEventListener('pointercancel', thaVuot);
  root.addEventListener('contextmenu', (e) => {
    const r = e.target.closest('[data-row]'); if (!r || khoa(S.day) || e.target.closest('input')) return; e.preventDefault(); e.stopPropagation();
    const [id, i] = r.dataset.row.split('|'), lb = LB(S.day, id), m = root.querySelector('#tM'), bx = root.getBoundingClientRect();
    S.menu = r.dataset.row;
    m.innerHTML = `<button data-del="${r.dataset.row}">${ic('trash')}Xoá ${lb.loai === 'tick' ? 'vòng' : 'hiệp'} ${+i + 1}</button>`;
    m.style.left = Math.min(e.clientX - bx.left, bx.width - 170) + 'px'; m.style.top = (e.clientY - bx.top) + 'px'; m.classList.add('on');
  });
  const dongMenu = () => { S.menu = null; const m = root.querySelector('#tM'); if (m) m.classList.remove('on'); };
  const ngoaiMenu = (e) => { if (S.menu && !e.target.closest('#tM')) dongMenu(); };
  const escMenu = (e) => { if (e.key === 'Escape' && S.menu) dongMenu(); };
  document.addEventListener('pointerdown', ngoaiMenu, true); document.addEventListener('keydown', escMenu);
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
    if (t === $('tF')) { const f = t.files && t.files[0]; if (f) guiAnh(f, S.anhNgay || S.day); return; }
    /* chiều cao (Hồ sơ) */
    if (t.dataset.hs === 'cao') {
      const v0 = t.value.trim(); if (!v0) { body(); return; }
      const r = hieuSo(v0, 'cao', HS().cao); S.hoi = S.hoi || {};
      if (r.loi || r.hoi) S.hoi.cao = r; else { delete S.hoi.cao; luuSo('cao', r.v); return; }
      body(); return;
    }
    if (khoa(S.day)) { body(); return; }
    const L = lg(S.day), num = (s) => { const v = String(s).replace(',', '.').trim(); return v === '' || isNaN(+v) ? null : +v; };
    if (t.dataset.in) {
      const [id, i, k] = t.dataset.in.split('|'), a = L.b[id] || (L.b[id] = []); while (a.length <= +i) a.push([]); a[+i][+k] = num(t.value); doi();
      /* (v2.6.1) KHÔNG vẽ lại (iPhone: nút ‹ › trên bàn phím đã nhảy sang ô kế, vẽ lại là xoá mất ô đó ⇒ trang tụt xuống cuối):
         chỉ sửa số mờ gợi ý ở các hiệp SAU của bài này */
      const it = itemOf(S.day, id);
      root.querySelectorAll('input[data-in]').forEach((o) => {
        const [id2, j, k2] = o.dataset.in.split('|'); if (id2 !== id || k2 !== k || +j <= +i) return;
        const v = soMoi(S.day, it, +j, +k); o.placeholder = v ? (+k === 0 ? vn(v) : String(v)) : '';
      });
      return;
    }
    if (t.dataset.f === 'can' || t.dataset.f === 'vb') {          /* cân · vòng bụng: tự hiểu + hỏi lại khi lệch */
      const f = t.dataset.f, v0 = t.value.trim(); S.hoi = S.hoi || {};
      if (!v0) { delete S.hoi[f]; delete L[f]; doi(); body(); return; }
      const r = hieuSo(v0, f, soTruoc(f, S.day));
      if (r.loi || r.hoi) { S.hoi[f] = r; body(); return; }
      delete S.hoi[f]; luuSo(f, r.v); return;
    }
    if (t.dataset.f) { const v = t.dataset.f === 'gc' ? t.value.trim() : num(t.value); if (v == null || v === '') delete L[t.dataset.f]; else L[t.dataset.f] = v; doi(); }
  }
  /* lưu số đã hiểu: cân/vòng bụng vào nhật ký ngày · chiều cao vào hồ sơ */
  function luuSo(f, v) {
    if (f === 'cao') {
      const hs = Object.assign({}, HS(), { cao: v }); if (DL) DL.hoso = hs;
      API.ghiHoso({ hoso: hs }).then(() => API.toast(`Chiều cao ${vn(v)} cm`), () => API.toast('Chưa lưu được — thử lại'));
      body(); return;
    }
    lg(S.day)[f] = v; doi(); body();
  }
  function onInput(e) { const t = e.target; if (t.classList.contains('t-num')) t.value = t.value.replace(t.dataset.hs === 'cao' ? /[^0-9.,mM]/g : /[^0-9.,]/g, ''); }
  root.addEventListener('click', onClick); root.addEventListener('keydown', onKey); root.addEventListener('change', onChange); root.addEventListener('input', onInput);
  /* (v2.5.0) nhớ mục "Cách tập" đang mở (khung vẽ lại không đóng mất) + hình động chỉ chạy ở mục đang mở */
  /* (v2.7.0) clip hướng dẫn: gắn nguồn lúc mở lần đầu, đóng thì dừng · (v2.8.0) khối hướng dẫn = .t-how.on (không còn <details>) */
  /* (v2.10.0) thầy chốt: clip phát 3 LƯỢT rồi dừng (đỡ nóng máy), chạm nút ↻ để xem lại. Đếm theo bài-ngày (LUOT), vẽ lại khối không đếm lại. */
  const LUOT = {};
  function chayClip(d) {
    const v = d.querySelector('video.t-clip'); if (!v) return;
    const k = d.dataset.how, w = v.parentElement;
    const mo = () => d.classList.contains('on') && d.closest('.t-ex.op');
    const con = () => (LUOT[k] || 0) < 3;
    if (!v.dataset.gan) {
      v.dataset.gan = 1;
      v.addEventListener('ended', () => { LUOT[k] = (LUOT[k] || 0) + 1; if (con() && mo()) { v.currentTime = 0; v.play().catch(() => {}); } else w.classList.add('xong'); });
    }
    w.classList.toggle('xong', !con());
    if (!mo()) { v.pause(); return; }
    if (!con()) { v.pause(); if (v.src || v.dataset.dang) return; }   /* đã đủ 3 lượt: chỉ tải để hiện khung hình, không phát */
    if (v.src) { v.play().catch(() => {}); return; }
    if (v.dataset.dang) return; v.dataset.dang = 1;
    API.clip(v.dataset.clip).then((u) => { v.src = u; if (mo() && con()) v.play().catch(() => {}); },
      () => { v.removeAttribute('data-dang'); v.classList.add('loi'); w.classList.add('loi'); });
  }
  const dungHinh = chayHinh(root);
  const onRs = () => pill(); addEventListener('resize', onRs);

  ve();
  H = {
    host,
    /* kho vừa đổi (máy khác / tiếng vọng): đang gõ dở thì đợi rời ô */
    veTuXa() { const f = document.activeElement; if (f && root.contains(f) && f.matches('input')) { f.addEventListener('blur', () => setTimeout(() => H && H.host === host && ve(), 0), { once: true }); return; } ve(); },
    vePnav,
    huy() { document.removeEventListener('pointerdown', ngoaiMenu, true); document.removeEventListener('keydown', escMenu); wake(false); dungHinh(); if (NAV) NAV.removeEventListener('click', onNav); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onRs); if (H && H.host === host) H = null; },
  };
  return H;
}
