// mylink-ui.js - MODULE UI dung lai duoc. initMyLink(container, api, opts) dung toan bo giao dien
// (cot ngay + cot lop + settings + toast) vao `container`, noi voi `api`:
//   api = { list, save, onChanged?, openExternal?, fetchTitle?, status?, findAwordFolder?, openLessonFolder? }
// Dung cho: app myLink standalone (adapter window.mylink) VA pop-up trong myActivity (adapter
// window.myactivity) - chung Task.json. opts.chrome=false: KHONG ve thanh toolbar noi bo (app tu lo).
// Tra ve handle { refresh, openSettings, closeSettings, destroy }.
import { generateName, isFilePath, stripQuotes } from './namer.js';

const WD_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WD_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_COLS = [1, 2, 3, 4, 5, 6, 0]; // MON..SUN
const DAYS_W_KEY = 'mylink-days-w';
// v0.17.0: chữ báo TẠM trên ô link khi mã gõ ở ô Open Link chưa có act AWord — chỉ trên giao diện,
// KHÔNG lưu vào Task.json (mất khi gõ mã khác / đổi ngày / tải lại app). Xem GHI CHU v0.17.0.
const NO_ACTS_TEXT = 'No acts found';
// v0.18.0: dạng MÃ BÀI (vd LSB1-S1.T1.P2) — CHÉP từ RE_LESSON_CODE trong src/main/lib/ma-bai.js,
// sửa một bên phải sửa bên kia. Dùng nhận ra mã dán nhầm vào ô link.
const RE_MA_BAI = /^([A-Za-z0-9]+)-S(\d+)((?:\.[A-Za-z0-9+-]+)*)$/i;

const pad2 = (n) => String(n).padStart(2, '0');
const dateKey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const keyToDate = (k) => { const p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const todayKey = () => dateKey(new Date());
// v0.16.0: chuỗi hoá ỔN ĐỊNH — sắp KHOÁ OBJECT theo alphabet trước khi nối chuỗi (mảng giữ NGUYÊN
// thứ tự, thứ tự đó có nghĩa thật). ⛔ BẪY ĐÃ CẮN THẬT: bản từ Firestore (REST trả khoá bản đồ theo
// thứ tự ĐÃ SẮP XẾP) và bản từ file JSON (giữ thứ tự lúc ghi) có thể CÙNG NỘI DUNG nhưng KHÁC thứ
// tự khoá — `JSON.stringify` thẳng so ra LỆCH OAN, khiến `onExternalChange` tưởng "app khác vừa
// sửa" ngay sau khi CHÍNH MÌNH vừa lưu xong ⇒ toast "Synced from another app" giả mỗi lần thao tác.
function stableStringify(v) {
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}
const canon = (t) => stableStringify({ classes: t.classes || [], schedule: t.schedule || {}, board: t.board || {}, names: t.names || {} });

// Mũi tên (chevron hiện đại) + logo myLink (checklist) — stroke Lucide.
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
// Mũi tên LÊN (đổi vị trí link lên 1 bậc) — arrow-up Lucide.
const ARROW_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';
const LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m6.5 8.5 1.2 1.2 2-2.2"/><path d="M13 8.5h4.5"/><path d="m6.5 15 1.2 1.2 2-2.2"/><path d="M13 15h4.5"/></svg>';
const THEMES = ['default', 'light', 'dark'];
// Thêm https:// nếu link thiếu scheme (vd "tinhte.vn" -> "https://tinhte.vn"). v0.9.9: đường dẫn
// FILE cục bộ (ổ đĩa/UNC) giữ NGUYÊN, không phải URL nên không được gán scheme https://.
// v0.9.10: BÓC dấu " ở 2 đầu TRƯỚC MỌI phép xét — Explorer "Copy as path" trả về đường dẫn bọc dấu
// nháy kép, không bóc thì isFilePath trượt ngay ký tự đầu → bị gán https:// → mở ra TRANG WEB.
function normalizeUrl(u) { u = stripQuotes(u); if (!u) return ''; if (isFilePath(u)) return u; if (!/:\/\//.test(u)) u = 'https://' + u; return u; }
function applyTheme(t) { const r = document.documentElement; if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme'); }
// v0.6.0: link ĐÃ TÍCH thu gọn -> chỉ hiện TÊN; chưa có tên thì hiện URL rút gọn (bỏ scheme/www).
function shortUrl(u) { return String(u || '').replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, ''); }
// v0.6.0: mọi animation đều tôn trọng cài đặt giảm chuyển động của Windows.
function reduceMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } }

export function initMyLink(container, api, opts = {}) {
  const withChrome = opts.chrome !== false;
  container.classList.add('ml-root');
  container.innerHTML = template(withChrome);
  const q = (sel) => container.querySelector(sel);

  // ---------- state ----------
  let tasks = { wordwall: [], classes: [], schedule: {}, board: {}, names: {} };
  let selectedKey = todayKey();
  let lastCanon = '';
  let saveTimer = null;
  let pendingExternal = false;
  let rendering = false; // true trong lúc renderClasses -> blur bỏ qua commit (tránh revert model)
  const extraNote = new Map(); // reserved
  const namesLoading = new Set();
  const dayCellEls = new Map();
  let markerEl = null;   // v0.8.0: khoi mau "dai chon" truot giua cac ngay

  // ---------- helpers ----------
  function ensureCell(key, cls) {
    if (!tasks.board[key]) tasks.board[key] = {};
    if (!tasks.board[key][cls]) tasks.board[key][cls] = { links: [], done: false, checked: [] };
    return tasks.board[key][cls];
  }
  function hasLinks(db) {
    return db && Object.values(db).some((c) => c && Array.isArray(c.links) && c.links.length > 0);
  }
  function classesForDay(key) {
    const wd = String(keyToDate(key).getDay());
    const scheduled = Array.isArray(tasks.schedule[wd]) ? tasks.schedule[wd] : [];
    const inBoard = tasks.board[key] ? Object.keys(tasks.board[key]) : [];
    const set = new Set([...scheduled, ...inBoard]);
    const ordered = (tasks.classes || []).filter((c) => set.has(c));
    const extras = [...set].filter((c) => !(tasks.classes || []).includes(c));
    return [...ordered, ...extras];
  }
  function dayFlags(key) {
    const db = tasks.board[key] || {};
    let has = false, pending = false;
    for (const c of Object.values(db)) {
      if (c && Array.isArray(c.links) && c.links.length > 0) { has = true; if (!c.done) pending = true; }
    }
    return { has, allDone: has && !pending };
  }

  // ---------- bang bao TRANG THAI KHO (v0.14.1) ----------
  // VI SAO CO: 07/09/2026 thay bao "myLink mat sach du lieu". That ra kho van con nguyen, may nay
  // chi mat khoa `firebase-admin.json` nen app lui ve doc file luu tam — va KHONG NOI MOT CHU NAO
  // (`conMang()` co san tu v0.10.0 nhung khong ai hoi toi). Man hinh trong = thay tuong mat sach.
  // Tu nay: chay bang file luu tam thi phai HIEN RO, kem viec can lam.
  async function capNhatBangTrangThai() {
    const el = q('.ml-banner'); if (!el || !api.status) return;
    let st = null;
    try { st = await api.status(); } catch (_) { return; }
    // LUAT HIEN/AN — GIONG HET `dai-bao.js` cua myBoard/myTeam/myActivity, sua la sua ca bon:
    // khoe = CO khoa VA con duong ra kho. `null` = ban main cu chua co IPC -> im lang nhu truoc.
    if (!st || (st.coKhoa && st.conMang)) { el.hidden = true; return; }
    el.textContent = st.coKhoa
      ? 'Mất kết nối kho dữ liệu — đang xem bản lưu tạm. Sửa lúc này chỉ nằm trên máy cho tới khi có mạng lại.'
      : 'Chưa có khoá Firebase trên máy này — đang xem bản lưu tạm. Chạy CAI KHOA FIREBASE.bat (thư mục _KHOA trên ổ D).';
    el.hidden = false;
  }

  // ---------- toast ----------
  let toastT = null;
  function toast(msg) {
    const t = q('.ml-toast'); t.textContent = msg; t.hidden = false;
    t.classList.remove('out'); t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); // trượt lên + hiện dần
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      t.classList.remove('in'); t.classList.add('out');
      setTimeout(() => { t.hidden = true; t.classList.remove('out'); }, 200);
    }, 1700);
  }

  // ---------- save + sync ----------
  function cleanEmptyCells() {
    for (const day of Object.keys(tasks.board)) {
      const db = tasks.board[day];
      for (const cls of Object.keys(db)) {
        const c = db[cls];
        const empty = !c || !Array.isArray(c.links) || c.links.length === 0;
        if (empty && !(c && c.done)) delete db[cls];
      }
      if (Object.keys(db).length === 0) delete tasks.board[day];
    }
  }
  // v0.9.10: TỰ DỌN dữ liệu đã lỡ lưu BẨN — link dán bằng Explorer "Copy as path" bị bọc dấu " ở 2
  // đầu (bản trước v0.9.10 lưu nguyên). Chạy MỖI LẦN đọc từ đĩa, chỉ ghi lại khi thật sự có đổi.
  // `checked` là mảng CHỈ SỐ nên dọn chuỗi KHÔNG làm lệch tick (không đảo/không thêm bớt phần tử).
  function sanitizeTasks(t) {
    let changed = false;
    for (const db of Object.values(t.board || {})) {
      for (const cell of Object.values(db || {})) {
        if (!cell || !Array.isArray(cell.links)) continue;
        cell.links = cell.links.map((u) => { const c = stripQuotes(u); if (c !== u) changed = true; return c; });
      }
    }
    // Tên cache theo khóa BẨN là tên RÁC (slug của chuỗi có dấu ", vd '"D:\5. READING\3. DAILY...').
    // Bỏ hẳn để ensureName đặt lại theo khóa SẠCH (ra 'SLIDE 1.PPTX').
    const names = t.names || {};
    for (const k of Object.keys(names)) {
      if (stripQuotes(k) === k) continue;
      delete names[k]; changed = true;
    }
    return changed;
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 300); }
  // v0.16.0: ghi nhận "bản đã lưu" NGAY bằng chính `tasks` vừa gửi đi — KHÔNG đọc lại kho để xác
  // nhận (đo thật: mỗi lần lưu tốn thêm 1-2 lượt đọc chỉ để lấy lại đúng thứ mình vừa gửi). Chỉ ghi
  // nhận khi `api.save` THẬT SỰ báo thành công (`{ok:true}` hoặc không trả gì — API cũ); báo lỗi thì
  // GIỮ mốc cũ để `onExternalChange` còn phát hiện đúng khi kho thật sự khác, không tưởng đã lưu rồi
  // lỡ ghi đè mất bản đang sửa dở.
  async function doSave() {
    cleanEmptyCells();
    let ok = true;
    try { const r = await api.save(tasks); ok = !r || r.ok !== false; } catch (_) { ok = false; }
    if (ok) lastCanon = canon(tasks);
  }
  function isEditing() {
    const a = document.activeElement;
    return !!(a && a.tagName === 'INPUT' && container.contains(a));
  }
  async function onExternalChange() {
    if (container.offsetParent === null) return; // pop-up đang ẩn -> bỏ qua (đỡ tốn tài nguyên)
    let disk; try { disk = await api.list(); } catch (_) { return; }
    if (!disk || canon(disk) === lastCanon) return;
    if (isEditing()) { pendingExternal = true; return; }
    tasks = disk;
    if (sanitizeTasks(tasks)) scheduleSave();   // v0.9.10: dọn link bọc dấu " của bản cũ
    lastCanon = canon(tasks);
    renderDays(); renderClasses(); capNhatBangTrangThai();
    toast('Synced from another app');
  }

  // ---------- LEFT: days (unlimited history) ----------
  function buildDayKeys() {
    const t = new Date();
    const base = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const always = new Set();
    for (let i = -6; i <= 7; i++) always.add(dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)));
    const dataDays = Object.keys(tasks.board).filter((k) => hasLinks(tasks.board[k]) && !always.has(k));
    return [...new Set([...always, ...dataDays])].sort();
  }
  function updateDayDot(key) {
    const el = dayCellEls.get(key); if (!el) return;
    const f = dayFlags(key);
    el.classList.toggle('has-content', f.has);
    el.classList.toggle('all-done', f.allDone);
  }
  function renderDays() {
    const list = q('.ml-days-list'); list.innerHTML = ''; dayCellEls.clear();
    // v0.8.0: DAI CHON = 1 khoi duy nhat truot giua cac ngay (thay vi moi o tu to nen -> doi phut).
    // Dung lai sau moi lan dung danh sach vi innerHTML='' da xoa khoi cu.
    markerEl = document.createElement('div'); markerEl.className = 'ml-day-marker'; markerEl.hidden = true;
    list.appendChild(markerEl);
    const tk = todayKey();
    for (const key of buildDayKeys()) {
      const d = keyToDate(key);
      const cell = document.createElement('div');
      cell.className = 'ml-day';
      if (key === tk) cell.classList.add('today');
      if (key === selectedKey) cell.classList.add('selected');
      const f = dayFlags(key);
      if (f.has) cell.classList.add('has-content');
      if (f.allDone) cell.classList.add('all-done');
      const wd = document.createElement('span'); wd.className = 'ml-d-wd'; wd.textContent = WD_SHORT[d.getDay()];
      const dt = document.createElement('span'); dt.className = 'ml-d-date'; dt.textContent = pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
      cell.appendChild(wd); cell.appendChild(dt);
      if (key === tk) { const tag = document.createElement('span'); tag.className = 'ml-d-today'; tag.textContent = 'Today'; cell.appendChild(tag); }
      else { const dot = document.createElement('span'); dot.className = 'ml-d-dot'; cell.appendChild(dot); }
      cell.addEventListener('click', () => selectDay(key));
      list.appendChild(cell); dayCellEls.set(key, cell);
    }
    moveMarker(false);   // dung lai danh sach -> dat TUC THI (khong truot tu dau danh sach)
    centerSelected();
  }
  // Dua dai chon toi o dang chon. animate=false -> dat tuc thi (tat transition + ep reflow dong bo).
  // KHONG dung requestAnimationFrame: cua so an o tray thi rAF treo -> dai chon se KET sai cho.
  function moveMarker(animate) {
    if (!markerEl) return;
    const el = dayCellEls.get(selectedKey);
    if (!el) { markerEl.hidden = true; return; }
    const smooth = animate && !reduceMotion();
    if (!smooth) { markerEl.classList.add('ml-no-anim'); void markerEl.offsetWidth; }
    markerEl.hidden = false;
    markerEl.style.height = el.offsetHeight + 'px';
    markerEl.style.transform = 'translateY(' + el.offsetTop + 'px)';
    if (!smooth) { void markerEl.offsetWidth; markerEl.classList.remove('ml-no-anim'); }
  }
  function centerSelected(smooth) {
    const el = dayCellEls.get(selectedKey) || dayCellEls.get(todayKey());
    const list = q('.ml-days-list'); if (!el || !list) return;
    const top = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
    if (smooth && !reduceMotion() && list.scrollTo) list.scrollTo({ top, behavior: 'smooth' });
    else list.scrollTop = top;
  }
  function selectDay(key) {
    if (selectedKey === key) return;
    const goingDown = key > selectedKey;   // danh sách ngày sắp TĂNG DẦN -> key lớn hơn = ô ở DƯỚI
    selectedKey = key;
    for (const [k, el] of dayCellEls) el.classList.toggle('selected', k === key);
    moveMarker(true);          // v0.8.0: dai chon TRUOT tu ngay cu sang ngay moi
    centerSelected(true);
    renderClasses();
    // v0.9.0: cột lớp TRƯỢT THEO HƯỚNG chọn ngày — chọn ngày ở DƯỚI thì nội dung dâng từ dưới lên,
    // chọn ngày ở TRÊN thì đổ từ trên xuống (keyframes: trạng thái tĩnh vẫn là trạng thái ĐÚNG).
    const wrap = q('.ml-classes-list');
    if (wrap && !reduceMotion()) {
      wrap.classList.remove('ml-swap-up', 'ml-swap-down');
      void wrap.offsetWidth;   // ép reflow ĐỒNG BỘ (không rAF) để animation chạy lại từ đầu
      wrap.classList.add(goingDown ? 'ml-swap-up' : 'ml-swap-down');
    }
  }

  // ---------- RIGHT: classes -> single-growing link boxes ----------
  function renderClasses() {
    // CỜ chống revert: xóa DOM cũ có thể hủy 1 input đang focus -> kích hoạt 'blur' -> commitCard
    // đọc DOM CŨ và ghi đè model (mất reorder/tick). Trong lúc render, blur bỏ qua commit.
    rendering = true;
    try {
      const d = keyToDate(selectedKey);
      q('.ml-day-title').innerHTML = WD_FULL[d.getDay()] +
        ' <small>' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + '</small>';
      const wrap = q('.ml-classes-list'); wrap.innerHTML = '';
      const list = classesForDay(selectedKey);
      if (list.length === 0) {
        const hint = document.createElement('div'); hint.className = 'ml-empty';
        hint.innerHTML = 'No classes scheduled for this day.<br>Open <b>Settings</b> (&#9881;) to assign classes to weekdays.';
        wrap.appendChild(hint); return;
      }
      for (const cls of list) wrap.appendChild(buildCard(selectedKey, cls));
    } finally {
      rendering = false;
      fitAllNames();   // v0.9.0: đo SAU khi đã gắn vào DOM mới biết nút rộng bao nhiêu
    }
  }

  // v0.5.2: 'checked' = mảng CHỈ SỐ (index trong links) thay vì URL — 2 link TRÙNG URL vẫn tick/
  // di chuyển độc lập từng hàng. Migrate dữ liệu cũ (URL string) -> index lần đầu gặp.
  function normalizeChecked(cell) {
    const links = Array.isArray(cell.links) ? cell.links : [];
    const src = Array.isArray(cell.checked) ? cell.checked : [];
    const out = new Set();
    for (const v of src) {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < links.length) out.add(v);
      else if (typeof v === 'string') { const i = links.indexOf(v); if (i >= 0) out.add(i); }
    }
    return [...out].sort((a, b) => a - b);
  }

  function buildCard(key, cls) {
    const cell = (tasks.board[key] && tasks.board[key][cls]) || { links: [], done: false, checked: [] };
    const links = Array.isArray(cell.links) ? cell.links : [];
    const checked = normalizeChecked(cell);
    const done = !!cell.done;
    const card = document.createElement('div');
    card.className = 'ml-card' + (done ? ' done' : '');
    card.dataset.key = key; card.dataset.cls = cls;

    const head = document.createElement('div'); head.className = 'ml-card-head';
    const tick = document.createElement('button'); tick.className = 'ml-tick';
    tick.innerHTML = done ? '&#10003;' : ''; tick.title = done ? 'Mark not done' : 'Mark done';
    tick.addEventListener('click', () => toggleDone(key, cls));
    const name = document.createElement('span'); name.className = 'ml-card-name'; name.textContent = cls;

    if (done) {
      // TÍCH TẠI CHỖ: header y hệt lúc chưa done (name · count · tick góc phải), chỉ thu gọn body
      const cnt = document.createElement('span'); cnt.className = 'ml-card-count'; cnt.textContent = links.length + ' link' + (links.length === 1 ? '' : 's');
      head.appendChild(tick); head.appendChild(name); head.appendChild(cnt);
      card.appendChild(head); return card;
    }
    const cnt = document.createElement('span'); cnt.className = 'ml-card-count';
    cnt.textContent = links.length ? links.length + ' link' + (links.length === 1 ? '' : 's') : '';
    head.appendChild(tick); head.appendChild(name); head.appendChild(cnt);
    card.appendChild(head);

    const body = document.createElement('div'); body.className = 'ml-card-body';
    // v0.6.0: THỨ TỰ HIỂN THỊ = [chưa tick (thứ tự gốc)] + ô trống + [đường kẻ] + [đã tick (thứ tự
    // gốc)]. `links` trong Task.json GIỮ NGUYÊN thứ tự gốc (mỗi hàng nhớ chỉ số gốc ở data-idx) nên
    // bỏ tick là link về đúng chỗ cũ, và myActivity đọc `links` không bị đảo.
    const idxAll = links.map((_, i) => i);
    const idxOpen = idxAll.filter((i) => !checked.includes(i));
    const idxDone = idxAll.filter((i) => checked.includes(i));
    idxOpen.forEach((i, n) => { body.appendChild(buildLinkRow(links[i], card, { idx: i, checked: false, first: n === 0 })); ensureName(links[i]); });
    body.appendChild(buildLinkRow('', card, { trailing: true })); // LUON 1 o trong o cuoi nhom chua tick
    if (idxDone.length) { const hr = document.createElement('div'); hr.className = 'ml-links-divider'; body.appendChild(hr); } // kẻ ngăn khi có link đã tick
    idxDone.forEach((i) => { body.appendChild(buildLinkRow(links[i], card, { idx: i, checked: true })); ensureName(links[i]); }); // lazy dat ten link cu
    card.appendChild(body);
    return card;
  }

  // v0.9.9: api.openExternal nay tra ve Promise<string|null> (loi mo FILE cuc bo, neu co) - bao bang toast.
  async function openRow(row) {
    const u = normalizeUrl(row.dataset.url);
    if (!u || !api.openExternal) return;
    try { const err = await api.openExternal(u); if (err) toast('Could not open: ' + err); } catch (_) {}
  }
  // v0.15.0: double-click nút TÊN -> mở thư mục ổ D chứa file gốc. Đọc mã bài từ chính CHỮ đang
  // hiện trên tên (mã gõ thẳng kiểu mới HOẶC tên dịch dài kiểu cũ namer.js — xem ma-bai.js phía
  // main, đọc được cả hai). Không có khả năng này (myActivity) hoặc tên không phải mã bài -> coi như
  // double-click không có gì thêm, đã mở link ở lượt click đầu rồi nên không cần làm gì nữa.
  async function openRowFolder(row) {
    if (typeof api.openLessonFolder !== 'function') return;
    const url = row.dataset.url;
    const text = tasks.names[url] || '';
    if (!text) return;
    let res = null;
    try { res = await api.openLessonFolder(text); } catch (_) {}
    if (!res || !res.ok) {
      if (res && res.reason === 'khong-tim-thay') toast('No matching folder on D: for this code');
      return; // 'khong-phai-ma' -> tên không đọc ra mã bài, im lặng (đã mở link ở click đơn rồi)
    }
    if (!res.exact) toast('Opened nearest folder — no sub-folder for this code yet');
  }

  // ---------- v0.16.0: ĐÚP CHUỘT PHẢI = COPY (ô link -> copy link, nút tên -> copy tên) ----------
  // Chuột phải KHÔNG được vào chế độ sửa / hiện menu mặc định — chỉ đúp mới copy, đúp trong khoảng
  // 500ms; đúp thứ 2 KHÔNG tính là bắt đầu một cặp mới (giữ mốc = 0 sau khi đã tính là đúp).
  async function copyToClipboard(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) {}
    try {
      // Dự phòng: máy/CSP chặn Clipboard API hiện đại -> textarea ẩn + execCommand kiểu cũ.
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0'; ta.style.left = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) { return false; }
  }
  function wireDblRightClickCopy(el, getText, label) {
    let lanTruoc = 0;
    el.addEventListener('mousedown', (e) => { if (e.button === 2) e.preventDefault(); }); // chuot phai: khong focus/khong vao che do sua
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // khong hien menu chuot phai mac dinh cua Electron/Chromium
      const gio = Date.now();
      if (gio - lanTruoc < 500) {
        lanTruoc = 0;
        const text = getText();
        if (!text) return;
        copyToClipboard(text).then((ok) => toast(ok ? 'Copied ' + label : 'Could not copy'));
      } else {
        lanTruoc = gio;
      }
    });
  }
  // Nhãn trên NÚT TÊN: v0.9.0 nút tên luôn có chữ (chưa đặt tên xong -> URL rút gọn) vì nút chiếm
  // 40% chiều ngang cố định, để trống nhìn như lỗi.
  function labelFor(url) {
    if (!url) return '';
    const n = tasks.names[url];
    if (n) return n;
    return namesLoading.has(url) ? '...' : shortUrl(url);
  }
  // ---------- v0.9.0: NÚT TÊN rộng bằng nhau -> tên dài thì CO CHỮ cho vừa (không cắt "...") ----------
  const NAME_FS_MAX = 11, NAME_FS_MIN = 7;
  function fitName(btn) {
    if (!btn || !btn.textContent) return;
    btn.style.fontSize = ''; btn.style.letterSpacing = '';
    const room = btn.clientWidth;
    if (!room) return;                       // chưa gắn vào DOM / đang ẩn -> đo sau
    let fs = NAME_FS_MAX;
    while (btn.scrollWidth > room + 1 && fs > NAME_FS_MIN) {
      fs -= 0.5;
      btn.style.fontSize = fs + 'px';
      btn.style.letterSpacing = (fs <= 9.5 ? '-.2px' : '');   // nhỏ hơn nữa thì kéo chữ gần lại
    }
  }
  function fitAllNames() { for (const b of container.querySelectorAll('.ml-name')) fitName(b); }
  function buildLinkRow(url, card, o = {}) {
    const trailing = !!o.trailing;
    const isChecked = !!o.checked;
    const isFirst = !!o.first;
    const row = document.createElement('div');
    row.className = 'ml-link-row' + (trailing ? ' trailing' : '') + (isChecked ? ' checked' : '');
    row.dataset.url = url || '';
    if (!trailing) row.dataset.idx = String(o.idx); // CHỈ SỐ GỐC trong `links` -> commit giữ thứ tự gốc

    // TÊN LINK — v0.9.0: NÚT TÊN nằm NGAY SAU ô nhập link trên CÙNG 1 hàng (ô link 60% / nút tên 40%
    // của phần giữa), chữ XANH LÁ. Đã tick: nút trải rộng thay cho ô input (thu gọn như cũ).
    // Bấm nút = mở link (trong myActivity thì mở ngay trong app để chơi).
    const nm = document.createElement('button'); nm.type = 'button'; nm.className = 'ml-name';
    nm.textContent = labelFor(url);
    nm.title = 'Open link';
    // Không có link -> GIỮ CHỖ (visibility) để ô nhập của mọi hàng thẳng cột, nút tên đều nhau.
    nm.style.visibility = url ? 'visible' : 'hidden';
    // v0.15.0: có khả năng mở thư mục -> click ĐƠN mở link (chờ ~260ms phòng click thứ 2), click ĐÚP
    // mở thư mục thay vì mở link. Không có khả năng đó (myActivity) -> giữ NGUYÊN hành vi cũ (mở
    // link ngay lập tức, không có gì chờ).
    if (typeof api.openLessonFolder === 'function') {
      let ngoiCho = null;
      nm.addEventListener('click', (e) => {
        if (e.detail > 1) return; // cú click thứ 2 của double-click -> để 'dblclick' bên dưới lo
        clearTimeout(ngoiCho);
        ngoiCho = setTimeout(() => openRow(row), 260);
      });
      nm.addEventListener('dblclick', () => { clearTimeout(ngoiCho); openRowFolder(row); });
    } else {
      nm.addEventListener('click', () => openRow(row));
    }
    // v0.16.0: ĐÚP CHUỘT PHẢI vào nút tên -> copy đúng CHỮ đang hiển thị (không đụng click trái ở trên).
    wireDblRightClickCopy(nm, () => nm.textContent, 'name');

    const open = document.createElement('button'); open.className = 'ml-open'; open.innerHTML = CHEVRON; open.title = 'Open';
    open.style.visibility = url ? 'visible' : 'hidden';
    open.addEventListener('click', () => openRow(row));

    // v0.15.0: class RIÊNG để phân biệt với ô gõ MÃ BÀI (.ml-code-input) khi cả hai cùng có mặt
    // trên hàng trailing — commitCard/kebab/focusTrailing phải nhắm ĐÚNG ô này, không phải ô mã.
    const input = document.createElement('input'); input.type = 'text'; input.className = 'ml-link-input';
    input.placeholder = trailing ? '+ Add a link' : 'Paste link...';
    input.value = url || ''; input.spellcheck = false;
    // v0.16.0: ĐÚP CHUỘT PHẢI vào ô link -> copy LINK, KHÔNG vào chế độ sửa (mousedown chuột phải
    // bị chặn focus ở trên). Hàng trailing rỗng thì im lặng (copyToClipboard tự bỏ qua chuỗi rỗng).
    wireDblRightClickCopy(input, () => input.value, 'link');
    // v0.17.0: đúp CHUỘT TRÁI vào ô link CHỈ khi đang báo "No acts found" (ô rỗng, chưa có link thật)
    // -> mở trình duyệt tới aword.andrewclasses.com để thầy tự tạo act. Ô đã có link/chữ thật thì
    // giữ nguyên hành vi mặc định (bôi đen chọn chữ), không đụng gì.
    input.addEventListener('dblclick', () => {
      if (input.value || !input.classList.contains('ml-no-acts')) return;
      if (api.openExternal) api.openExternal('https://aword.andrewclasses.com/');
    });

    // MŨI TÊN LÊN — đẩy HÀNG này lên 1 bậc (link đầu tiên -> disable). Theo HÀNG, không theo URL
    // (2 link trùng URL vẫn đúng hàng). Thay cho kéo-thả.
    // Mũi tên ↑ chỉ dùng cho nhóm CHƯA tick (nhóm đã tick giữ thứ tự gốc, không sắp lại).
    const up = document.createElement('button'); up.type = 'button'; up.className = 'ml-up'; up.innerHTML = ARROW_UP;
    up.title = 'Move up'; up.style.visibility = (trailing || isChecked) ? 'hidden' : 'visible';
    if (isFirst) up.disabled = true;
    up.addEventListener('click', () => moveRowUp(card, row));

    // TICK — bật/tắt class 'checked' trên CHÍNH HÀNG này rồi render lại: hàng thu gọn còn TÊN và
    // trượt (FLIP) xuống dưới đường kẻ; bỏ tick thì trượt về đúng chỗ cũ theo chỉ số gốc.
    const tick = document.createElement('button'); tick.type = 'button';
    tick.className = 'ml-link-tick' + (isChecked ? ' on' : ''); tick.innerHTML = isChecked ? '&#10003;' : '';
    tick.title = isChecked ? 'Unmark' : 'Mark used'; tick.style.visibility = trailing ? 'hidden' : 'visible';
    tick.addEventListener('click', () => {
      if (trailing || !input.value.trim()) return;
      const on = row.classList.toggle('checked');
      tick.classList.toggle('on', on); tick.innerHTML = on ? '&#10003;' : ''; tick.title = on ? 'Unmark' : 'Mark used';
      commitCard(card, { rerender: true, flip: true });
    });

    const kebab = document.createElement('button'); kebab.type = 'button'; kebab.className = 'ml-kebab';
    kebab.innerHTML = '&#8942;'; kebab.title = 'More'; kebab.style.visibility = trailing ? 'hidden' : 'visible';
    kebab.addEventListener('click', (e) => { e.stopPropagation(); openLinkMenu(row, card); });

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commitCard(card, { rerender: true, focusTrailing: true, flip: true }); } });
    input.addEventListener('blur', () => { if (rendering) return; commitCard(card, { rerender: false }); }); // bỏ qua blur do re-render (tránh revert)
    // v0.17.0: thầy tự gõ/dán thẳng vào ô link trong lúc đang báo "No acts found" -> dọn trạng thái
    // đó ngay (tránh đúp-chuột lần sau đọc nhầm chữ TỪ MÃ CŨ đã không còn khớp).
    input.addEventListener('input', () => { if (input.classList.contains('ml-no-acts')) { input.classList.remove('ml-no-acts'); input.placeholder = trailing ? '+ Add a link' : 'Paste link...'; } });

    // v0.15.0: Ô "Open Link" gõ MÃ BÀI — CHỈ ở hàng trailing (chưa có link) và CHỈ khi app cho khả
    // năng tra AWord (myActivity không truyền -> module tự tắt, không đổi hành vi bên đó).
    // v0.17.0 — 3 cử chỉ TRÊN CÙNG Ô (thầy chốt 15/9/2026, xem GHI CHU v0.17.0):
    //   Enter        -> tra AWord, có thì điền `input` (ô dán link) + commit (như tự dán link),
    //                   KHÔNG tự mở trình duyệt — hành vi CŨ, giữ nguyên.
    //   Click NHANH  -> coi như "mở AWord": tra AWord, có thì điền+commit RỒI mở thẳng trình duyệt;
    //                   KHÔNG có act -> ô rung đỏ + `.ml-link-input` đổi placeholder thành
    //                   "No acts found" (chỉ TẠM trên giao diện, không lưu — mất khi gõ mã khác/
    //                   đổi ngày/tải lại app). Gõ mã dù CHƯA có act vẫn được — không khoá ô.
    //   Bấm GIỮ      -> thầy chốt "bấm giữ sẽ sửa được": giữ chuột ≥350ms trước khi thả thì KHÔNG
    //                   tính là click-mở (chỉ đặt con trỏ để gõ/sửa chữ giữa ô).
    //   Double-click -> mở THƯ MỤC ổ D theo đúng mã đang gõ (MB.resolveAndFind qua
    //                   api.openLessonFolder), HOÀN TOÀN không cần act AWord tồn tại — hủy lượt
    //                   click-mở đang chờ (giống mẫu nút TÊN .ml-name ở trên).
    let codeInput = null;
    if (trailing && typeof api.findAwordFolder === 'function') {
      codeInput = document.createElement('input'); codeInput.type = 'text'; codeInput.className = 'ml-code-input';
      codeInput.placeholder = 'Type code…'; codeInput.spellcheck = false;
      codeInput.title = 'Type a lesson code (e.g. LSB1-S2.T1.P1). Enter = add link. Quick click = open in AWord. Double-click = open folder on D:. Press-and-hold = edit text.';

      // Đang báo "No acts found" mà thầy gõ tiếp (mã khác) -> chữ đó không còn đúng nữa, trả ô link
      // về placeholder gốc ngay khi gõ.
      codeInput.addEventListener('input', () => {
        if (input.placeholder === NO_ACTS_TEXT) { input.placeholder = '+ Add a link'; input.classList.remove('ml-no-acts'); }
      });

      async function tryFindCode(raw, moTrinhDuyet) {
        codeInput.classList.remove('ml-err');
        codeInput.disabled = true;
        let res = null;
        try { res = await api.findAwordFolder(raw); } catch (_) {}
        codeInput.disabled = false;
        if (res && res.url) {
          tasks.names[res.url] = res.name || raw.toUpperCase(); // "mã y nguyên" — trước khi ensureName có cơ hội đặt tên khác
          input.value = res.url;
          toast('Added: ' + tasks.names[res.url]);
          commitCard(card, { rerender: true, focusTrailing: true, flip: true });
          if (moTrinhDuyet && api.openExternal) {
            try { const err = await api.openExternal(res.url); if (err) toast('Could not open: ' + err); } catch (_) {}
          }
        } else {
          codeInput.classList.add('ml-err');
          setTimeout(() => codeInput.classList.remove('ml-err'), 500);
          input.placeholder = NO_ACTS_TEXT;
          input.classList.add('ml-no-acts');
          codeInput.focus();
        }
      }

      codeInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const raw = codeInput.value.trim();
        if (!raw) return;
        tryFindCode(raw, false);
      });

      // v0.17.0: click NHANH = mở AWord; bấm GIỮ ≥350ms = chỉ để sửa chữ (không tra); đúp chuột =
      // mở thư mục ổ D (hủy lượt click-mở đang chờ). Mẫu chờ~260ms giống hệt nút TÊN .ml-name phía
      // trên để double-click luôn có cơ hội hủy kịp trước khi click đơn chạy.
      const HOLD_MS = 350, WAIT_DBL_MS = 260;
      let downAt = 0, ngoiChoClick = null;
      codeInput.addEventListener('mousedown', () => { downAt = Date.now(); });
      codeInput.addEventListener('click', (e) => {
        if (e.detail > 1) return; // click thứ 2 của double-click -> để 'dblclick' lo
        if (Date.now() - downAt >= HOLD_MS) return; // bấm giữ -> thầy đang sửa chữ, không tra
        const raw = codeInput.value.trim();
        if (!raw) return;
        clearTimeout(ngoiChoClick);
        ngoiChoClick = setTimeout(() => tryFindCode(raw, true), WAIT_DBL_MS);
      });
      codeInput.addEventListener('dblclick', async () => {
        clearTimeout(ngoiChoClick);
        const raw = codeInput.value.trim();
        if (!raw || typeof api.openLessonFolder !== 'function') return;
        let res = null;
        try { res = await api.openLessonFolder(raw); } catch (_) {}
        if (!res || !res.ok) {
          if (res && res.reason === 'khong-tim-thay') toast('No matching folder on D: for this code');
          return;
        }
        if (!res.exact) toast('Opened nearest folder — no sub-folder for this code yet');
      });

      // v0.18.0: DÁN MÃ BÀI vào ô "+ Add a link" (thầy chốt 1/10/2026) -> chặn dán chữ mã vào ô link,
      // chuyển mã sang ô "Type code…" rồi tra AWord y như Enter (có act thì điền link + commit, không
      // có thì "No acts found"). Chỉ nhận đúng dạng mã (regex chép từ RE_LESSON_CODE của ma-bai.js) —
      // dán URL / đường dẫn file vẫn đi đường cũ.
      input.addEventListener('paste', (e) => {
        const raw = stripQuotes((e.clipboardData && e.clipboardData.getData('text')) || '');
        if (!RE_MA_BAI.test(raw)) return;
        e.preventDefault();
        codeInput.value = raw.toUpperCase();
        codeInput.dispatchEvent(new Event('input')); // dọn "No acts found" cũ nếu có
        tryFindCode(codeInput.value, false);
      });
    }

    row.appendChild(nm); row.appendChild(open); row.appendChild(input);
    if (codeInput) { row.classList.add('has-code'); row.appendChild(codeInput); }
    row.appendChild(up); row.appendChild(tick); row.appendChild(kebab);
    return row;
  }

  // ---------- đổi thứ tự: HOÁN VỊ CHỈ SỐ GỐC của hàng này với hàng chưa-tick liền trên, rồi commit
  // (commit dựng `links` theo data-idx). Theo HÀNG chứ không theo URL -> 2 link trùng URL vẫn đúng
  // hàng được bấm. v0.6.0: đổi từ "dời DOM" sang "đổi chỉ số" vì DOM giờ sắp theo nhóm tick.
  function moveRowUp(card, row) {
    const prev = row.previousElementSibling;
    if (!prev || !prev.classList.contains('ml-link-row') || prev.classList.contains('trailing')) return;
    if (prev.classList.contains('checked') || row.classList.contains('checked')) return;
    const a = row.dataset.idx, b = prev.dataset.idx;
    if (a === undefined || b === undefined) return;
    row.dataset.idx = b; prev.dataset.idx = a;
    commitCard(card, { rerender: true, flip: true }); // rerender: cập nhật disabled của mũi tên hàng đầu
  }

  // ---------- kebab menu (Delete) ----------
  // BẪY (30/07/2026): `.ml-link-row` có `will-change: transform` (phục vụ FLIP) nên MỖI hàng tự lập
  // stacking context riêng. Menu kebab (`.ml-link-menu`, absolute + z-index:20) chỉ thắng z-index
  // TRONG hàng của nó — hàng KẾ TIẾP (vd hàng trailing "+ Add a link") vẫn đứng TRÊN cả context đó
  // theo thứ tự DOM (2 context anh em cùng z-index:auto/0 thì hàng SAU vẽ đè hàng TRƯỚC). Kết quả:
  // menu vẫn HIỆN đúng chỗ (nhìn thấy nút Delete) nhưng CLICK lại trúng hàng dưới (trong suốt) đang
  // đè lên trên -> bấm Delete không xóa được gì. Elevate z-index của CHÍNH hàng đang mở menu để
  // thắng các hàng anh em, không cần đụng CSS animation.
  let openMenuEl = null;
  function closeLinkMenu() {
    if (openMenuEl) {
      const r = openMenuEl.parentElement;
      if (r) r.style.zIndex = '';
      openMenuEl.remove(); openMenuEl = null;
    }
    document.removeEventListener('mousedown', onDocMouseDownForMenu, true);
  }
  function onDocMouseDownForMenu(e) { if (openMenuEl && !openMenuEl.contains(e.target)) closeLinkMenu(); }
  function openLinkMenu(row, card) {
    closeLinkMenu();
    row.style.zIndex = '5';
    const menu = document.createElement('div'); menu.className = 'ml-link-menu';
    const delBtn = document.createElement('button'); delBtn.type = 'button'; delBtn.className = 'ml-link-menu-del';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      const input = row.querySelector('input.ml-link-input'); if (input) input.value = '';
      closeLinkMenu();
      row.classList.add('ml-row-out'); // biến mất mượt rồi mới render lại
      setTimeout(() => commitCard(card, { rerender: true, flip: true }), reduceMotion() ? 0 : 150);
    });
    menu.appendChild(delBtn);
    row.appendChild(menu);
    openMenuEl = menu;
    setTimeout(() => document.addEventListener('mousedown', onDocMouseDownForMenu, true), 0);
  }

  function commitCard(card, opt = {}) {
    const key = card.dataset.key, cls = card.dataset.cls;
    // Đọc theo HÀNG từ DOM nhưng SẮP LẠI THEO CHỈ SỐ GỐC (data-idx) — không theo thứ tự hiển thị,
    // vì hàng đã tick được hiển thị dồn xuống dưới. Hàng trống ở cuối (trailing, không có idx) =
    // link MỚI -> xếp cuối. Xóa/sửa/đảo hàng đều tự ra đúng chỉ số mới; link trùng URL vẫn độc lập.
    const rows = [];
    for (const row of card.querySelectorAll('.ml-link-row')) {
      // v0.15.0: '.ml-link-input' RIÊNG — hàng trailing có thể có THÊM '.ml-code-input' (gõ mã),
      // querySelector('input') trần sẽ vơ nhầm ô đó nếu nó đứng trước trong DOM.
      const v = stripQuotes(row.querySelector('input.ml-link-input').value);  // v0.9.10: dán "Copy as path" -> bỏ dấu "
      if (!v) continue;
      const raw = row.dataset.idx;
      rows.push({ ord: raw === undefined ? Number.MAX_SAFE_INTEGER : +raw, url: v, on: row.classList.contains('checked') });
    }
    rows.sort((a, b) => a.ord - b.ord);
    const links = []; const checked = [];
    for (const r of rows) { if (r.on) checked.push(links.length); links.push(r.url); }
    const cell = ensureCell(key, cls);
    cell.links = links;
    cell.checked = checked;
    updateDayDot(key);
    for (const u of links) ensureName(u);
    scheduleSave();
    if (opt.rerender) {
      const before = opt.flip ? snapshotPositions() : null;
      renderClasses();
      if (before) playFlip(before);
      if (opt.focusTrailing) {
        const c = q(`.ml-card[data-key="${key}"][data-cls="${cssEsc(cls)}"]`);
        const t = c && c.querySelector('.ml-link-row.trailing input.ml-link-input');
        if (t) t.focus();
      }
    }
  }

  // ---------- ANIMATION FLIP (v0.6.0) ----------
  // Chụp vị trí các hàng/thẻ TRƯỚC khi render lại, sau khi render thì đặt lại transform theo hiệu
  // số rồi cho chạy về 0 -> hàng TRƯỢT tới chỗ mới thay vì nhảy. Chỉ là hiệu ứng trình bày (không
  // phải logic bắt buộc) nên dùng requestAnimationFrame là an toàn.
  const FLIP_MS = 260;
  function flipKey(el, cnt) {
    const card = el.closest('.ml-card');
    const base = (card ? card.dataset.cls : '') + '|' +
      (el.classList.contains('ml-card') ? 'card'
        : el.classList.contains('trailing') ? 'new'
        : (el.querySelector('input') || {}).value || '');
    const n = cnt.get(base) || 0; cnt.set(base, n + 1);
    return base + '#' + n;
  }
  function snapshotPositions() {
    if (reduceMotion()) return null;
    const m = new Map(); const cnt = new Map();
    for (const el of container.querySelectorAll('.ml-card, .ml-link-row')) m.set(flipKey(el, cnt), el.getBoundingClientRect().top);
    return m;
  }
  function playFlip(before) {
    if (!before || reduceMotion()) return;
    const cnt = new Map();
    for (const el of container.querySelectorAll('.ml-card, .ml-link-row')) {
      const k = flipKey(el, cnt);
      const old = before.get(k);
      if (old === undefined) { // hàng MỚI -> hiện dần
        el.classList.add('ml-flip-in');
        setTimeout(() => el.classList.remove('ml-flip-in'), FLIP_MS + 40);
        continue;
      }
      const dy = old - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      // KHÔNG dùng requestAnimationFrame: cửa sổ ẩn/không render thì rAF bị treo -> hàng sẽ KẸT ở
      // vị trí lệch. Ép reflow đồng bộ rồi trả transform về ngay: transition không chạy cũng đúng chỗ.
      el.style.transition = 'none';
      el.style.transform = 'translateY(' + dy + 'px)';
      void el.offsetWidth;
      el.style.transition = 'transform ' + FLIP_MS + 'ms var(--ease)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, FLIP_MS + 40);
    }
  }

  async function ensureName(url) {
    if (!url || tasks.names[url] || namesLoading.has(url)) return;
    namesLoading.add(url);
    updateNameLabels();
    let n = null;
    try { n = await generateName(url, api.fetchTitle); } catch (_) {}
    namesLoading.delete(url);
    if (n) { tasks.names[url] = n; scheduleSave(); }
    updateNameLabels();
  }
  function updateNameLabels() {
    for (const row of container.querySelectorAll('.ml-link-row')) {
      const u = row.dataset.url;
      const nm = row.querySelector('.ml-name');
      if (!nm) continue;
      nm.textContent = labelFor(u);
      nm.style.visibility = u ? 'visible' : 'hidden';
      fitName(nm);                       // tên vừa đặt xong -> co chữ lại cho vừa nút
    }
  }

  function toggleDone(key, cls) {
    const cell = ensureCell(key, cls);
    cell.done = !cell.done;
    updateDayDot(key); scheduleSave();
    const before = snapshotPositions(); renderClasses(); playFlip(before); // thẻ dưới trượt lên/xuống
  }

  // ---------- SETTINGS ----------
  function openSettings() {
    renderSettings();
    const ov = q('.ml-settings-overlay');
    ov.classList.remove('out'); ov.hidden = false;
    void ov.offsetWidth; ov.classList.add('in');   // nền mờ dần + hộp thoại nhô lên (keyframes)
  }
  function closeSettings() {
    const ov = q('.ml-settings-overlay');
    ov.classList.remove('in'); ov.classList.add('out');
    const done = () => { ov.hidden = true; ov.classList.remove('out'); };
    if (reduceMotion()) done(); else setTimeout(done, 170);
    renderDays(); renderClasses();
  }
  function renderSettings() { if (opts.themePicker) renderThemeButtons(); if (opts.autostartPicker) renderAutostart(); renderSetClasses(); renderSetSchedule(); }

  // ---------- Auto-start sau khi khởi động Windows (v0.6.0, chỉ app standalone) ----------
  // Giá trị = SỐ PHÚT trễ (0 = tắt). Main process lo phần đăng ký chạy cùng Windows.
  const AUTOSTART_OPTS = [{ v: 0, t: 'Off' }, { v: 1, t: '1 min' }, { v: 3, t: '3 min' }, { v: 5, t: '5 min' }, { v: 10, t: '10 min' }];
  let autostartVal = 0;
  function renderAutostart() {
    const row = q('.ml-autostart-row'); if (!row) return;
    row.innerHTML = '';
    for (const o of AUTOSTART_OPTS) {
      const b = document.createElement('button');
      b.className = 'ml-theme-btn' + (o.v === autostartVal ? ' active' : '');
      b.textContent = o.t;
      b.addEventListener('click', () => {
        autostartVal = o.v; renderAutostart();
        if (opts.onAutostart) opts.onAutostart(o.v);
        toast(o.v ? 'Starts ' + o.v + ' min after login' : 'Auto-start off');
      });
      row.appendChild(b);
    }
  }
  function renderThemeButtons() {
    const row = q('.ml-theme-row'); if (!row) return;
    row.innerHTML = '';
    const cur = getTheme();
    const LB = { default: 'Default', light: 'Light', dark: 'Dark' };
    for (const t of THEMES) {
      const b = document.createElement('button');
      b.className = 'ml-theme-btn' + (t === cur ? ' active' : '');
      b.textContent = LB[t];
      b.addEventListener('click', () => { try { localStorage.setItem('mylink-theme', t); } catch (_) {} applyTheme(t); renderThemeButtons(); });
      row.appendChild(b);
    }
  }
  function getTheme() { try { return localStorage.getItem('mylink-theme') || 'default'; } catch (_) { return 'default'; } }

  function renderSetClasses() {
    const box = q('.ml-set-classes'); box.innerHTML = '';
    if ((tasks.classes || []).length === 0) {
      const e = document.createElement('span'); e.className = 'ml-sched-empty'; e.textContent = 'No classes yet. Add below.'; box.appendChild(e); return;
    }
    tasks.classes.forEach((cls, i) => {
      const chip = document.createElement('div'); chip.className = 'ml-chip';
      const up = document.createElement('button'); up.className = 'ml-chip-mv'; up.innerHTML = '&#9650;'; up.title = 'Move up'; up.disabled = i === 0;
      up.addEventListener('click', () => moveClass(i, -1));
      const dn = document.createElement('button'); dn.className = 'ml-chip-mv'; dn.innerHTML = '&#9660;'; dn.title = 'Move down'; dn.disabled = i === tasks.classes.length - 1;
      dn.addEventListener('click', () => moveClass(i, 1));
      const input = document.createElement('input'); input.type = 'text'; input.value = cls; input.maxLength = 16; input.dataset.orig = cls; input.spellcheck = false;
      input.addEventListener('change', () => {
        const oldN = input.dataset.orig, newN = input.value.trim();
        if (!newN) { input.value = oldN; return; }
        if (newN === oldN) return;
        if (tasks.classes.includes(newN)) { toast('Class already exists'); input.value = oldN; return; }
        renameClass(oldN, newN); input.dataset.orig = newN; scheduleSave(); renderSetSchedule();
      });
      const del = document.createElement('button'); del.className = 'ml-chip-del'; del.innerHTML = '&#10005;'; del.title = 'Delete class';
      del.addEventListener('click', () => {
        chip.classList.add('ml-row-out');   // mo di + truot phai roi moi dung lai danh sach
        setTimeout(() => { deleteClass(cls); scheduleSave(); renderSettings(); }, reduceMotion() ? 0 : 150);
      });
      chip.appendChild(up); chip.appendChild(dn); chip.appendChild(input); chip.appendChild(del);
      box.appendChild(chip);
    });
  }
  function renderSetSchedule() {
    const box = q('.ml-set-schedule'); box.innerHTML = '';
    if ((tasks.classes || []).length === 0) {
      const e = document.createElement('div'); e.className = 'ml-sched-empty'; e.textContent = 'Add a class first.'; box.appendChild(e); return;
    }
    const todayWd = new Date().getDay();
    const table = document.createElement('table'); table.className = 'ml-sched';
    const thead = document.createElement('thead'); const htr = document.createElement('tr'); htr.appendChild(document.createElement('th'));
    WD_COLS.forEach((wd) => { const th = document.createElement('th'); th.textContent = WD_SHORT[wd]; if (wd === todayWd) th.className = 'ml-today-col'; htr.appendChild(th); });
    thead.appendChild(htr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const cls of tasks.classes) {
      const tr = document.createElement('tr'); const td0 = document.createElement('td'); td0.textContent = cls; tr.appendChild(td0);
      WD_COLS.forEach((wd) => {
        const td = document.createElement('td'); if (wd === todayWd) td.className = 'ml-today-col';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'ml-sched-cb';
        const arr = Array.isArray(tasks.schedule[String(wd)]) ? tasks.schedule[String(wd)] : [];
        cb.checked = arr.includes(cls);
        cb.addEventListener('change', () => toggleSchedule(wd, cls, cb.checked));
        td.appendChild(cb); tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); box.appendChild(table);
  }
  function moveClass(i, dir) {
    const j = i + dir; if (j < 0 || j >= tasks.classes.length) return;
    const a = tasks.classes;
    const before = snapshotChips();          // v0.8.0: 2 the lop TRUOT doi cho thay vi nhay phut
    [a[i], a[j]] = [a[j], a[i]];
    scheduleSave(); renderSetClasses(); renderSetSchedule();
    playChipFlip(before);
  }
  // FLIP cho the lop trong Settings — khoa theo TEN lop (doi thu tu thi ten khong doi).
  function snapshotChips() {
    if (reduceMotion()) return null;
    const m = new Map();
    for (const el of container.querySelectorAll('.ml-chip')) {
      const inp = el.querySelector('input'); if (!inp) continue;
      m.set(inp.dataset.orig || inp.value, el.getBoundingClientRect().top);
    }
    return m;
  }
  function playChipFlip(before) {
    if (!before || reduceMotion()) return;
    for (const el of container.querySelectorAll('.ml-chip')) {
      const inp = el.querySelector('input'); if (!inp) continue;
      const old = before.get(inp.dataset.orig || inp.value);
      if (old === undefined) continue;
      const dy = old - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      el.style.transition = 'none';                       // KHONG rAF (xem bay v0.6.0)
      el.style.transform = 'translateY(' + dy + 'px)';
      void el.offsetWidth;
      el.style.transition = 'transform ' + FLIP_MS + 'ms var(--ease)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, FLIP_MS + 40);
    }
  }
  function addClass(name) {
    const n = (name || '').trim(); if (!n) return;
    if (tasks.classes.includes(n)) { toast('Class already exists'); return; }
    tasks.classes.push(n); scheduleSave(); renderSettings();
    const chips = container.querySelectorAll('.ml-chip');   // the lop MOI hien len (nho + mo dan)
    const last = chips[chips.length - 1];
    if (last && !reduceMotion()) { last.classList.add('ml-flip-in'); setTimeout(() => last.classList.remove('ml-flip-in'), FLIP_MS + 40); }
  }
  function renameClass(oldN, newN) {
    tasks.classes = tasks.classes.map((c) => (c === oldN ? newN : c));
    for (const wd of Object.keys(tasks.schedule)) if (Array.isArray(tasks.schedule[wd])) tasks.schedule[wd] = tasks.schedule[wd].map((c) => (c === oldN ? newN : c));
    for (const day of Object.keys(tasks.board)) { const db = tasks.board[day]; if (db && db[oldN]) { if (!db[newN]) db[newN] = db[oldN]; delete db[oldN]; } }
  }
  function deleteClass(name) {
    tasks.classes = tasks.classes.filter((c) => c !== name);
    for (const wd of Object.keys(tasks.schedule)) { if (Array.isArray(tasks.schedule[wd])) { const arr = tasks.schedule[wd].filter((c) => c !== name); if (arr.length) tasks.schedule[wd] = arr; else delete tasks.schedule[wd]; } }
    for (const day of Object.keys(tasks.board)) if (tasks.board[day] && tasks.board[day][name]) delete tasks.board[day][name];
  }
  function toggleSchedule(wd, cls, on) {
    const k = String(wd); let arr = Array.isArray(tasks.schedule[k]) ? tasks.schedule[k] : [];
    if (on) { if (!arr.includes(cls)) arr.push(cls); } else { arr = arr.filter((c) => c !== cls); }
    if (arr.length) tasks.schedule[k] = arr; else delete tasks.schedule[k];
    scheduleSave();
  }

  // ---------- splitter (resize day column) ----------
  function setupSplitter() {
    const days = q('.ml-days'), sp = q('.ml-splitter');
    let w = parseInt(localStorage.getItem(DAYS_W_KEY) || '', 10);
    if (w >= 90 && w <= 300) days.style.flexBasis = w + 'px';
    let dragging = false, startX = 0, startW = 0;
    const onMove = (e) => {
      if (!dragging) return;
      const nw = Math.max(90, Math.min(300, startW + (e.clientX - startX)));
      days.style.flexBasis = nw + 'px';
    };
    const onUp = () => {
      if (!dragging) return; dragging = false;
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
      try { localStorage.setItem(DAYS_W_KEY, String(parseInt(days.getBoundingClientRect().width, 10))); } catch (_) {}
      document.body.classList.remove('ml-resizing');
      fitAllNames();   // cột ngày rộng ra -> nút tên hẹp lại -> co chữ cho vừa
    };
    sp.addEventListener('mousedown', (e) => {
      dragging = true; startX = e.clientX; startW = days.getBoundingClientRect().width;
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      document.body.classList.add('ml-resizing'); e.preventDefault();
    });
  }

  // ---------- wiring ----------
  if (withChrome) {
    q('.ml-refresh').addEventListener('click', refresh);
    q('.ml-settings').addEventListener('click', openSettings);
  }
  q('.ml-set-close').addEventListener('click', closeSettings);
  q('.ml-set-done').addEventListener('click', closeSettings);
  q('.ml-set-add').addEventListener('click', () => { const inp = q('.ml-set-new'); addClass(inp.value); inp.value = ''; inp.focus(); });
  q('.ml-set-new').addEventListener('keydown', (e) => { if (e.key === 'Enter') { addClass(e.target.value); e.target.value = ''; } });
  q('.ml-settings-overlay').addEventListener('click', (e) => { if (e.target === q('.ml-settings-overlay')) closeSettings(); });
  q('.ml-classes-list').addEventListener('focusout', () => { if (pendingExternal && !isEditing()) { pendingExternal = false; onExternalChange(); } });
  setupSplitter();
  setupExtras();
  // v0.9.0: đổi cỡ cửa sổ -> nút tên rộng/hẹp theo -> đo lại cỡ chữ (gộp 120ms).
  let fitTimer = null;
  const onWinResize = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitAllNames, 120); };
  window.addEventListener('resize', onWinResize);

  // Theme picker (standalone) + brand góc dưới trái (standalone) + tray toggle — module myActivity KHÔNG bật.
  function setupExtras() {
    if (opts.themePicker) { const ts = q('.ml-set-theme'); if (ts) ts.hidden = false; applyTheme(getTheme()); }
    if (opts.brand) {
      const bp = q('.ml-brand');
      if (bp) {
        bp.hidden = false;
        bp.innerHTML = '<span class="ml-brand-tx"><b>myLink</b> <i>v' + (opts.version || '') + '</i><span class="ml-brand-sub">ANDREW CLASSES</span></span>';
      }
    }
    if (opts.autostartPicker) {
      const sec = q('.ml-set-autostart'); if (sec) sec.hidden = false;
      autostartVal = Number(opts.autostartValue) || 0;
      renderAutostart();
    }
    if (opts.trayToggle) {
      const sec = q('.ml-set-tray'); if (sec) sec.hidden = false;
      const sw = q('.ml-switch');
      if (sw) {
        let trayOn = opts.trayEnabled !== false;
        const paint = () => { sw.classList.toggle('on', trayOn); sw.setAttribute('aria-checked', String(trayOn)); };
        paint();
        sw.addEventListener('click', () => { trayOn = !trayOn; paint(); if (opts.onTrayToggle) opts.onTrayToggle(trayOn); });
      }
    }
  }

  async function refresh() {
    try {
      const disk = await api.list();
      if (disk) {
        tasks = disk;
        if (sanitizeTasks(tasks)) scheduleSave();   // v0.9.10: dọn link bọc dấu " của bản cũ
        lastCanon = canon(tasks);
      }
    } catch (_) {}
    renderDays(); renderClasses(); capNhatBangTrangThai(); toast('Reloaded');
  }

  // ---------- init ----------
  (async () => {
    try { const disk = await api.list(); if (disk) tasks = disk; } catch (_) {}
    if (sanitizeTasks(tasks)) scheduleSave();     // v0.9.10: dọn link bọc dấu " của bản cũ
    lastCanon = canon(tasks); selectedKey = todayKey();
    renderDays(); renderClasses(); capNhatBangTrangThai();
    if (api.onChanged) api.onChanged(onExternalChange);
  })();

  return {
    refresh,
    openSettings,
    closeSettings,
    reload: refresh,
    destroy() { clearTimeout(saveTimer); clearTimeout(fitTimer); window.removeEventListener('resize', onWinResize); container.innerHTML = ''; },
  };
}

function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

function template(withChrome) {
  return `
    ${withChrome ? `<div class="ml-toolbar">
      <button class="ml-refresh" title="Reload">&#8635;</button>
      <button class="ml-settings" title="Settings">&#9881;</button>
    </div>` : ''}
    <div class="ml-banner" hidden></div>
    <div class="ml-body">
      <aside class="ml-days"><div class="ml-days-list"></div><div class="ml-brand" hidden></div></aside>
      <div class="ml-splitter" title="Drag to resize"></div>
      <section class="ml-classes"><div class="ml-day-title"></div><div class="ml-classes-list"></div></section>
    </div>
    <div class="ml-settings-overlay" hidden>
      <div class="ml-modal">
        <div class="ml-modal-head"><span>Settings</span><button class="ml-set-close" title="Close">&#10005;</button></div>
        <div class="ml-modal-body">
          <div class="ml-set-section ml-set-theme" hidden>
            <div class="ml-set-title">Theme</div>
            <div class="ml-theme-row"></div>
          </div>
          <div class="ml-set-section ml-set-autostart" hidden>
            <div class="ml-set-title">Start with Windows &mdash; delay after login</div>
            <div class="ml-autostart-row"></div>
            <div class="ml-set-note">myLink starts silently in the tray after the chosen delay.</div>
          </div>
          <div class="ml-set-section ml-set-tray" hidden>
            <div class="ml-set-title">System tray</div>
            <div class="ml-switch-row">
              <span class="ml-switch-label">Run in background &mdash; tray icon</span>
              <button class="ml-switch" type="button" role="switch" aria-checked="true"><span class="ml-switch-knob"></span></button>
            </div>
          </div>
          <div class="ml-set-section">
            <div class="ml-set-title">Classes &mdash; order = display order</div>
            <div class="ml-set-classes"></div>
            <div class="ml-set-add-row">
              <input class="ml-set-new" type="text" placeholder="New class (e.g. A1A)" maxlength="16" />
              <button class="ml-btn-accent ml-set-add">Add class</button>
            </div>
          </div>
          <div class="ml-set-section">
            <div class="ml-set-title">Schedule &mdash; assign each class to weekdays</div>
            <div class="ml-set-schedule"></div>
          </div>
        </div>
        <div class="ml-modal-foot"><span class="ml-set-hint"></span><button class="ml-btn-accent ml-set-done">Done</button></div>
      </div>
    </div>
    <div class="ml-toast" hidden></div>
  `;
}
