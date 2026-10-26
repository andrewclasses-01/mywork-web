/* ============================================================
   web/tap/hinh.js — HÌNH ĐỘNG mô phỏng dáng tập (myWork v2.5.0, 26/10/2026; thầy chốt phong cách ở mẫu thiet-ke/mau-tap-v5)
   Hình người nét ĐƠN SẮC (màu --ac của app), khung 200×140, mặt đất y = 131.
   Mỗi bài = 2 tư thế A ↔ B (toạ độ khớp) + đồ dùng + NHỊP; vẽ bằng nội suy ⇒ thêm bài chỉ cần thêm 2 tư thế.
   Khớp: d đầu · c cổ/vai · k khuỷu · t bàn tay · h hông · g gối · ch cổ chân · m mũi chân;
         k2 t2 g2 ch2 m2 = tay/chân phía XA (vẽ mờ hơn).
   Nhịp: day = A→B 2 s, về 1 s (hạ chậm, đẩy nhanh) · keo = A→B 1 s, về 2 s (kéo/nâng nhanh, hạ chậm)
         cham = A→B 3 s, về 1 s · giu = thở nhẹ · deu<ms> = A↔B đều, mỗi chiều <ms>
   ============================================================ */
const DUNG = { d: [100, 24], c: [100, 38], k: [100, 57], t: [100, 76], h: [100, 76], g: [101, 103], ch: [100, 128], m: [112, 129] };
const L2 = (o) => Object.assign({}, o);
const goblet = {
  A: { d: [100, 24], c: [100, 38], k: [109, 54], t: [103, 46], h: [100, 76], g: [102, 103], ch: [100, 128], m: [113, 129] },
  B: { d: [95, 48], c: [96, 60], k: [110, 72], t: [104, 64], h: [80, 96], g: [112, 100], ch: [100, 128], m: [113, 129] },
};
const keoXa = {
  A: { d: [101, 33], c: [100, 46], k: [100, 32], t: [100, 17], h: [100, 86], g: [101, 110], ch: [90, 124], m: [96, 127] },
  B: { d: [101, 9], c: [100, 24], k: [87, 30], t: [100, 17], h: [100, 64], g: [101, 88], ch: [90, 102], m: [96, 105] },
};
const ngoiDay = {   /* ngồi ghế dựng: đẩy vai / Arnold */
  A: { d: [100, 38], c: [100, 52], k: [104, 32], t: [102, 14], h: [100, 92], g: [124, 94], ch: [124, 128], m: [134, 129] },
  B: { d: [100, 38], c: [100, 52], k: [112, 54], t: [108, 40], h: [100, 92], g: [124, 94], ch: [124, 128], m: [134, 129] },
};
const di = (lech) => {   /* đi/chạy: 2 bước đối nhau */
  const A = { d: [102 + lech, 24], c: [101 + lech, 38], k: [92, 56], t: [98, 70], k2: [110, 55], t2: [118, 46], h: [100, 76],
    g: [110, 101], ch: [104, 127], m: [115, 129], g2: [92, 102], ch2: [80, 118], m2: [78, 112] };
  const B = Object.assign({}, A, { k: [110, 55], t: [118, 46], k2: [92, 56], t2: [98, 70],
    g: [92, 102], ch: [80, 118], m: [78, 112], g2: [110, 101], ch2: [104, 127], m2: [115, 129] });
  return { A, B };
};

export const HINH = {
  /* ── THÂN TRÊN ── */
  dbp: { A: { d: [152, 80], c: [140, 85], k: [140, 64], t: [140, 44], h: [96, 87], g: [76, 98], ch: [80, 128], m: [90, 129] },
    B: { d: [152, 80], c: [140, 85], k: [130, 95], t: [140, 74], h: [96, 87], g: [76, 98], ch: [80, 128], m: [90, 129] }, do: ['ta', 'ghe'], nhip: 'day' },
  idbp: { A: { d: [141, 52], c: [132, 63], k: [138, 46], t: [140, 28], h: [92, 92], g: [76, 100], ch: [80, 128], m: [90, 129] },
    B: { d: [141, 52], c: [132, 63], k: [120, 76], t: [134, 58], h: [92, 92], g: [76, 100], ch: [80, 128], m: [90, 129] }, do: ['ta', 'gheDoc'], nhip: 'day' },
  pull: Object.assign({ do: ['xa'], nhip: 'keo' }, keoXa),
  chin: Object.assign({ do: ['xa'], nhip: 'keo' }, keoXa),
  row1: { A: { d: [146, 62], c: [134, 68], k: [133, 88], t: [133, 108], h: [86, 72], g: [84, 94], ch: [60, 96], m: [56, 92] },
    B: { d: [146, 62], c: [134, 68], k: [116, 56], t: [110, 76], h: [86, 72], g: [84, 94], ch: [60, 96], m: [56, 92] }, do: ['ta', 'gheThap'], nhip: 'keo' },
  csrow: { A: { d: [134, 58], c: [124, 66], k: [126, 86], t: [128, 104], h: [84, 96], g: [72, 112], ch: [66, 128], m: [76, 129] },
    B: { d: [134, 58], c: [124, 66], k: [106, 60], t: [116, 80], h: [84, 96], g: [72, 112], ch: [66, 128], m: [76, 129] }, do: ['ta', 'gheDoc2'], nhip: 'keo' },
  sp: Object.assign({ do: ['ta', 'gheDung'], nhip: 'day' }, ngoiDay),
  arn: Object.assign({ do: ['ta', 'gheDung'], nhip: 'day' }, ngoiDay),
  dip: { A: { d: [110, 28], c: [108, 42], k: [109, 51], t: [110, 60], h: [104, 82], g: [100, 104], ch: [88, 112], m: [84, 108] },
    B: { d: [114, 51], c: [110, 64], k: [94, 66], t: [110, 60], h: [104, 100], g: [100, 120], ch: [88, 124], m: [84, 120] }, do: ['xaKep'], nhip: 'day' },
  lat: { A: { d: [100, 24], c: [100, 38], k: [92, 56], t: [90, 74], k2: [108, 56], t2: [110, 74], h: [100, 76], g: [94, 103], ch: [92, 128], m: [88, 129], g2: [106, 103], ch2: [108, 128], m2: [112, 129] },
    B: { d: [100, 24], c: [100, 38], k: [80, 42], t: [62, 40], k2: [120, 42], t2: [138, 40], h: [100, 76], g: [94, 103], ch: [92, 128], m: [88, 129], g2: [106, 103], ch2: [108, 128], m2: [112, 129] }, do: ['ta', 'ta2'], nhip: 'keo' },
  fp: { A: { d: [96, 24], c: [96, 38], k: [124, 44], t: [146, 44], h: [96, 76], g: [97, 103], ch: [96, 128], m: [108, 129] },
    B: { d: [96, 24], c: [96, 38], k: [110, 28], t: [114, 36], h: [96, 76], g: [97, 103], ch: [96, 128], m: [108, 129] }, do: ['day'], nhip: 'keo' },
  curl: { A: L2(DUNG), B: Object.assign(L2(DUNG), { t: [112, 42] }), do: ['ta'], nhip: 'keo' },
  ohe: { A: { d: [100, 38], c: [100, 52], k: [104, 20], t: [104, 2], h: [100, 92], g: [124, 94], ch: [124, 128], m: [134, 129] },
    B: { d: [100, 38], c: [100, 52], k: [104, 20], t: [88, 32], h: [100, 92], g: [124, 94], ch: [124, 128], m: [134, 129] }, do: ['ta', 'gheDung'], nhip: 'day' },
  /* ── THÂN DƯỚI ── */
  gsq: Object.assign({ do: ['ta'], nhip: 'day' }, goblet),
  gsqt: Object.assign({ do: ['ta'], nhip: 'cham' }, goblet),
  rdl: { A: L2(DUNG), B: { d: [136, 62], c: [124, 66], k: [124, 84], t: [124, 102], h: [86, 78], g: [98, 103], ch: [100, 128], m: [113, 129] }, do: ['ta'], nhip: 'day' },
  bss: { A: { d: [104, 22], c: [104, 36], k: [104, 55], t: [104, 74], h: [104, 74], g: [110, 102], ch: [112, 128], m: [124, 129], g2: [88, 96], ch2: [70, 100], m2: [62, 96] },
    B: { d: [103, 44], c: [102, 58], k: [102, 77], t: [102, 96], h: [100, 96], g: [122, 104], ch: [112, 128], m: [124, 129], g2: [90, 122], ch2: [70, 100], m2: [62, 96] }, do: ['ta', 'gheSau'], nhip: 'day' },
  ht: { A: { d: [78, 84], c: [86, 92], k: [100, 104], t: [112, 112], h: [110, 118], g: [132, 104], ch: [140, 128], m: [150, 129] },
    B: { d: [78, 84], c: [86, 92], k: [100, 92], t: [112, 96], h: [112, 96], g: [136, 98], ch: [140, 128], m: [150, 129] }, do: ['ta', 'gheLung'], nhip: 'keo' },
  calf: { A: L2(DUNG), B: { d: [100, 16], c: [100, 30], k: [100, 49], t: [100, 68], h: [100, 68], g: [101, 95], ch: [100, 120], m: [110, 128] }, do: ['ta', 'bac'], nhip: 'keo' },
  lunge: { A: Object.assign(L2(DUNG), { g2: [99, 103], ch2: [98, 128], m2: [110, 129] }),
    B: { d: [100, 46], c: [100, 60], k: [100, 79], t: [100, 98], h: [98, 98], g: [114, 104], ch: [112, 128], m: [124, 129], g2: [80, 124], ch2: [64, 128], m2: [58, 124] }, do: ['ta'], nhip: 'day' },
  step: { A: { d: [96, 26], c: [96, 40], k: [96, 59], t: [96, 78], h: [96, 78], g: [116, 90], ch: [124, 110], m: [134, 110], g2: [96, 104], ch2: [96, 128], m2: [106, 129] },
    B: { d: [122, 8], c: [122, 22], k: [122, 41], t: [122, 60], h: [122, 60], g: [124, 86], ch: [124, 110], m: [134, 110], g2: [118, 86], ch2: [116, 108], m2: [126, 110] }, do: ['ta', 'hop'], nhip: 'keo' },
  slb: { A: { d: [48, 122], c: [60, 124], k: [74, 128], t: [88, 129], h: [100, 124], g: [122, 104], ch: [132, 128], m: [140, 129], g2: [124, 116], ch2: [150, 110], m2: [154, 106] },
    B: { d: [48, 122], c: [60, 124], k: [74, 128], t: [88, 129], h: [100, 106], g: [122, 100], ch: [132, 128], m: [140, 129], g2: [124, 98], ch2: [150, 92], m2: [154, 88] }, do: ['tham'], nhip: 'keo' },
  /* ── BỤNG ── */
  plank: { A: { d: [154, 98], c: [141, 104], k: [141, 127], t: [158, 127], h: [92, 108], g: [66, 116], ch: [42, 123], m: [38, 128] },
    B: { d: [154, 97], c: [141, 103], k: [141, 127], t: [158, 127], h: [92, 105], g: [66, 115], ch: [42, 123], m: [38, 128] }, do: ['tham'], nhip: 'giu' },
  splk: { A: { d: [160, 100], c: [150, 108], k: [150, 128], t: [164, 128], h: [100, 118], g: [76, 124], ch: [52, 128], m: [48, 124] },
    B: { d: [160, 99], c: [150, 107], k: [150, 128], t: [164, 128], h: [100, 112], g: [76, 120], ch: [52, 128], m: [48, 124] }, do: ['tham'], nhip: 'giu' },
  hkr: { A: { d: [102, 33], c: [100, 46], k: [100, 32], t: [100, 17], h: [100, 86], g: [100, 108], ch: [99, 126], m: [104, 128] },
    B: { d: [102, 33], c: [100, 46], k: [100, 32], t: [100, 17], h: [102, 84], g: [124, 74], ch: [118, 98], m: [124, 100] }, do: ['xa'], nhip: 'keo' },
  hlr: { A: { d: [102, 33], c: [100, 46], k: [100, 32], t: [100, 17], h: [100, 86], g: [100, 108], ch: [99, 126], m: [104, 128] },
    B: { d: [102, 33], c: [100, 46], k: [100, 32], t: [100, 17], h: [102, 84], g: [126, 82], ch: [150, 80], m: [152, 76] }, do: ['xa'], nhip: 'keo' },
  rev: { A: { d: [162, 82], c: [150, 86], k: [160, 76], t: [168, 90], h: [104, 88], g: [84, 72], ch: [64, 74], m: [60, 70] },
    B: { d: [162, 82], c: [150, 86], k: [160, 76], t: [168, 90], h: [108, 80], g: [122, 52], ch: [102, 48], m: [98, 44] }, do: ['ghe'], nhip: 'keo' },
  dcr: { A: { d: [158, 116], c: [146, 112], k: [140, 104], t: [132, 100], h: [104, 96], g: [80, 72], ch: [62, 82], m: [58, 78] },
    B: { d: [136, 68], c: [128, 80], k: [122, 82], t: [116, 84], h: [104, 96], g: [80, 72], ch: [62, 82], m: [58, 78] }, do: ['gheDoc3'], nhip: 'keo' },
  dbug: { A: { d: [152, 122], c: [140, 124], k: [140, 108], t: [140, 92], h: [96, 124], g: [96, 100], ch: [112, 100], m: [116, 96] },
    B: { d: [152, 122], c: [140, 124], k: [154, 112], t: [170, 116], h: [96, 124], g: [76, 112], ch: [56, 118], m: [52, 114] }, do: ['tham'], nhip: 'deu1500' },
  mcl: { A: { d: [158, 92], c: [146, 98], k: [148, 113], t: [150, 128], h: [100, 104], g: [124, 112], ch: [110, 118], m: [106, 124], g2: [72, 116], ch2: [48, 124], m2: [44, 128] },
    B: { d: [158, 92], c: [146, 98], k: [148, 113], t: [150, 128], h: [100, 104], g: [72, 116], ch: [48, 124], m: [44, 128], g2: [124, 112], ch2: [110, 118], m2: [106, 124] }, do: [], nhip: 'deu350' },
  /* ── CARDIO ── */
  intv: Object.assign({ do: ['mayChay'], nhip: 'deu300' }, di(4)),
  rope: { A: { d: [100, 24], c: [100, 38], k: [90, 56], t: [86, 72], k2: [110, 56], t2: [114, 72], h: [100, 76], g: [96, 103], ch: [96, 128], m: [92, 129], g2: [104, 103], ch2: [104, 128], m2: [108, 129] },
    B: { d: [100, 16], c: [100, 30], k: [90, 48], t: [86, 64], k2: [110, 48], t2: [114, 64], h: [100, 68], g: [96, 95], ch: [96, 120], m: [92, 121], g2: [104, 95], ch2: [104, 120], m2: [108, 121] }, do: ['dayNhay'], nhip: 'deu280' },
  circ: Object.assign({ do: ['ta'], nhip: 'deu700' }, goblet),
  iw20: Object.assign({ do: ['mayChay', 'doc'], nhip: 'deu600' }, di(2)),
  iw40: Object.assign({ do: [], nhip: 'deu650' }, di(0)),
  strc: { A: Object.assign(L2(DUNG), { g2: [99, 103], ch2: [98, 128], m2: [110, 129] }),
    B: Object.assign(L2(DUNG), { k: [96, 64], t: [88, 84], g2: [100, 104], ch2: [86, 86], m2: [82, 80] }), do: [], nhip: 'deu2000' },
};

const dl = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/* tỉ lệ A→B (0..1) theo thời gian ms */
function nhipX(ms, n) {
  if (n === 'giu') return (Math.sin(ms / 700) + 1) / 2;
  if (n && n.startsWith('deu')) { const c = +n.slice(3) || 800, u = ms % (2 * c); return u < c ? dl(u / c) : 1 - dl((u - c) / c); }
  const [di1, ve1] = n === 'keo' ? [1000, 2000] : n === 'cham' ? [3000, 1000] : [2000, 1000];
  const u = ms % (di1 + ve1); return u < di1 ? dl(u / di1) : 1 - dl((u - di1) / ve1);
}
const DAT = 131;
function doVe(p, ds) {   /* đồ dùng (mờ hơn người) */
  let g = '';
  const o = 'opacity=".35"';
  const ghe = (x1, y, x2) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="6" ${o}/><line x1="${x1 + 8}" y1="${y}" x2="${x1 + 8}" y2="${DAT}" stroke-width="3" ${o}/><line x1="${x2 - 8}" y1="${y}" x2="${x2 - 8}" y2="${DAT}" stroke-width="3" ${o}/>`;
  ds.forEach((d) => {
    if (d === 'ghe') g += ghe(70, 95, 150);
    else if (d === 'gheThap') g += ghe(50, 99, 120);
    else if (d === 'gheSau') g += ghe(40, 103, 80);
    else if (d === 'gheLung') g += ghe(40, 99, 88);
    else if (d === 'gheDoc') g += `<line x1="72" y1="97" x2="142" y2="58" stroke-width="6" ${o}/><line x1="84" y1="97" x2="84" y2="${DAT}" stroke-width="3" ${o}/><line x1="128" y1="70" x2="128" y2="${DAT}" stroke-width="3" ${o}/>`;
    else if (d === 'gheDoc2') g += `<line x1="76" y1="104" x2="132" y2="70" stroke-width="6" ${o}/><line x1="90" y1="98" x2="90" y2="${DAT}" stroke-width="3" ${o}/><line x1="122" y1="78" x2="122" y2="${DAT}" stroke-width="3" ${o}/>`;
    else if (d === 'gheDoc3') g += `<line x1="56" y1="82" x2="160" y2="120" stroke-width="6" ${o}/><line x1="70" y1="88" x2="70" y2="${DAT}" stroke-width="3" ${o}/><line x1="146" y1="116" x2="146" y2="${DAT}" stroke-width="3" ${o}/>`;
    else if (d === 'gheDung') g += ghe(84, 95, 118) + `<line x1="88" y1="95" x2="88" y2="44" stroke-width="5" ${o}/>`;
    else if (d === 'xa') g += `<line x1="55" y1="16" x2="145" y2="16" stroke-width="4" opacity=".5"/><line x1="58" y1="16" x2="58" y2="${DAT}" stroke-width="3" opacity=".22"/><line x1="142" y1="16" x2="142" y2="${DAT}" stroke-width="3" opacity=".22"/>`;
    else if (d === 'xaKep') g += `<line x1="86" y1="61" x2="136" y2="61" stroke-width="4" opacity=".5"/><line x1="90" y1="61" x2="90" y2="${DAT}" stroke-width="3" opacity=".22"/><line x1="132" y1="61" x2="132" y2="${DAT}" stroke-width="3" opacity=".22"/>`;
    else if (d === 'hop') g += `<rect x="112" y="110" width="44" height="21" rx="3" stroke-width="3" ${o}/>`;
    else if (d === 'bac') g += `<rect x="84" y="128" width="34" height="4" rx="2" stroke-width="3" ${o}/>`;
    else if (d === 'tham') g += `<line x1="30" y1="${DAT - 1}" x2="175" y2="${DAT - 1}" stroke-width="5" opacity=".18"/>`;
    else if (d === 'mayChay') g += `<line x1="54" y1="129" x2="150" y2="129" stroke-width="6" ${o}/><line x1="146" y1="129" x2="140" y2="62" stroke-width="4" ${o}/><line x1="140" y1="62" x2="124" y2="62" stroke-width="4" ${o}/>`;
    else if (d === 'day') g += `<line x1="${p.t[0]}" y1="${p.t[1]}" x2="182" y2="40" stroke-width="2" stroke-dasharray="4 3" opacity=".6"/><line x1="182" y1="14" x2="182" y2="${DAT}" stroke-width="4" opacity=".22"/>`;
    else if (d === 'dayNhay') g += `<path d="M${p.t[0]} ${p.t[1]} Q100 ${p.ch[1] + 12} ${p.t2[0]} ${p.t2[1]}" stroke-width="2" opacity=".6"/>`;
  });
  return g;
}
function veHinh(svg, id, ms) {
  const H = HINH[id]; if (!H) return;
  const x = nhipX(ms, H.nhip), p = {};
  Object.keys(H.A).forEach((k) => { const a = H.A[k], b = H.B[k] || a; p[k] = [a[0] + (b[0] - a[0]) * x, a[1] + (b[1] - a[1]) * x]; });
  const L = (a, b, w, mo) => (p[a] && p[b] ? `<line x1="${p[a][0].toFixed(1)}" y1="${p[a][1].toFixed(1)}" x2="${p[b][0].toFixed(1)}" y2="${p[b][1].toFixed(1)}" stroke-width="${w}"${mo ? ' opacity=".4"' : ''}/>` : '');
  let g = `<line x1="10" y1="${DAT}" x2="190" y2="${DAT}" stroke-width="2.5" opacity=".22"/>` + doVe(p, H.do || []);
  /* phía xa trước (mờ) */
  g += L('h', 'g2', 6, 1) + L('g2', 'ch2', 6, 1) + L('ch2', 'm2', 5, 1) + L('c', 'k2', 6, 1) + L('k2', 't2', 5, 1);
  g += L('c', 'h', 7) + L('h', 'g', 6) + L('g', 'ch', 6) + L('ch', 'm', 5) + L('c', 'k', 6) + L('k', 't', 5);
  g += `<circle cx="${p.d[0].toFixed(1)}" cy="${p.d[1].toFixed(1)}" r="8.5" fill="currentColor" stroke="none"/>`;
  const ta = (q) => `<rect x="${(q[0] - 9).toFixed(1)}" y="${(q[1] - 4.5).toFixed(1)}" width="18" height="9" rx="3" fill="var(--t-bg,#fff)" stroke-width="3"/>`;
  if ((H.do || []).includes('ta')) g += ta(p.t);
  if ((H.do || []).includes('ta2') && p.t2) g += ta(p.t2);
  svg.innerHTML = g;
}
/* gắn vào 1 khung gốc: vẽ mọi [data-fig] ĐANG HIỆN (trong <details open>) mỗi khung hình; trả hàm dừng */
export function chayHinh(root) {
  let an = 0;
  const vong = (ts) => {
    root.querySelectorAll('details[open] [data-fig]').forEach((el) => {
      let s = el.firstElementChild;
      if (!s) { el.innerHTML = '<svg viewBox="0 0 200 140" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></svg>'; s = el.firstElementChild; }
      veHinh(s, el.dataset.fig, ts);
    });
    an = requestAnimationFrame(vong);
  };
  an = requestAnimationFrame(vong);
  return () => cancelAnimationFrame(an);
}
