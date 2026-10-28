/* ============================================================
   web/nhac/nhac.js — myMUSIC: kho nhạc riêng của thầy (myWork v2.5.0, 26/10/2026; mẫu thiet-ke/mau-tap-v5 mục 6)
   - Trang thư viện (mục "myMusic" ở cột trái): thêm nhạc (MP3/M4A…), danh sách phát, yêu thích, xoá.
   - Thanh nhạc mini dưới cùng (chạy xuyên mọi mục) + trình phát lớn. iPhone: điều khiển ở màn hình khoá (Media Session).
   Dữ liệu: web/js/kho.js → KHO.nhac (mwUsers/{uid}/nhac/ds: bai · ds; tệp ở Storage mwUsers/{uid}/nhac/).
   BÀI: { id, ten, ca, dai (giây), kb, p (đường Storage), url, them (YYYY-MM-DD), tim (0|1) }
   DANH SÁCH PHÁT: { id, ten, mau, bai: [id…] }
   Dùng (index.html): nhacNoi(api) · nhacNap(dl) · nhacGanThanh(barEl, fullEl, {dev}) · nhacGanTrang(host, {dev}) · nhacDong()
   ============================================================ */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (v) => { v = Math.max(0, Math.floor(v || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
const P = {
  note: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
  next: '<path d="M5 4v16l11-8z" fill="currentColor" stroke="none"/><path d="M19 4v16"/>', prev: '<path d="M19 20V4L8 12z" fill="currentColor" stroke="none"/><path d="M5 4v16"/>',
  shuf: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', rep: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="m6 9 6 6 6-6"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', vol: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', ok: '<path d="m5 12 5 5 9-10"/>', okc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  wifix: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0"/><path d="M3 3l18 18"/>', hdd: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15h.01M11 15h6"/>',
};
const ic = (n, st = '') => `<svg class="i" viewBox="0 0 24 24"${st ? ` style="${st}"` : ''}>${P[n] || ''}</svg>`;
const MAU = ['#ef4444', '#f97316', '#eab308', '#14a08e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#22c55e'];
const mauCua = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return MAU[h % MAU.length]; };
const homNay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ───────── trạng thái chung (sống qua mọi lần vẽ lại khung) ───────── */
let API = null, DL = { san: false, bai: [], ds: [] };
const AU = new Audio(); AU.preload = 'metadata';
const nho = (() => { try { return JSON.parse(localStorage.getItem('mywork.nhac') || '{}'); } catch (e) { return {}; } })();
const ghiNho = () => { try { localStorage.setItem('mywork.nhac', JSON.stringify({ id: Q.id, t: Math.floor(AU.currentTime || 0), q: Q.ds, shuf: Q.shuf, rep: Q.rep, vol: AU.volume, ten: Q.ten, da: [...Q.da] })); } catch (e) {} };
/* (v2.6.1) Q.da = bài ĐÃ PHÁT trong vòng này ⇒ "bài sau" luôn chọn bài CHƯA phát; phát hết cả danh sách mới sang vòng mới (thầy chốt 28/10) */
const Q = { ds: [...new Set(nho.q || [])], id: nho.id || null, shuf: !!nho.shuf, rep: nho.rep || 'het', ten: nho.ten || '', tTiep: nho.t || 0, da: new Set(nho.da || []) };
if (nho.vol != null) AU.volume = nho.vol;
const V = { xem: 'all', menu: null, hoi: null, tai: [], full: false };
let THANH = null, FULL = null, TRANG = null, phone = false;

const BAI = (id) => DL.bai.find((b) => b.id === id);
const DSP = (id) => DL.ds.find((d) => d.id === id);
function dsXem() {
  if (V.xem === 'yt') return DL.bai.filter((b) => b.tim);
  const d = DSP(V.xem); if (d) return d.bai.map(BAI).filter(Boolean);
  const l = DL.bai.slice().sort((a, b) => (b.them || '').localeCompare(a.them || '') || a.ten.localeCompare(b.ten, 'vi'));
  return V.xem === 'may' ? l.filter((b) => MAY.has(b.id)) : l;
}
const tenXem = () => (V.xem === 'yt' ? 'Yêu thích' : V.xem === 'may' ? 'Đã tải' : DSP(V.xem) ? DSP(V.xem).ten : 'Tất cả bài');

/* ───────── (v2.6.0) NGHE OFFLINE — mẫu thiet-ke/mau-nhac-offline-v1
   Tệp nhạc tải về Cache Storage `mywork-nhac` (khoá <gốc>/__nhac/<id>) — RIÊNG từng máy, không đụng kho Firebase.
   Phát: bài có trong máy ⇒ blob từ máy (không tốn mạng); không có ⇒ url Firebase như cũ.
   Cài đặt máy này: localStorage `mywork.nhac.may` = { tu: tự tải bài mới thêm (mặc định bật), biet: [id bài đã thấy] } ───────── */
const KHO_MAY = 'mywork-nhac', CO_MAY = typeof caches !== 'undefined';
const khoaMay = (id) => new URL('/__nhac/' + id, location.href).href;
const MAY = new Set();                       // id bài đã có trong máy
const DANG = {};                             // id → { p: 0..1, ac: AbortController | null } (đang tải / chờ tải)
const HANG = [];                             // hàng chờ tải (tải 2 bài một lúc)
let mang = navigator.onLine !== false, dangChay = 0, blobUrl = null, daMoKhoa = false, daXinGiu = false;
const CAI = (() => { try { return JSON.parse(localStorage.getItem('mywork.nhac.may') || '{}'); } catch (e) { return {}; } })();
const luuCai = () => { try { localStorage.setItem('mywork.nhac.may', JSON.stringify(CAI)); } catch (e) {} };
if (CO_MAY) caches.open(KHO_MAY).then((c) => c.keys()).then((ks) => { ks.forEach((r) => MAY.add(decodeURIComponent(r.url.split('/__nhac/')[1] || ''))); ve(); }).catch(() => {});
const phatDuoc = (id) => mang || MAY.has(id);
function xinGiu() { if (daXinGiu) return; daXinGiu = true; try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }
async function ghiMay(id, blob) {
  const c = await caches.open(KHO_MAY);
  await c.put(khoaMay(id), new Response(blob, { headers: { 'content-type': blob.type || 'audio/mpeg', 'content-length': String(blob.size) } }));
  MAY.add(id); xinGiu();
}
function taiMay(id) {
  const b = BAI(id); if (!b || !CO_MAY || MAY.has(id) || DANG[id]) return;
  if (!mang) { API && API.toast('Cần có mạng để tải'); return; }
  DANG[id] = { p: 0, ac: null }; HANG.push(id); chayHang();
}
function chayHang() {
  while (dangChay < 2 && HANG.length) {
    const id = HANG.shift(); if (!DANG[id]) continue;
    dangChay++; taiMot(id).finally(() => { dangChay--; chayHang(); });
  }
  veTrang(); veThanh();
}
async function taiMot(id) {
  const b = BAI(id), d = DANG[id]; if (!b || !d) { delete DANG[id]; return; }
  d.ac = new AbortController();
  try {
    const r = await fetch(b.url, { signal: d.ac.signal });
    if (!r.ok) throw new Error('tai-' + r.status);
    const tong = +r.headers.get('content-length') || (b.kb || 0) * 1024, kieu = r.headers.get('content-type') || 'audio/mpeg';
    let blob;
    if (r.body && r.body.getReader) {
      const rd = r.body.getReader(), phan = []; let co = 0, lan = 0;
      for (;;) {
        const { done, value } = await rd.read(); if (done) break;
        phan.push(value); co += value.length;
        if (tong) d.p = Math.min(0.99, co / tong);
        if (Date.now() - lan > 200) { lan = Date.now(); veDl(id); }
      }
      blob = new Blob(phan, { type: kieu });
    } else blob = await r.blob();
    if (DANG[id] === d) await ghiMay(id, blob);
  } catch (e) {
    if (e.name !== 'AbortError') { console.warn('[nhac] tải về máy', e); API && API.toast(mang ? 'Tải về máy lỗi: ' + b.ten : 'Mất mạng — dừng tải'); }
  }
  if (DANG[id] === d) delete DANG[id];
  if (!Object.keys(DANG).length && MAY.has(id) && API) API.toast('Đã tải xong');
}
function dungTai(id) { const d = DANG[id]; if (!d) return; delete DANG[id]; if (d.ac) d.ac.abort(); }
async function xoaMay(id) { MAY.delete(id); try { await (await caches.open(KHO_MAY)).delete(khoaMay(id)); } catch (e) {} }
async function xoaHetMay() { Object.keys(DANG).forEach(dungTai); HANG.length = 0; MAY.clear(); try { await caches.delete(KHO_MAY); } catch (e) {} }
/* vòng tiến độ: vẽ riêng nút đó (không vẽ lại cả trang 5 lần/giây) */
const vong = (p) => `<svg class="n-vong" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#dfe5e5"/><circle cx="12" cy="12" r="10" stroke="var(--ac)" stroke-dasharray="${(62.8 * p).toFixed(1)} 63"/></svg><span class="n-dung"></span>`;
function veDl(id) { const el = TRANG && TRANG.querySelector(`.n-dl[data-dl="${id}"]`); if (el && DANG[id]) el.innerHTML = vong(DANG[id].p); }
window.addEventListener('online', () => { mang = true; ve(); });
window.addEventListener('offline', () => { mang = false; const co = Object.keys(DANG).length; Object.keys(DANG).forEach(dungTai); HANG.length = 0; if (co && API) API.toast('Mất mạng — dừng tải, có mạng lại bấm tải tiếp'); ve(); });

/* ───────── phát nhạc ───────── */
/* (v2.6.0) iPhone chỉ cho phát khi đang trong cú bấm: lần đầu phát 1 tiếng LẶNG ngay trong cú bấm để "mở khoá" AU,
   sau đó đọc tệp trong máy (bất đồng bộ) vẫn phát được. */
const LANG = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
function moKhoa() { if (daMoKhoa) return; daMoKhoa = true; try { AU.src = LANG; const p = AU.play(); if (p) p.catch(() => {}); } catch (e) {} }
async function nguon(b) {
  try {
    const r = await (await caches.open(KHO_MAY)).match(khoaMay(b.id));
    if (r) { const u = URL.createObjectURL(await r.blob()); if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = u; return u; }
  } catch (e) {}
  MAY.delete(b.id); return b.url;
}
let luotPhat = 0;
async function napNguon(b, tu) {
  const l = ++luotPhat;
  let u = b.url;
  if (MAY.has(b.id)) { moKhoa(); u = await nguon(b); }
  if (l !== luotPhat) return;                  // đã bấm bài khác trong lúc đọc tệp
  AU.src = u; if (tu) Q.tTiep = tu;
  AU.play().catch(() => {});
}
function phat(id, ds, ten) {
  const b = BAI(id); if (!b) return;
  if (!phatDuoc(id)) { API && API.toast('Bài chưa tải — cần có mạng'); return; }
  if (ds) { Q.ds = [...new Set(ds)]; Q.ten = ten || ''; Q.da.clear(); }      /* danh sách mới ⇒ vòng mới (bỏ bài trùng) */
  if (Q.shuf && ds) { const r = Q.ds.filter((x) => x !== id); tron(r); Q.ds = [id, ...r]; }
  Q.id = id; Q.tTiep = 0; Q.da.add(id);
  napNguon(b, 0);
  phien(); ve();
}
function batTat() {
  if (!Q.id) { const d = dsXem().filter((x) => phatDuoc(x.id)); if (d.length) phat(d[0].id, d.map((x) => x.id), tenXem()); return; }
  if (!AU.src || AU.src === location.href || AU.src === LANG) {
    const b = BAI(Q.id); if (!b) return;
    if (!phatDuoc(b.id)) { API && API.toast('Bài chưa tải — cần có mạng'); return; }
    napNguon(b, Q.tTiep || 0); return;
  }
  if (AU.paused) AU.play().catch(() => {}); else AU.pause();
}
const tron = (r) => { for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const duoc = (id) => !!BAI(id) && phatDuoc(id);          // bài đã xoá khỏi kho thì bỏ qua
function buoc(n) {
  if (!Q.ds.length) return;
  if (n < 0 && AU.currentTime > 4) { AU.currentTime = 0; return; }
  const N = Q.ds.length, i0 = Math.max(0, Q.ds.indexOf(Q.id));
  if (n < 0) {                                  // bài trước: lùi 1 bài như cũ (mất mạng: bỏ qua bài chưa tải)
    for (let k = 1; k < N; k++) { const id = Q.ds[(i0 - k + N) % N]; if (duoc(id)) { phat(id); return; } }
  } else {
    /* bài sau: bài kế tiếp CHƯA PHÁT trong vòng này (đi vòng qua đầu danh sách) */
    for (let k = 1; k < N; k++) { const id = Q.ds[(i0 + k) % N]; if (!Q.da.has(id) && duoc(id)) { phat(id); return; } }
    /* đã phát hết ⇒ vòng mới: tắt lặp thì dừng; trộn thì trộn lại (bài vừa nghe xếp CUỐI để không nghe lại ngay) */
    if (Q.rep === 'khong') { AU.pause(); return; }
    Q.da.clear();
    if (Q.shuf && N > 1) Q.ds = [...tron(Q.ds.filter((x) => x !== Q.id)), Q.id];
    const i1 = Q.shuf ? -1 : i0;
    for (let k = 1; k <= N; k++) { const id = Q.ds[(i1 + k + N) % N]; if ((id !== Q.id || N === 1) && duoc(id)) { phat(id); return; } }
    if (duoc(Q.id)) { phat(Q.id); return; }
  }
  AU.pause(); API && API.toast('Chưa có bài nào tải về máy');
}
AU.addEventListener('ended', () => { if (AU.src === LANG) return; if (Q.rep === 'mot') { AU.currentTime = 0; AU.play().catch(() => {}); } else buoc(1); });
['play', 'pause'].forEach((e) => AU.addEventListener(e, () => { ve(); phien(); ghiNho(); }));
AU.addEventListener('timeupdate', () => { tienDo(); if (Math.floor(AU.currentTime) % 5 === 0) ghiNho(); });
AU.addEventListener('loadedmetadata', () => { if (AU.src === LANG) return; if (Q.tTiep && AU.currentTime < 1) { AU.currentTime = Q.tTiep; Q.tTiep = 0; } tienDo(); });
AU.addEventListener('error', () => { if (AU.src === LANG || !AU.src) return; if (Q.id && API) API.toast(mang ? 'Không phát được bài này' : 'Mất mạng — bài này chưa tải về máy'); });
/* màn hình khoá / tai nghe: Media Session */
function phien() {
  const ms = navigator.mediaSession; const b = BAI(Q.id); if (!ms || !b) return;
  try {
    ms.metadata = new MediaMetadata({ title: b.ten, artist: b.ca || '', album: Q.ten || 'myMusic', artwork: [{ src: 'icon-512.png?v=2', sizes: '512x512', type: 'image/png' }] });
    ms.playbackState = AU.paused ? 'paused' : 'playing';
    ms.setActionHandler('play', () => AU.play()); ms.setActionHandler('pause', () => AU.pause());
    ms.setActionHandler('nexttrack', () => buoc(1)); ms.setActionHandler('previoustrack', () => buoc(-1));
    ms.setActionHandler('seekto', (d) => { if (d.seekTime != null) AU.currentTime = d.seekTime; });
  } catch (e) {}
}

/* ───────── thêm nhạc: đọc tên bài/ca sĩ (ID3v2) + độ dài, gửi lên ───────── */
async function docID3(file) {
  try {
    const b = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
    if (b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return {};
    const v = b[3], len = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9], o = {};
    let i = 10;
    while (i + 10 < Math.min(len + 10, b.length)) {
      const id = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
      const sz = v === 4 ? (b[i + 4] << 21) | (b[i + 5] << 14) | (b[i + 6] << 7) | b[i + 7] : (b[i + 4] << 24) | (b[i + 5] << 16) | (b[i + 6] << 8) | b[i + 7];
      if (!/^[A-Z0-9]{4}$/.test(id) || sz <= 0) break;
      if (id === 'TIT2' || id === 'TPE1') {
        const d = b.subarray(i + 11, i + 10 + sz), enc = b[i + 10];
        let s = enc === 0 ? new TextDecoder('latin1').decode(d) : enc === 3 ? new TextDecoder('utf-8').decode(d) : enc === 2 ? new TextDecoder('utf-16be').decode(d) : new TextDecoder('utf-16').decode(d);
        s = s.replace(/\u0000/g, '').trim(); if (s) o[id] = s;
      }
      i += 10 + sz;
    }
    return { ten: o.TIT2, ca: o.TPE1 };
  } catch (e) { return {}; }
}
const doDai = (file) => new Promise((ok) => { const a = new Audio(), u = URL.createObjectURL(file); a.preload = 'metadata'; a.onloadedmetadata = () => { ok(a.duration || 0); URL.revokeObjectURL(u); }; a.onerror = () => { ok(0); URL.revokeObjectURL(u); }; a.src = u; });
const DUOI = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', opus: 'audio/ogg' };
async function themNhac(files) {
  const ds = [...files].filter((f) => /^audio\//.test(f.type) || /\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name));
  if (!ds.length) { API.toast('Chỉ nhận tệp nhạc (MP3, M4A…)'); return; }
  const muc = V.xem !== 'all' && V.xem !== 'yt' ? V.xem : null;
  ds.forEach((f) => V.tai.push({ ten: f.name, pt: 0, f }));
  veTrang();
  for (const t of V.tai.slice()) {
    if (t.xong || t.dang) continue; t.dang = true;
    try {
      if (t.f.size > 25 * 1024 * 1024) throw new Error('qua-lon');
      const duoi = (t.f.name.split('.').pop() || 'mp3').toLowerCase(), kieu = /^audio\//.test(t.f.type) ? t.f.type : (DUOI[duoi] || 'audio/mpeg');
      const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const [id3, dai] = await Promise.all([docID3(t.f), doDai(t.f)]);
      const goc = t.f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim(), cat = goc.split(' - ');
      const r = await API.tai(t.f, `${id}.${duoi}`, kieu, (x) => { t.pt = x; veTai(); });
      const bai = { id, ten: id3.ten || (cat.length > 1 ? cat.slice(1).join(' - ') : goc), ca: id3.ca || (cat.length > 1 ? cat[0] : ''), dai: Math.round(dai), kb: Math.round(t.f.size / 1024), p: r.p, url: r.url, them: homNay() };
      DL.bai = DL.bai.concat([bai]);
      if (CO_MAY && CAI.tu !== false) { try { await ghiMay(id, t.f); } catch (e) {} }   /* (v2.6.0) bài mới thêm từ máy này: cất luôn vào máy */
      if (CAI.biet) CAI.biet.push(id);
      const phan = { bai: DL.bai }; if (muc && DSP(muc)) { DSP(muc).bai.push(id); phan.ds = DL.ds; }
      await API.ghi(phan);
      t.xong = true;
    } catch (e) { console.error('[nhac] gửi', e); t.loi = /qua-lon/.test(e.message) ? 'Quá 25 MB' : 'Lỗi gửi'; }
    t.dang = false; veTrang();
  }
  const loi = V.tai.filter((t) => t.loi).length, ok = V.tai.filter((t) => t.xong).length;
  API.toast(loi ? `Đã thêm ${ok} bài · ${loi} bài lỗi` : `Đã thêm ${ok} bài`);
  setTimeout(() => { V.tai = V.tai.filter((t) => !t.xong); veTrang(); }, 1500);
}

/* ───────── vẽ: thanh mini + trình phát lớn ───────── */
function ve() { veThanh(); veFull(); veTrang(); }
function tienDo() {
  const d = AU.duration || (BAI(Q.id) || {}).dai || 0, x = d ? Math.min(100, 100 * AU.currentTime / d) : 0;
  if (THANH) { const g = THANH.querySelector('.n-pg'); if (g) g.style.width = x + '%'; }
  if (FULL && V.full) { const s = FULL.querySelector('.n-sl'); if (s && !s.matches(':active')) { s.max = Math.floor(d); s.value = Math.floor(AU.currentTime); s.style.setProperty('--x', x + '%'); }
    const a = FULL.querySelector('.n-t1'); if (a) a.textContent = mmss(AU.currentTime); const b = FULL.querySelector('.n-t2'); if (b) b.textContent = mmss(d); }
}
function veThanh() {
  if (!THANH) return; const b = BAI(Q.id);
  THANH.hidden = !b; document.querySelector('.frame') && document.querySelector('.frame').classList.toggle('cophat', !!b);
  if (!b) { THANH.innerHTML = ''; return; }
  THANH.innerHTML = `<div class="n-mp" data-n="full"><span class="n-art" style="background:${mauCua(b.id)}">${ic('note')}</span>
    <div class="n-tt"><b>${esc(b.ten)}</b><span>${MAY.has(b.id) ? `<i class="n-tic">${ic('ok')}</i>Trong máy · ` : ''}${esc(b.ca || Q.ten || 'myMusic')}</span></div>
    <button data-n="prev" title="Bài trước">${ic('prev')}</button><button class="pl" data-n="pp" title="Phát / Dừng">${ic(AU.paused ? 'play' : 'pause')}</button><button data-n="next" title="Bài sau">${ic('next')}</button><i class="n-pg"></i></div>`;
  tienDo();
}
function veFull() {
  if (!FULL) return; FULL.classList.toggle('on', V.full && !!BAI(Q.id)); const b = BAI(Q.id);
  if (!b || !V.full) return;
  const d = AU.duration || b.dai || 0;
  FULL.innerHTML = `<div class="n-fhead"><button data-n="dong" title="Thu nhỏ">${ic('down')}</button><span>${esc(Q.ten || 'myMusic')}</span></div>
   <div class="n-cov" style="background:linear-gradient(140deg,${mauCua(b.id)},#0b3b35)">${ic('note')}</div>
   <h3>${esc(b.ten)}</h3><div class="n-ca">${esc(b.ca || '')}</div>
   <input type="range" class="n-sl" min="0" max="${Math.floor(d)}" value="${Math.floor(AU.currentTime)}" step="1"><div class="n-tm"><span class="n-t1">${mmss(AU.currentTime)}</span><span class="n-t2">${mmss(d)}</span></div>
   <div class="n-ctl"><button class="sm${Q.shuf ? ' on' : ''}" data-n="shuf" title="Trộn bài">${ic('shuf')}</button><button data-n="prev">${ic('prev')}</button>
    <button class="pl" data-n="pp">${ic(AU.paused ? 'play' : 'pause')}</button><button data-n="next">${ic('next')}</button>
    <button class="sm${Q.rep !== 'khong' ? ' on' : ''}" data-n="rep" title="Lặp: ${Q.rep === 'mot' ? '1 bài' : Q.rep === 'het' ? 'cả danh sách' : 'tắt'}">${ic('rep')}${Q.rep === 'mot' ? '<i class="one">1</i>' : ''}</button></div>
   ${phone ? '' : `<div class="n-vol">${ic('vol')}<input type="range" class="n-vl" min="0" max="1" step="0.05" value="${AU.volume}"></div>`}
   <div class="n-ql"><h4>Đang phát · ${Q.ds.length} bài</h4>${Q.ds.map(BAI).filter(Boolean).map((x) => `<div class="n-q${x.id === Q.id ? ' on' : ''}" data-q="${x.id}"><span class="n-sa" style="background:${mauCua(x.id)}"></span><div>${esc(x.ten)}<small>${esc(x.ca || '')}</small></div><em>${mmss(x.dai)}</em></div>`).join('')}</div>`;
  tienDo();
}

/* ───────── vẽ: trang thư viện ───────── */
function veTai() { if (!TRANG) return; const el = TRANG.querySelector('.n-tai'); if (el) el.innerHTML = taiHtml(); }
const taiHtml = () => V.tai.map((t) => `<div class="n-ti${t.loi ? ' loi' : ''}"><span>${esc(t.ten)}</span><em>${t.loi || (t.xong ? '✓' : Math.round(t.pt * 100) + '%')}</em><i style="width:${t.xong ? 100 : Math.round(t.pt * 100)}%"></i></div>`).join('');
function veTrang() {
  if (!TRANG) return;
  const list = dsXem(), d = DSP(V.xem);
  const may = DL.bai.filter((b) => MAY.has(b.id)), mbMay = Math.round(may.reduce((a, b) => a + (b.kb || 0), 0) / 1024);
  const nDang = list.filter((b) => DANG[b.id]).length, nThieu = list.filter((b) => !MAY.has(b.id) && !DANG[b.id]).length;
  const nutTai = !CO_MAY || !list.length ? '' : nDang || nThieu
    ? `<button class="n-btn tai" data-n="taids"${mang ? '' : ' disabled'}>${ic('dl')}${nDang ? `Đang tải ${nDang}…` : `Tải về ${nThieu}`}</button>`
    : `<button class="n-btn tai xong" disabled>${ic('ok')}Đã tải hết</button>`;
  const nutTh = TRANG.querySelector('[data-n="them"]'); if (nutTh) nutTh.disabled = !mang;
  const chip = (k, ten, mau) => `<button class="n-chip${V.xem === k ? ' on' : ''}" data-xem="${k}">${mau ? `<i style="background:${mau}"></i>` : ''}${esc(ten)}</button>`;
  TRANG.querySelector('.n-body').innerHTML = `
   ${mang ? '' : `<div class="n-mat">${ic('wifix')}Mất mạng · chỉ phát bài đã tải</div>`}
   <div class="n-chips">${chip('all', 'Tất cả')}${chip('yt', '♥ Yêu thích')}${CO_MAY ? chip('may', 'Đã tải') : ''}${DL.ds.map((x) => chip(x.id, x.ten, x.mau)).join('')}
    ${V.hoi === 'dsmoi' ? `<input class="n-in" id="nDsMoi" placeholder="Tên danh sách" maxlength="40">` : `<button class="n-chip add" data-n="dsmoi">${ic('plus')}Danh sách</button>`}</div>
   ${CO_MAY && DL.bai.length ? `<div class="n-may">${ic('hdd')}<div class="n-mayt">Trong máy: <b>${may.length} bài · ${mbMay} MB</b><div class="n-thanh"><i style="width:${Math.max(3, Math.round(100 * may.length / DL.bai.length))}%"></i></div></div><button data-n="ql">Quản lý</button></div>` : ''}
   <div class="n-hd"><div><h2>${esc(tenXem())}</h2><div class="n-sub">${list.length} bài${CO_MAY ? ` · ${list.filter((b) => MAY.has(b.id)).length} đã tải` : ''}</div></div>
    ${list.length ? `<button class="n-btn" data-n="phatds">${ic('play')}Phát</button><button class="n-btn gh" data-n="tronds">${ic('shuf')}Trộn</button>${nutTai}` : ''}
    ${d ? `<button class="n-ib" data-dsm="${d.id}" title="Danh sách">${ic('dots')}</button>` : ''}</div>
   ${V.tai.length ? `<div class="n-tai">${taiHtml()}</div>` : ''}
   ${!DL.san ? '<div class="n-empty">Đang tải…</div>' : list.length ? `<div class="n-list">${list.map((b, i) => `<div class="n-row${b.id === Q.id ? ' on' : ''}${phatDuoc(b.id) ? '' : ' tat'}" data-play="${b.id}">
      <span class="n-no">${b.id === Q.id && !AU.paused ? ic('note', 'width:15px;height:15px') : i + 1}</span>
      <div class="n-rt"><b>${esc(b.ten)}</b><span>${esc(b.ca || '—')}</span></div>
      <em>${mmss(b.dai)}</em>${nutDl(b)}<button class="n-ib${b.tim ? ' tim' : ''}" data-tim="${b.id}" title="Yêu thích">${ic('heart')}</button><button class="n-ib" data-bm="${b.id}" title="Thêm">${ic('dots')}</button></div>`).join('')}</div>`
    : `<div class="n-empty">${V.xem === 'may' ? 'Chưa tải bài nào — bấm ↓ cạnh bài để nghe khi không có mạng' : V.xem === 'all' ? 'Chưa có bài nào — bấm "Thêm nhạc" (điện thoại: chọn từ ứng dụng Tệp)' : 'Danh sách trống — vào "Tất cả", bấm ⋯ ở bài để thêm'}</div>`}
   ${V.menu ? menuHtml() : ''}`;
  /* (v2.6.0) bảng ⋯ ở bài cuối bị khuất dưới đáy ⇒ lật lên trên nút */
  const pop = TRANG.querySelector('.n-pop'), bd = TRANG.querySelector('.n-body');
  const day = Math.min(bd.getBoundingClientRect().bottom, innerHeight, THANH && !THANH.hidden ? THANH.getBoundingClientRect().top : innerHeight);
  if (pop && V.menu && pop.getBoundingClientRect().bottom > day - 6) pop.style.top = Math.max(bd.scrollTop + 4, V.menu.y - pop.offsetHeight - 56) + 'px';
  const i = TRANG.querySelector('#nDsMoi'); if (i) { i.focus(); i.onkeydown = (e) => { if (e.key === 'Enter') taoDs(i.value); if (e.key === 'Escape') { V.hoi = null; veTrang(); } }; i.onblur = () => setTimeout(() => { if (V.hoi === 'dsmoi') { taoDs(i.value); } }, 120); }
}
/* (v2.6.0) nút tải về máy ở mỗi bài: ↓ · vòng % (bấm = dừng) · ✓ (bấm = hỏi xoá bản trong máy) */
const nutDl = (b) => !CO_MAY ? '' : DANG[b.id] ? `<button class="n-dl" data-dl="${b.id}" title="Đang tải — bấm để dừng">${vong(DANG[b.id].p)}</button>`
  : MAY.has(b.id) ? `<button class="n-dl xong" data-dl="${b.id}" title="Đã tải về máy">${ic('okc')}</button>`
  : `<button class="n-dl" data-dl="${b.id}" title="Tải về máy">${ic('dl')}</button>`;
function menuHtml() {
  const m = V.menu;
  if (m.loai === 'bai') {
    const b = BAI(m.id); if (!b) return '';
    return `<div class="n-pop" style="top:${m.y}px"><div class="n-pt">${esc(b.ten)}</div>
     ${DL.ds.map((d) => `<button data-them="${d.id}">${d.bai.includes(b.id) ? '✓ ' : ''}${esc(d.ten)}</button>`).join('') || '<div class="n-pn">Chưa có danh sách phát</div>'}
     ${DSP(V.xem) ? `<button data-boids="${b.id}">Bỏ khỏi "${esc(DSP(V.xem).ten)}"</button>` : ''}
     ${!CO_MAY ? '' : MAY.has(b.id) ? `<button data-xoamay="${b.id}">${m.hoiMay ? 'Chắc chắn xoá bản trong máy?' : 'Xoá bản trong máy'}</button>` : `<button data-dl="${b.id}">Tải về máy</button>`}
     <button data-doiten="${b.id}">Đổi tên bài</button><button class="red" data-xoabai="${b.id}">${m.hoi ? 'Chắc chắn xoá bài?' : 'Xoá bài'}</button></div>`;
  }
  if (m.loai === 'ql') return `<div class="n-pop" style="top:${m.y}px"><div class="n-pt">Nhạc trong máy này</div>
    <button class="n-tu" data-n="tu">Tự tải bài mới thêm<span class="n-gat${CAI.tu !== false ? ' on' : ''}"></span></button>
    <button class="red" data-n="xoahet">${m.hoi ? 'Chắc chắn xoá hết?' : 'Xoá hết bản trong máy'}</button>
    <div class="n-pn">Bài vẫn còn trên kho, tải lại lúc nào cũng được</div></div>`;
  const d = DSP(m.id); if (!d) return '';
  return `<div class="n-pop" style="top:${m.y}px"><div class="n-pt">${esc(d.ten)}</div><button data-doitends="${d.id}">Đổi tên danh sách</button>
    <button class="red" data-xoads="${d.id}">${m.hoi ? 'Chắc chắn xoá danh sách?' : 'Xoá danh sách (giữ bài)'}</button></div>`;
}
function taoDs(ten) {
  ten = String(ten || '').trim(); V.hoi = null;
  if (!ten) { veTrang(); return; }
  const id = 'd' + Date.now().toString(36);
  DL.ds = DL.ds.concat([{ id, ten, mau: MAU[DL.ds.length % MAU.length], bai: [] }]); V.xem = id;
  API.ghi({ ds: DL.ds }).catch(() => API.toast('Chưa lưu được'));
  veTrang();
}

/* ───────── thao tác ───────── */
function onClick(e) {
  const T = e.target, n = T.closest('[data-n]');
  const dl = T.closest('[data-dl]');
  if (dl && TRANG && TRANG.contains(dl)) {
    e.stopPropagation(); const id = dl.dataset.dl;
    if (DANG[id]) { dungTai(id); HANG.splice(HANG.indexOf(id) >>> 0, HANG.includes(id) ? 1 : 0); API.toast('Đã dừng tải'); veTrang(); return; }
    if (MAY.has(id)) { const r = dl.getBoundingClientRect(), hr = TRANG.getBoundingClientRect(); V.menu = { loai: 'bai', id, y: r.bottom - hr.top + TRANG.querySelector('.n-body').scrollTop + 4, hoiMay: true }; veTrang(); return; }
    V.menu = null; taiMay(id); return;
  }
  const xmay = T.closest('[data-xoamay]');
  if (xmay) { if (!V.menu.hoiMay) { V.menu.hoiMay = true; veTrang(); return; } xoaMay(xmay.dataset.xoamay).then(() => { API.toast('Đã xoá bản trong máy'); ve(); }); V.menu = null; veTrang(); return; }
  if (n) {
    const k = n.dataset.n;
    if (k === 'full') { if (T.closest('button')) return; V.full = true; veFull(); return; }
    e.stopPropagation();
    if (k === 'pp') batTat(); else if (k === 'next') buoc(1); else if (k === 'prev') buoc(-1);
    else if (k === 'dong') { V.full = false; veFull(); }
    else if (k === 'shuf') { Q.shuf = !Q.shuf; if (Q.shuf && Q.ds.length > 1) { const r = tron(Q.ds.filter((x) => x !== Q.id)); Q.ds = [Q.id, ...r]; } ghiNho(); veFull(); }
    else if (k === 'rep') { Q.rep = Q.rep === 'het' ? 'mot' : Q.rep === 'mot' ? 'khong' : 'het'; ghiNho(); veFull(); API.toast(Q.rep === 'het' ? 'Lặp cả danh sách' : Q.rep === 'mot' ? 'Lặp 1 bài' : 'Tắt lặp'); }
    else if (k === 'them') { const f = TRANG && TRANG.querySelector('.n-file'); if (f) { f.value = ''; f.click(); } }
    else if (k === 'dsmoi') { V.hoi = 'dsmoi'; veTrang(); }
    else if (k === 'taids') { if (!mang) return; dsXem().forEach((b) => taiMay(b.id)); }
    else if (k === 'ql') { if (V.menu && V.menu.loai === 'ql') { V.menu = null; veTrang(); return; } const r = n.getBoundingClientRect(), hr = TRANG.getBoundingClientRect(); V.menu = { loai: 'ql', y: r.bottom - hr.top + TRANG.querySelector('.n-body').scrollTop + 4 }; veTrang(); }
    else if (k === 'tu') { CAI.tu = CAI.tu === false; luuCai(); veTrang(); API.toast(CAI.tu ? 'Bật tự tải bài mới' : 'Tắt tự tải bài mới'); }
    else if (k === 'xoahet') { if (!V.menu.hoi) { V.menu.hoi = true; veTrang(); return; } V.menu = null; xoaHetMay().then(() => { API.toast('Đã xoá hết bản trong máy'); if (V.xem === 'may') V.xem = 'all'; ve(); }); }
    else if (k === 'phatds' || k === 'tronds') { const l = dsXem(); if (!l.length) return; const giu = Q.shuf; Q.shuf = k === 'tronds'; const ids = l.map((x) => x.id), dau = Q.shuf ? ids[Math.floor(Math.random() * ids.length)] : ids[0]; phat(dau, ids, tenXem()); if (k === 'phatds') Q.shuf = giu; }
    return;
  }
  const q = T.closest('[data-q]'); if (q) { phat(q.dataset.q); return; }
  if (!TRANG || !TRANG.contains(T)) return;
  const pop = T.closest('.n-pop');
  if (!pop && V.menu && !T.closest('[data-bm],[data-dsm]')) { V.menu = null; veTrang(); return; }
  const xm = T.closest('[data-xem]'); if (xm) { V.xem = xm.dataset.xem; V.menu = null; veTrang(); return; }
  const tm = T.closest('[data-tim]'); if (tm) { const b = BAI(tm.dataset.tim); b.tim = b.tim ? 0 : 1; API.ghi({ bai: DL.bai }); veTrang(); return; }
  const bm = T.closest('[data-bm]'); if (bm) { const r = bm.getBoundingClientRect(), hr = TRANG.getBoundingClientRect(); V.menu = { loai: 'bai', id: bm.dataset.bm, y: r.bottom - hr.top + TRANG.querySelector('.n-body').scrollTop + 4 }; veTrang(); return; }
  const dsm = T.closest('[data-dsm]'); if (dsm) { const r = dsm.getBoundingClientRect(), hr = TRANG.getBoundingClientRect(); V.menu = { loai: 'ds', id: dsm.dataset.dsm, y: r.bottom - hr.top + TRANG.querySelector('.n-body').scrollTop + 4 }; veTrang(); return; }
  const th = T.closest('[data-them]'); if (th) { const d = DSP(th.dataset.them), id = V.menu.id; if (d.bai.includes(id)) d.bai = d.bai.filter((x) => x !== id); else d.bai.push(id); API.ghi({ ds: DL.ds }); API.toast(d.bai.includes(id) ? `Đã thêm vào "${d.ten}"` : `Đã bỏ khỏi "${d.ten}"`); V.menu = null; veTrang(); return; }
  const bo = T.closest('[data-boids]'); if (bo) { const d = DSP(V.xem); d.bai = d.bai.filter((x) => x !== bo.dataset.boids); API.ghi({ ds: DL.ds }); V.menu = null; veTrang(); return; }
  const dt = T.closest('[data-doiten]'); if (dt) { const b = BAI(dt.dataset.doiten); const t = prompt('Tên bài', b.ten); if (t && t.trim()) { b.ten = t.trim(); API.ghi({ bai: DL.bai }); } V.menu = null; ve(); return; }
  const dtd = T.closest('[data-doitends]'); if (dtd) { const d = DSP(dtd.dataset.doitends); const t = prompt('Tên danh sách', d.ten); if (t && t.trim()) { d.ten = t.trim(); API.ghi({ ds: DL.ds }); } V.menu = null; veTrang(); return; }
  const xb = T.closest('[data-xoabai]'); if (xb) {
    if (!V.menu.hoi) { V.menu.hoi = true; veTrang(); return; }       /* bấm 2 lần mới xoá */
    const b = BAI(xb.dataset.xoabai); V.menu = null;
    DL.bai = DL.bai.filter((x) => x !== b); DL.ds.forEach((d) => { d.bai = d.bai.filter((x) => x !== b.id); });
    if (Q.id === b.id) { AU.pause(); AU.removeAttribute('src'); Q.id = null; }
    dungTai(b.id); xoaMay(b.id);
    Q.ds = Q.ds.filter((x) => x !== b.id);
    API.ghi({ bai: DL.bai, ds: DL.ds }).then(() => API.xoa(b.p)).then(() => API.toast('Đã xoá bài'), () => API.toast('Chưa xoá được'));
    ve(); return;
  }
  const xd = T.closest('[data-xoads]'); if (xd) {
    if (!V.menu.hoi) { V.menu.hoi = true; veTrang(); return; }
    DL.ds = DL.ds.filter((d) => d.id !== xd.dataset.xoads); V.menu = null; V.xem = 'all'; API.ghi({ ds: DL.ds }); veTrang(); return;
  }
  const pl = T.closest('[data-play]'); if (pl) { if (!phatDuoc(pl.dataset.play)) { API.toast('Bài chưa tải — cần có mạng'); return; } const l = dsXem(); if (pl.dataset.play === Q.id) { batTat(); return; } phat(pl.dataset.play, l.map((x) => x.id), tenXem()); }
}
function onInput(e) {
  const t = e.target;
  if (t.classList.contains('n-sl')) { AU.currentTime = +t.value; t.style.setProperty('--x', (100 * t.value / (t.max || 1)) + '%'); }
  if (t.classList.contains('n-vl')) { AU.volume = +t.value; ghiNho(); }
}

/* ───────── nối với index.html ───────── */
export function nhacNoi(api) { API = api; }
export function nhacNap(dl) {
  DL = dl;
  if (Q.id && !BAI(Q.id)) Q.id = null;
  Q.ds = Q.ds.filter((x) => BAI(x));
  /* (v2.6.0) tự tải bài MỚI thêm (từ máy khác) về máy này — bài cũ chỉ tải khi bấm */
  if (DL.san && CO_MAY) {
    const ids = DL.bai.map((b) => b.id);
    if (!CAI.biet) { CAI.biet = ids; luuCai(); }
    else { const moi = ids.filter((x) => !CAI.biet.includes(x)); CAI.biet = ids; luuCai(); if (CAI.tu !== false && mang) moi.forEach(taiMay); }
  }
  ve();
}
/* thanh mini (trong .main, trên thanh dưới) + trình phát lớn (phủ .app) — gắn lại sau mỗi lần index vẽ khung */
export function nhacGanThanh(bar, full, opt) {
  phone = !!(opt && opt.dev === 'phone');
  THANH = bar; FULL = full;
  if (bar && !bar._n) { bar._n = 1; bar.addEventListener('click', onClick); }
  if (full && !full._n) { full._n = 1; full.addEventListener('click', onClick); full.addEventListener('input', onInput); }
  veThanh(); veFull();
}
export function nhacGanTrang(host, opt) {
  phone = !!(opt && opt.dev === 'phone');
  host.innerHTML = `<div class="nmus${phone ? ' phone' : ''}"><div class="n-top"><h1>myMusic</h1><button class="n-btn" data-n="them">${ic('plus')}Thêm nhạc</button>
     <input type="file" class="n-file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac" multiple hidden></div><div class="n-body"></div></div>`;
  const root = host.firstElementChild; TRANG = root;
  root.addEventListener('click', onClick);
  root.querySelector('.n-file').addEventListener('change', (e) => { if (e.target.files.length) themNhac(e.target.files); });
  /* máy tính: kéo-thả tệp nhạc vào trang */
  root.addEventListener('dragover', (e) => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); root.classList.add('keo'); } });
  root.addEventListener('dragleave', (e) => { if (!root.contains(e.relatedTarget)) root.classList.remove('keo'); });
  root.addEventListener('drop', (e) => { e.preventDefault(); root.classList.remove('keo'); if (e.dataTransfer.files.length) themNhac(e.dataTransfer.files); });
  veTrang();
  return { host, huy() { if (TRANG === root) TRANG = null; } };
}
export function nhacDong() { AU.pause(); AU.removeAttribute('src'); DL = { san: false, bai: [], ds: [] }; Q.id = null; Q.ds = []; V.full = false; TRANG = null; ve(); }
