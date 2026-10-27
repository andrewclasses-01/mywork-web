/* web/sw.js — myWork (v2.6.0, 27/10/2026): MỞ APP KHI MẤT MẠNG (bản web/điện thoại; Electron không dùng).
   Mạng TRƯỚC: có mạng luôn lấy bản mới (sửa app vẫn lên ngay) rồi cất bản sao; mạng hỏng hoặc chậm quá 4 giây ⇒ dùng bản đã cất.
   Chỉ giữ tệp của chính trang + phông Google. KHÔNG đụng Firebase (dữ liệu đã có bộ đệm riêng của Firestore),
   KHÔNG đụng tệp nhạc (nhac.js tự cất ở Cache `mywork-nhac`). */
const KHO = 'mywork-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('mywork-app-') && k !== KHO) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  const cungNha = u.origin === self.location.origin, phong = /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!(cungNha || phong) || (cungNha && u.pathname.startsWith('/__nhac/'))) return;
  /* mở trang (kể cả ?app=mywork) ⇒ cùng 1 bản index đã cất */
  const khoa = r.mode === 'navigate' ? self.registration.scope : r.url;
  e.respondWith((async () => {
    const c = await caches.open(KHO);
    const net = fetch(r).then((res) => { if ((res.ok && !res.redirected) || res.type === 'opaque') c.put(khoa, res.clone()).catch(() => {}); return res; });
    net.catch(() => {});
    try {
      return await Promise.race([net, new Promise((_, khong) => setTimeout(() => khong(new Error('cham')), 4000))]);
    } catch (err) {
      const cu = await c.match(khoa);
      return cu || net;
    }
  })());
});
