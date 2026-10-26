// namer.js - dat ten link (hybrid). Uu tien: giai ma MA BAI cua thay (offline) -> fetch <title>
// trang ngoai -> slug. MOI ten auto tra ve CHU HOA. Pure (tru fetch truyen tu ngoai vao).

// v0.7.0: BANG TEN MA BAI - ma trong URL -> ten thay muon doc. Ma la (khong co trong bang) thi giu
// nguyen ma viet hoa. Them khoa moi = them 1 dong o day.
const SERIES_NAMES = {
  lsa2: 'LISTENING A2',
  lsb1: 'LISTENING B1',
  iel: 'LISTENING IELTS',
  ie: 'LISTENING IELTS',
  lsfly: 'LISTENING FLYERS',
  fly: 'LISTENING FLYERS',
  ds: 'DAILY SCIENCE READING',
  dr: 'DAILY READING',
  ier: 'IELTS READING',
  dw: 'DAILY WARM-UP',
};
const GROUP_RE = /([stpiw])(\d+(?:-\d+)*)/gi;          // S3 / T2 / P1-2 / I2 / W3
const PURE_GROUP_SEG = /^(?:[stpiw]\d+(?:-\d+)*)+$/i;   // segment CHI gom nhom, vd 'p1-2', 's3t2'

// v0.9.10: BOC DAU NHAY KEP o 2 dau. Explorer (Shift+chuot phai -> "Copy as path") LUON tra ve
// duong dan BOC trong dau ", vd: "D:\...\SLIDE 1.pptx". Neu khong boc thi isFilePath truot ngay o
// ky tu dau -> chuoi bi coi la URL -> tu them 'https://' -> MO RA TRANG WEB (loi thay gap 21/8).
// Dau " la ky tu CAM trong ten file Windows va phai ma hoa %22 trong URL -> boc luon la an toan.
export function stripQuotes(s) {
  return String(s == null ? '' : s).trim().replace(/^"+/, '').replace(/"+$/, '').trim();
}

// v0.9.9: duong dan FILE cuc bo (o dia 'C:\...' hoac UNC '\\may\...') - KHAC voi URL web, khong qua
// decodeCode/fetchTitle/slugName (deu gia dinh dang URL, tach theo '/').
const FILE_PATH_RE = /^(?:[a-zA-Z]:[\\/]|\\\\)/;
export function isFilePath(url) { return FILE_PATH_RE.test(stripQuotes(url)); }
// Ten file KEM DUOI MO RONG, CHU HOA (vd 'D:\...\SLIDE 1.pptx' -> 'SLIDE 1.PPTX').
function fileBaseName(url) {
  const s = stripQuotes(url);
  const parts = s.split(/[\\/]/).filter(Boolean);
  return (parts[parts.length - 1] || s).trim();
}

// Giai ma ma bai trong URL -> 'LISTENING A2 - S3.T2.P1-2'. null neu khong khop.
// v0.7.0: ten lay tu SERIES_NAMES, cac nhom noi bang dau CHAM, dau noi ' - ' (thay ' — ' cu); VA gom
// them nhom nam o segment RIENG sau segment series (truoc day '.../lsa2-s3t2/p1-2' bi mat P1-2).
export function decodeCode(url) {
  let segs = [];
  try { segs = new URL(url).pathname.split('/').filter(Boolean); }
  catch (_) { segs = String(url).split('/').filter(Boolean); }
  // Chon segment CUOI khop dang: series + '-s<so>' + cac nhom
  let token = null;
  let tokenAt = -1;
  segs.forEach((s, i) => {
    const low = s.toLowerCase();
    const idx = low.indexOf('-');
    if (idx <= 0) return;
    const series = low.slice(0, idx);
    const rest = low.slice(idx + 1);
    if (!/^s\d/.test(rest)) return;                // thanh phan luon bat dau bang 's' (season)
    if (!/^[a-z]{1,6}\d*$/.test(series)) return;   // series = chu + so (lsb1, iel, ds...)
    token = { series, rest }; tokenAt = i;         // giu segment cuoi khop (day du nhat)
  });
  if (!token) return null;
  const raw = token.rest.match(GROUP_RE) || [];
  if (!raw.length) return null;
  for (let i = tokenAt + 1; i < segs.length; i++) {          // '.../lsa2-s3/lsa2-s3t2/p1-2'
    if (!PURE_GROUP_SEG.test(segs[i])) continue;
    for (const g of (segs[i].match(GROUP_RE) || [])) raw.push(g);
  }
  // Bo trung theo CHU CAI dau (giu lan xuat hien DAU): 'lsa2-s3t2' + 'p1-2' -> S3 . T2 . P1-2
  const seen = new Set();
  const groups = [];
  for (const g of raw) {
    const letter = g[0].toLowerCase();
    if (seen.has(letter)) continue;
    seen.add(letter); groups.push(g.toUpperCase());
  }
  const head = SERIES_NAMES[token.series] || token.series.toUpperCase();
  return head + ' - ' + groups.join('.');
}

// Lam sach <title> trang ngoai: cat duoi site + phu de.
export function cleanTitle(raw) {
  if (!raw) return null;
  let t = String(raw).replace(/\s+/g, ' ').trim();
  t = t.split(/\s+\|\s+/)[0];       // "X | Site"
  t = t.split(/\s+[–—-]\s+/)[0];    // "X - Site" / "X – Site"
  t = t.split(/:\s+/)[0];           // "X: subtitle"
  t = t.trim();
  if (!t) return null;
  return t.slice(0, 48);
}

// slug tu doan cuoi URL (fallback).
export function slugName(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    const last = seg[seg.length - 1] || u.hostname;
    return decodeURIComponent(last).replace(/[-_]/g, ' ').replace(/\.\w+$/, '').trim().slice(0, 40);
  } catch (_) {
    return String(url).replace(/^https?:\/\//, '').slice(0, 40);
  }
}

// Sinh ten CHU HOA cho url. fetchTitle: (url)=>Promise<string|null> (main process). Co the null.
export async function generateName(url, fetchTitle) {
  const u = stripQuotes(url);   // v0.9.10: bo dau " cua "Copy as path" truoc khi doan ten
  if (!u) return '';
  if (isFilePath(u)) return fileBaseName(u).toUpperCase();
  const code = decodeCode(u);
  if (code) return code.toUpperCase();
  if (typeof fetchTitle === 'function') {
    try {
      const raw = await fetchTitle(u);
      const c = cleanTitle(raw);
      if (c) return c.toUpperCase();
    } catch (_) {}
  }
  return slugName(u).toUpperCase();
}
