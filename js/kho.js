/* ============================================================
   web/js/kho.js — DỮ LIỆU myWork trên Firebase (v2.0.0, 22/10/2026)

   Thầy chốt 22/10: dữ liệu CHỈ trên Firebase (project aword-70dae, dùng chung cả hệ) ·
   có MÀN ĐĂNG NHẬP (tài khoản quản trị: ID + mật khẩu + Google Authenticator, giống dashboard) ·
   mục myLink dùng dữ liệu THẬT chung với app myLink (`linkTask/chung`).

   KHUÔN KHO (đừng đổi shape — bản web/điện thoại sau này đọc đúng khuôn này):
     mwUsers/{uid}/kho/meta              lists · views · tpls · set · bg   (mỗi phần 1 trường CHUỖI JSON)
     mwUsers/{uid}/kho/m_<danhSách>      việc CHƯA xong của danh sách     t.i<id> = chuỗi JSON của việc
     mwUsers/{uid}/kho/x_<danhSách>_<năm> việc ĐÃ xong (theo năm xong)   t.i<id> = chuỗi JSON
     (v2.4.0) mục Tập luyện ở bộ RIÊNG mwUsers/{uid}/tap — xem khối "TẬP LUYỆN" cuối tệp
   ⇒ mở app đọc ~100 tài liệu (không phải 4.000 việc); sửa 1 việc = ghi ĐÚNG 1 trường của 1 tài liệu
     (set merge) ⇒ hai máy sửa hai việc khác nhau cùng lúc không đè nhau.
   Vì sao CHUỖI JSON: giữ 1 trường/việc (Firestore giới hạn 20.000 trường/tài liệu, bản đồ lồng nhau
   tính từng trường con), đúng nếp `linkTask/chung` của myLink.

   ĐỒNG BỘ: `S0` = bản ĐÃ KHỚP với kho của từng việc (chuỗi chuẩn hoá). Ghi = so DB hiện tại với S0
   ⇒ chỉ gửi việc khác. Nghe onSnapshot cả bộ sưu tập: tài liệu đổi ⇒ việc nào khác S0 là MÁY KHÁC sửa
   ⇒ cập nhật tại chỗ (giữ nguyên đối tượng) — trừ khi thầy đang sửa dở việc đó trên máy này (bản máy
   này thắng, lượt ghi sau sẽ đẩy lên). Tiếng vọng lượt ghi của chính mình = trùng S0 ⇒ bỏ qua.
   ============================================================ */
import { initializeApp } from '../vendor/firebase/firebase-app.js';
import {
  initializeAuth, indexedDBLocalPersistence, signInWithEmailAndPassword, signInWithCustomToken,
  getMultiFactorResolver, TotpMultiFactorGenerator, multiFactor, signOut, onAuthStateChanged,
} from '../vendor/firebase/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, writeBatch,
  deleteField, FieldPath, updateDoc, setDoc,
} from '../vendor/firebase/firebase-firestore.js';

const CFG = {
  apiKey: 'AIzaSyAV_yoyAQM2fKKdOsJyuAxxf4AN7MsF7XY',   // khoá CÔNG KHAI theo thiết kế Firebase (định danh project)
  authDomain: 'aword-70dae.firebaseapp.com',
  projectId: 'aword-70dae',
};
const DUOI_QT = '@quantri.andrewclasses.com';         // ⛔ khớp myLesson web js/thay.js + tools/tai-khoan-quan-tri.js
const ML_DOC = (() => { try { return localStorage.getItem('mw_thu_ml') || 'chung'; } catch (e) { return 'chung'; } })();   // phép thử: tài liệu ZTEST riêng

const app = initializeApp(CFG, 'mywork');
// (v2.1.0) Thầy chốt: NHỚ ĐĂNG NHẬP 60 NGÀY — phiên cất trong máy (IndexedDB); quá 60 ngày kể từ lần gõ mật khẩu + mã 6 số
// thì tự đăng xuất, hỏi lại (giống luật 30 ngày của dashboard `thay.js`, khác số ngày).
const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
const NHO_TOI_DA = 60 * 24 * 3600 * 1000;
// Bộ đệm trong máy (IndexedDB) do chính Firebase quản: mạng chập chờn vẫn xem + sửa, có mạng tự đẩy lên.
let db = null;
try { db = initializeFirestore(app, { localCache: persistentLocalCache() }); }
catch (e) { db = initializeFirestore(app, {}); }

// ───────── đăng nhập ─────────
async function emailTuId(id) {
  const chuan = String(id || '').replace(/\s+/g, '').toUpperCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chuan));
  return [...new Uint8Array(buf)].map((b) => ('0' + b.toString(16)).slice(-2)).join('').slice(0, 24) + DUOI_QT;
}
async function coQuyen(u) {
  const t = await u.getIdTokenResult(true);
  if (t.claims.thay !== true) { await signOut(auth); throw new Error('chua-cap-quyen'); }
  const luc = Date.parse(t.authTime);
  if (luc && Date.now() - luc > NHO_TOI_DA) { await signOut(auth); throw new Error('het-60-ngay'); }
  return u;
}
// Trả { buoc:'xong', user } | { buoc:'ma', xacNhan(ma6) }  — sai thì ném lỗi (chuLoi đổi sang chữ)
async function dangNhap(id, mk) {
  const email = await emailTuId(id);
  try {
    const r = await signInWithEmailAndPassword(auth, email, mk);
    if (!multiFactor(r.user).enrolledFactors.length) { await signOut(auth); throw new Error('chua-cai-totp'); }
    return { buoc: 'xong', user: await coQuyen(r.user) };
  } catch (e) {
    if (!e || e.code !== 'auth/multi-factor-auth-required') throw e;
    const giai = getMultiFactorResolver(auth, e);
    const goi = giai.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!goi) throw new Error('chua-cai-totp');
    return {
      buoc: 'ma',
      xacNhan: async (ma) => {
        const kd = TotpMultiFactorGenerator.assertionForSignIn(goi.uid, String(ma || '').replace(/\D/g, ''));
        const r = await giai.resolveSignIn(kd);
        return coQuyen(r.user);
      },
    };
  }
}
function chuLoi(e) {
  const c = (e && (e.code || e.message)) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) return 'Sai ID hoặc mật khẩu.';
  if (/too-many-requests/.test(c)) return 'Sai quá nhiều lần — đợi vài phút rồi thử lại.';
  if (/user-disabled/.test(c)) return 'Tài khoản đang bị khoá.';
  if (/invalid-verification-code|invalid-code|missing-code/.test(c)) return 'Mã 6 số không đúng (hoặc đã quá 30 giây) — gõ mã mới.';
  if (/chua-cai-totp/.test(c)) return 'Tài khoản chưa cài Google Authenticator — cài trên dashboard trước.';
  if (/chua-cap-quyen/.test(c)) return 'Tài khoản chưa có quyền quản trị.';
  if (/het-60-ngay/.test(c)) return 'Đã quá 60 ngày — đăng nhập lại nhé.';
  if (/network/.test(c)) return 'Mất mạng — thử lại.';
  return 'Không đăng nhập được (' + c + ').';
}
const thoat = () => signOut(auth);
// Phiên còn trong máy và chưa quá 60 ngày ⇒ mở app là vào thẳng, không hỏi lại.
function phienCu() {
  return new Promise((r) => {
    const stop = onAuthStateChanged(auth, async (u) => { stop(); if (!u) return r(null); try { r(await coQuyen(u)); } catch (e) { r(null); } });
  });
}
// Phép thử tự động (Claude): vé custom token của TÀI KHOẢN THỬ ZTEST — không dùng mật khẩu thật.
async function thuToken(token) { const r = await signInWithCustomToken(auth, String(token || '')); return coQuyen(r.user); }

// ───────── chuẩn hoá ─────────
function sapKhoa(v) {
  if (Array.isArray(v)) return v.map(sapKhoa);
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach((k) => { if (v[k] !== undefined) o[k] = sapKhoa(v[k]); }); return o; }
  return v;
}
const canon = (v) => JSON.stringify(sapKhoa(v));
const khoaViec = (id) => 'i' + id;
const taiLieuCua = (t) => t.done ? `x_${t.list}_${String(t.doneAt || '0000').slice(0, 4)}` : `m_${t.list}`;
const PHAN_META = ['lists', 'views', 'tpls', 'set', 'bg'];

// ───────── kho việc ─────────
let UID = null, DB = null, MO = null;
const S0 = new Map();          // id -> { j: chuỗi chuẩn hoá, d: tài liệu }
const XA = new Map();          // id -> { j, d }  bản trên kho (theo snapshot gần nhất)
const KHOA_TL = new Map();     // tài liệu -> Set(id) đang nằm trong nó
let meta0 = {};                // phần meta -> chuỗi đã khớp
let metaXa = {};
let huyNghe = null;
const ref = (tl) => doc(db, 'mwUsers', UID, 'kho', tl);

// MO = { layMeta(): {lists,views,tpls,set,bg}, datMeta(phan, giaTri), dangSua(id): bool, khiDoi(): void }
function moKho(uid, dbApp, mo) {
  UID = uid; DB = dbApp; MO = mo;
  S0.clear(); XA.clear(); KHOA_TL.clear(); meta0 = {}; metaXa = {};
  return new Promise((xong, loi) => {
    let dau = true;
    huyNghe = onSnapshot(collection(db, 'mwUsers', UID, 'kho'), { includeMetadataChanges: false }, (snap) => {
      const cham = new Set();
      snap.docChanges().forEach((ch) => {
        const tl = ch.doc.id, d = ch.type === 'removed' ? {} : ch.doc.data();
        if (tl === 'meta') { PHAN_META.forEach((p) => { if (typeof d[p] === 'string') metaXa[p] = d[p]; }); cham.add('#meta'); return; }
        const cu = KHOA_TL.get(tl) || new Set(), moi = new Set();
        const t = d.t || {};
        Object.keys(t).forEach((k) => { const id = +k.slice(1); if (!id && id !== 0) return; moi.add(id); XA.set(id, { j: t[k], d: tl }); cham.add(id); });
        cu.forEach((id) => { if (!moi.has(id)) { const x = XA.get(id); if (x && x.d === tl) XA.delete(id); cham.add(id); } });
        KHOA_TL.set(tl, moi);
      });
      if (dau) { dau = false; napLanDau(); xong(); return; }
      if (apDung(cham)) MO.khiDoi();
    }, (e) => { if (dau) { dau = false; loi(e); } else console.warn('[kho] nghe lỗi', e); });
  });
}
function napLanDau() {
  const m = {};
  PHAN_META.forEach((p) => { if (metaXa[p] != null) { try { m[p] = JSON.parse(metaXa[p]); } catch (e) {} meta0[p] = canonChuoi(metaXa[p]); } });
  const tasks = [];
  XA.forEach((x, id) => { try { const t = JSON.parse(x.j); t.id = id; tasks.push(t); S0.set(id, { j: canon(t), d: x.d }); } catch (e) {} });
  DB.tasks.splice(0, DB.tasks.length, ...tasks);
  MO.datMeta(m);
}
// Áp thay đổi từ MÁY KHÁC. Trả true nếu có gì đổi trên màn hình.
function apDung(cham) {
  let doi = false;
  if (cham.has('#meta')) {
    const m = {}, hien = MO.layMeta();
    PHAN_META.forEach((p) => {
      const xa = metaXa[p]; if (xa == null) return;
      const cx = canonChuoi(xa); if (cx === meta0[p]) return;                 // tiếng vọng / không đổi
      if (meta0[p] != null && canon(hien[p]) !== meta0[p]) return;            // máy này đang có sửa chưa gửi ⇒ máy này thắng
      try { m[p] = JSON.parse(xa); meta0[p] = cx; doi = true; } catch (e) {}
    });
    if (Object.keys(m).length) MO.datMeta(m);
  }
  cham.forEach((id) => {
    if (id === '#meta') return;
    const xa = XA.get(id), s = S0.get(id), cuc = DB.tasks.find((t) => t.id === id);
    if (xa) {
      let jx; try { const o = JSON.parse(xa.j); o.id = id; jx = canon(o); } catch (e) { return; }
      if (s && s.j === jx) { s.d = xa.d; return; }                    // tiếng vọng của chính mình
      if (cuc && s && canon(cuc) !== s.j) return;                      // đang sửa dở trên máy này ⇒ máy này thắng
      if (cuc && MO.dangSua(id)) return;
      const o = JSON.parse(jx);
      if (cuc) { Object.keys(cuc).forEach((k) => { delete cuc[k]; }); Object.assign(cuc, o); }
      else DB.tasks.push(o);
      S0.set(id, { j: jx, d: xa.d }); doi = true;
    } else if (s) {
      if (cuc && canon(cuc) !== s.j) return;                           // máy này vừa sửa ⇒ giữ, lượt ghi sau tạo lại
      const i = DB.tasks.indexOf(cuc); if (i >= 0) DB.tasks.splice(i, 1);
      S0.delete(id); doi = true;
    }
  });
  return doi;
}
function canonChuoi(s) { try { return canon(JSON.parse(s)); } catch (e) { return s; } }

// Ghi: so DB với S0 ⇒ gửi đúng phần khác. Gọi thoải mái (đã có hẹn giờ gộp ở phía app).
let dangGhi = Promise.resolve();
function luu() {
  if (!UID || !DB) return 0;
  const viec = [];   // [ref, dữ liệu]
  const conLai = new Set(S0.keys());
  DB.tasks.forEach((t) => {
    conLai.delete(t.id);
    const j = canon(t), d = taiLieuCua(t), s = S0.get(t.id);
    if (s && s.j === j && s.d === d) return;
    const x = Object.assign({}, t); delete x.id;
    viec.push([d, { t: { [khoaViec(t.id)]: JSON.stringify(sapKhoa(x)) } }]);
    if (s && s.d !== d) viec.push([s.d, { t: { [khoaViec(t.id)]: deleteField() } }]);
    S0.set(t.id, { j, d });
  });
  conLai.forEach((id) => { const s = S0.get(id); viec.push([s.d, { t: { [khoaViec(id)]: deleteField() } }]); S0.delete(id); });
  const m = MO.layMeta(), dm = {};
  PHAN_META.forEach((p) => { if (m[p] === undefined) return; const c = canon(m[p]); if (c !== meta0[p]) { dm[p] = JSON.stringify(m[p]); meta0[p] = c; } });
  if (Object.keys(dm).length) viec.push(['meta', dm]);
  if (!viec.length) return 0;
  for (let i = 0; i < viec.length; i += 450) {
    const b = writeBatch(db);
    viec.slice(i, i + 450).forEach(([tl, du]) => b.set(ref(tl), du, { merge: true }));
    dangGhi = b.commit().catch((e) => { console.error('[kho] ghi lỗi', e); MO.loiGhi && MO.loiGhi(e); });
  }
  return viec.length;
}
function dongKho() { if (huyNghe) { huyNghe(); huyNghe = null; } UID = null; DB = null; }

// ───────── myLink: `linkTask/<ML_DOC>` (khuôn y hệt myLink src/main/lib/viec-fs.js) ─────────
const ML_NHO = ['classes', 'schedule', 'names', 'wordwall'];
const mlRong = () => ({ wordwall: [], classes: [], schedule: {}, board: {}, names: {} });
const giai = (s, md) => { if (typeof s !== 'string' || !s) return md; try { const j = JSON.parse(s); return j == null ? md : j; } catch (e) { return md; } };
function mlTuKho(d) {
  const t = mlRong(); if (!d) return t;
  t.classes = giai(d.classes, []); t.schedule = giai(d.schedule, {}); t.names = giai(d.names, {}); t.wordwall = giai(d.wordwall, []);
  const b = (d.board && typeof d.board === 'object') ? d.board : {};
  Object.keys(b).forEach((n) => { const v = giai(b[n], null); if (v) t.board[n] = v; });
  return t;
}
let mlMoc = null, mlSong = false, mlCb = [], mlHuy = null, mlVuaGhi = null, mlCo = false;
const mlRef = () => doc(db, 'linkTask', ML_DOC);
function mlNghe() {
  if (mlHuy) return;
  mlHuy = onSnapshot(mlRef(), (s) => {
    mlSong = true; mlCo = s.exists();
    const d = s.exists() ? s.data() : null;
    if (d && mlVuaGhi && d.capNhat === mlVuaGhi && mlMoc) return;     // tiếng vọng của chính mình
    const moi = mlTuKho(d);
    if (mlMoc && canon(moi) === canon(mlMoc)) return;
    mlMoc = moi; mlCb.forEach((f) => { try { f(); } catch (e) {} });
  }, (e) => { mlSong = false; console.warn('[myLink] nghe lỗi', e); });
}
const ml = {
  list: async () => { mlNghe(); if (!mlMoc) await new Promise((r) => { const f = () => { mlCb = mlCb.filter((x) => x !== f); r(); }; mlCb.push(f); setTimeout(f, 6000); }); return JSON.parse(JSON.stringify(mlMoc || mlRong())); },
  // Chỉ gửi PHẦN ĐỔI (ngày nào đổi gửi đúng ngày đó) ⇒ máy lớp tích hôm nay + máy nhà soạn ngày mai giữ cả hai.
  save: async (t) => {
    const cu = mlMoc || mlRong(), cap = [];
    ML_NHO.forEach((k) => { const a = JSON.stringify(cu[k] === undefined ? null : cu[k]), b = JSON.stringify(t[k] === undefined ? null : t[k]); if (a !== b) cap.push(new FieldPath(k), b); });
    const bc = cu.board || {}, bm = t.board || {};
    Object.keys(bm).forEach((n) => { const b = JSON.stringify(bm[n]); if (JSON.stringify(bc[n] === undefined ? null : bc[n]) !== b) cap.push(new FieldPath('board', n), b); });
    Object.keys(bc).forEach((n) => { if (bm[n] === undefined) cap.push(new FieldPath('board', n), deleteField()); });
    if (!cap.length) return { ok: true, doi: [] };
    mlVuaGhi = new Date().toISOString();
    cap.push(new FieldPath('capNhat'), mlVuaGhi);
    mlMoc = JSON.parse(JSON.stringify(t));
    try {
      if (mlCo) await updateDoc(mlRef(), ...cap);
      else {
        const du = { capNhat: mlVuaGhi, board: {} };
        ML_NHO.forEach((k) => { du[k] = JSON.stringify(t[k] === undefined ? null : t[k]); });
        Object.keys(bm).forEach((n) => { du.board[n] = JSON.stringify(bm[n]); });
        await setDoc(mlRef(), du); mlCo = true;
      }
      return { ok: true };
    } catch (e) { console.error('[myLink] ghi lỗi', e); return { error: String(e && e.message || e) }; }
  },
  onChanged: (cb) => { mlCb.push(cb); mlNghe(); },
  status: async () => ({ coKhoa: true, conMang: mlSong && navigator.onLine }),
  dong: () => { if (mlHuy) { mlHuy(); mlHuy = null; } mlMoc = null; mlCb = []; },
};

// ───────── (v2.4.0) TẬP LUYỆN: bộ RIÊNG mwUsers/{uid}/tap — KHÔNG nằm trong `kho` (mở app không đọc thêm) ─────────
//   tap/hoso       hoso · ga        (chuỗi JSON: hồ sơ · các phiên bản giáo án)
//   tap/n_<YYYY-MM> d.<YYYY-MM-DD>   (chuỗi JSON nhật ký MỘT ngày ⇒ hai máy ghi hai ngày khác nhau không đè nhau)
//   tap/anh        a                (chuỗi JSON danh sách ảnh tiến độ; tệp ảnh ở Storage mwUsers/{uid}/tap/<tệp>.jpg)
const TAP_BUCKET = 'aword-70dae.firebasestorage.app';
let tapHuy = null, tapCb = null;
const tapRong = () => ({ san: false, hoso: null, ga: null, anh: [], ngay: {} });
let tapDL = tapRong();
const tapRef = (tl) => doc(db, 'mwUsers', UID, 'tap', tl);
const tapOng = (p) => `https://firebasestorage.googleapis.com/v0/b/${TAP_BUCKET}/o/${encodeURIComponent(p)}`;
const tap = {
  // cb(dl, doi: Set ngày / '#hoso' / '#anh' vừa đổi trên kho) — lần đầu khi nạp xong, sau đó mỗi lần kho đổi (cả tiếng vọng của chính mình)
  nghe(cb) {
    tapCb = cb;
    if (tapHuy) { if (tapDL.san) cb(tapDL, new Set()); return; }
    tapHuy = onSnapshot(collection(db, 'mwUsers', UID, 'tap'), (snap) => {
      const doi = new Set();
      snap.docChanges().forEach((ch) => {
        const tl = ch.doc.id, d = ch.type === 'removed' ? {} : ch.doc.data();
        if (tl === 'hoso') { tapDL.hoso = giai(d.hoso, null); tapDL.ga = giai(d.ga, null); doi.add('#hoso'); }
        else if (tl === 'anh') { tapDL.anh = giai(d.a, []); doi.add('#anh'); }
        else if (tl.startsWith('n_')) { const m = d.d || {}; Object.keys(m).forEach((k) => { tapDL.ngay[k] = giai(m[k], null); doi.add(k); }); }
      });
      tapDL.san = true;
      if (tapCb) tapCb(tapDL, doi);
    }, (e) => console.warn('[tap] nghe lỗi', e));
  },
  ghiNgay: (ngay, o) => setDoc(tapRef('n_' + ngay.slice(0, 7)), { d: { [ngay]: JSON.stringify(sapKhoa(o)) } }, { merge: true }),
  ghiHoso: (phan) => { const du = {}; if (phan.hoso !== undefined) du.hoso = JSON.stringify(phan.hoso); if (phan.ga !== undefined) du.ga = JSON.stringify(phan.ga); return setDoc(tapRef('hoso'), du, { merge: true }); },
  ghiAnh: (ds) => setDoc(tapRef('anh'), { a: JSON.stringify(ds) }, { merge: true }),
  // ảnh: gửi thẳng REST của Storage bằng ID token (không thêm SDK). Luật Storage: chỉ chủ + claim thay, JPEG < 1,5 MB.
  async taiAnh(blob, tep) {
    const p = `mwUsers/${UID}/tap/${tep}`, tk = await auth.currentUser.getIdToken();
    const r = await fetch(`https://firebasestorage.googleapis.com/v0/b/${TAP_BUCKET}/o?uploadType=media&name=${encodeURIComponent(p)}`,
      { method: 'POST', headers: { Authorization: 'Firebase ' + tk, 'Content-Type': 'image/jpeg' }, body: blob });
    if (!r.ok) throw new Error('tai-anh-' + r.status);
    const j = await r.json();
    return { p, url: tapOng(p) + '?alt=media&token=' + String(j.downloadTokens || '').split(',')[0] };
  },
  async xoaAnh(p) { const tk = await auth.currentUser.getIdToken(); await fetch(tapOng(p), { method: 'DELETE', headers: { Authorization: 'Firebase ' + tk } }); },
  dong() { if (tapHuy) { tapHuy(); tapHuy = null; } tapCb = null; tapDL = tapRong(); },
};

window.KHO = { dangNhap, chuLoi, thoat, thuToken, phienCu, moKho, luu, dongKho, ml, tap, auth, canon, mlDoc: ML_DOC };
window.dispatchEvent(new Event('kho-san'));
