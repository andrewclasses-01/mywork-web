/* web/tap/giao-an.js — GIÁO ÁN MẶC ĐỊNH của mục Tập luyện (myWork v2.4.0, 26/10/2026)
   Chỉ dùng để TẠO hồ sơ lần đầu. Giáo án THẬT nằm trên Firebase: mwUsers/{uid}/tap/hoso, trường `ga`
   = danh sách phiên bản [{tu:'YYYY-MM-DD', ten, LIB, SESS, BYDOW}] — ngày nào dùng phiên bản có `tu` gần nhất ≤ ngày đó
   ⇒ Claude đổi giáo án = thêm phiên bản mới, ngày cũ giữ nguyên bài cũ.
   LIB: loai kg = tạ × lần · lan = chỉ số lần · giay = giữ bao nhiêu giây · tick = chỉ tích xong (mỗi hiệp = 1 vòng)
   SESS: items = [mã bài, số hiệp, số lần, 1 nếu "mỗi bên"] · BYDOW: mã buổi theo thứ (0 = CN) */
export const LIB={
 dbp:{ten:'Đẩy ngực ghế phẳng',loai:'kg',cach:['Nằm ghế, 2 bàn chân bám chắc sàn, ép 2 bả vai xuống ghế.','Hạ tạ chậm 2–3 giây tới ngang ngực, khuỷu tay chếch khoảng 45° so với thân.','Đẩy thẳng lên và thở ra, không khoá cứng khuỷu ở trên.'],loi:['Bung khuỷu tay ngang vai 90° (dễ đau vai).','Nảy tạ ở điểm thấp nhất.']},
 pull:{ten:'Kéo xà',loai:'lan',cach:['Nắm rộng hơn vai một chút, lòng bàn tay hướng ra trước.','Kéo ngực về phía xà, nghĩ như "kéo khuỷu tay xuống túi quần".','Hạ chậm tới khi tay gần thẳng.'],loi:['Đung đưa người lấy đà.','Chỉ kéo nửa đường.'],de:'Chưa kéo được: móc dây kháng lực dưới đầu gối, hoặc nhảy lên rồi hạ người thật chậm 5 giây.'},
 idbp:{ten:'Đẩy ngực ghế dốc',loai:'kg',cach:['Chỉnh ghế dốc khoảng 30° (khoảng 2 nấc).','Hạ tạ về phía ngực trên, khuỷu tay chếch xuống.','Đẩy lên theo đường hơi chụm vào trên mặt.'],loi:['Ghế dốc quá (thành bài vai).']},
 row1:{ten:'Chèo tạ 1 tay',loai:'kg',cach:['Một tay và một gối tì lên ghế, lưng phẳng song song sàn.','Kéo tạ về phía hông (không phải lên ngực).','Hạ chậm, cảm thấy lưng xô được kéo giãn.'],loi:['Xoay vặn thân để kéo.','Gù lưng.']},
 sp:{ten:'Đẩy vai',loai:'kg',cach:['Ghế dựng gần thẳng đứng, lưng tựa sát.','Tạ bắt đầu ngang tai, đẩy thẳng lên trên đầu.','Hạ chậm về ngang tai.'],loi:['Ưỡn lưng quá nhiều khi đẩy.']},
 dip:{ten:'Dip xà kép',loai:'lan',cach:['Chống thẳng tay trên xà kép, người hơi đổ về trước.','Hạ người tới khi khuỷu tay gập khoảng 90°.','Đẩy lên tới gần thẳng tay.'],loi:['Hạ quá sâu (đau vai).'],de:'Chưa làm được: móc dây kháng lực dưới gối, hoặc chỉ hạ chậm 5 giây.'},
 lat:{ten:'Dang tay ngang',loai:'kg',cach:['Đứng thẳng, tay hơi cong ở khuỷu.','Dang tạ sang ngang tới ngang vai, như rót nước từ bình.','Hạ chậm 2 giây.'],loi:['Dùng tạ quá nặng rồi vung người.']},
 gsq:{ten:'Goblet squat',loai:'kg',cach:['Ôm 1 quả tạ dựng đứng sát ngực, chân rộng hơn vai, mũi chân hơi mở.','Ngồi xuống như ngồi ghế thấp, gối đi theo hướng mũi chân, lưng thẳng.','Đạp gót đứng lên.'],loi:['Gối chụm vào trong.','Nhón gót, gù lưng.']},
 rdl:{ten:'Romanian deadlift',loai:'kg',cach:['Cầm 2 tạ trước đùi, gối hơi chùng và giữ nguyên.','Đẩy mông ra sau, gập hông, tạ trượt sát dọc chân xuống tới giữa ống quyển.','Siết mông đứng thẳng lên. Phải thấy căng mạnh ở đùi sau.'],loi:['Gù lưng.','Gập gối thành squat.']},
 bss:{ten:'Bulgarian squat',loai:'kg',cach:['Gác mu bàn chân sau lên ghế, chân trước bước xa khoảng 2 bàn chân.','Hạ thẳng người xuống tới khi đùi trước gần song song sàn.','Đạp chân trước đứng lên. Làm hết 1 chân rồi đổi chân.'],loi:['Chân trước đặt quá gần ghế.']},
 ht:{ten:'Hip thrust',loai:'kg',cach:['Tựa bả vai lên cạnh ghế, đặt 1 tạ trên hông (lót khăn).','Đẩy hông lên tới khi thân thẳng từ vai tới gối.','Siết mông 1 giây ở trên rồi hạ.'],loi:['Ưỡn lưng thay vì đẩy bằng mông.']},
 calf:{ten:'Nhón gót',loai:'kg',cach:['Đứng trên mép bậc/thanh gỗ, cầm tạ một bên tay.','Nhón cao hết cỡ, giữ 1 giây.','Hạ gót xuống thấp hơn mép bậc.'],loi:['Nhún nảy nhanh.']},
 hkr:{ten:'Treo xà co gối',loai:'lan',cach:['Treo người trên xà đơn, vai siết lại (không treo lủng lẳng).','Cuộn hông, kéo gối lên ngực.','Hạ chậm, không đung đưa.'],loi:['Vung chân lấy đà.']},
 plank:{ten:'Plank',loai:'giay',cach:['Chống khuỷu tay ngay dưới vai.','Người thẳng từ đầu tới gót, siết bụng và mông.','Thở đều.'],loi:['Võng hông hoặc chổng mông.']},
 chin:{ten:'Chin-up',loai:'lan',cach:['Nắm rộng bằng vai, lòng bàn tay hướng về mặt.','Kéo cằm qua xà.','Hạ chậm hết tay.'],loi:['Đung đưa.'],de:'Chưa kéo được: dùng dây kháng lực hoặc chỉ hạ chậm.'},
 csrow:{ten:'Chèo tạ nằm sấp',loai:'kg',cach:['Ghế dốc khoảng 30–45°, nằm sấp, ngực tì ghế.','Kéo 2 tạ về phía hông, ép 2 bả vai lại.','Hạ chậm.'],loi:['Nhấc ngực khỏi ghế.']},
 arn:{ten:'Arnold press',loai:'kg',cach:['Ngồi, tạ trước mặt, lòng bàn tay hướng vào mặt.','Vừa đẩy lên vừa xoay để lòng bàn tay hướng ra trước.','Hạ và xoay ngược lại.'],loi:['Đẩy quá nhanh, mất kiểm soát.']},
 fp:{ten:'Face pull',loai:'lan',cach:['Buộc dây ngang tầm mặt.','Kéo dây về phía trán, tách 2 tay ra 2 bên tai.','Giữ 1 giây, ép bả vai.'],loi:['Kéo bằng lưng dưới.']},
 curl:{ten:'Cuốn tạ tay',loai:'kg',cach:['Đứng thẳng, khuỷu tay sát thân.','Cuốn tạ lên, xoay ngửa cổ tay.','Hạ chậm 2 giây.'],loi:['Đẩy hông lấy đà.']},
 ohe:{ten:'Duỗi tay sau đầu',loai:'kg',cach:['Ngồi, 2 tay cầm 1 quả tạ, đưa lên trên đầu.','Hạ tạ ra sau gáy, khuỷu tay hướng lên trần.','Duỗi thẳng tay lên.'],loi:['Khuỷu tay bung rộng ra 2 bên.']},
 lunge:{ten:'Lunge lùi',loai:'kg',cach:['Cầm 2 tạ, đứng thẳng.','Bước lùi 1 chân, hạ gối sau gần chạm sàn.','Đạp chân trước về tư thế đứng. Đổi chân.'],loi:['Gối trước đổ vào trong.']},
 step:{ten:'Bước lên ghế',loai:'kg',cach:['Đặt cả bàn chân lên ghế.','Đạp chân trên để đứng hẳn lên ghế (chân dưới không đẩy).','Bước xuống chậm.'],loi:['Ghế cao quá đầu gối.']},
 gsqt:{ten:'Goblet squat chậm',loai:'kg',cach:['Như goblet squat, nhưng đếm 3 giây khi hạ người.','Dừng 1 giây ở dưới.','Đứng lên bình thường.'],loi:['Hạ nhanh dần ở các lần cuối.']},
 slb:{ten:'Nâng hông 1 chân',loai:'lan',cach:['Nằm ngửa, 1 chân co, 1 chân duỗi thẳng.','Đạp gót chân co để nâng hông lên.','Siết mông 1 giây, hạ chậm.'],loi:['Xoay lệch hông.']},
 hlr:{ten:'Treo xà nâng chân',loai:'lan',cach:['Treo xà, vai siết.','Giữ chân thẳng, nâng lên tới ngang hông hoặc cao hơn.','Hạ chậm.'],loi:['Đung đưa.'],de:'Nặng quá: co gối như bài co gối lên ngực.'},
 rev:{ten:'Gập bụng dưới',loai:'lan',cach:['Nằm trên tựa, tay bám chắc.','Cuộn hông, nhấc mông lên, kéo gối về ngực.','Hạ chậm.'],loi:['Vung chân.']},
 intv:{ten:'Chạy ngắt quãng',loai:'tick',cach:['Khởi động 5 phút đi nhanh.','Mỗi vòng: chạy nhanh 30 giây (mức thở hổn hển) → đi bộ 90 giây.','Tích 1 ô sau mỗi vòng.'],loi:['Chạy nhanh quá ở vòng đầu rồi bỏ dở.']},
 rope:{ten:'Nhảy dây',loai:'tick',cach:['Nhảy thấp, bằng mũi chân, khuỷu tay sát thân.','Mỗi lượt 1 phút, nghỉ 30 giây.'],loi:['Nhảy cao, tiếp đất bằng gót.']},
 dcr:{ten:'Gập bụng ghế dốc',loai:'lan',cach:['Móc chân vào ghế dốc xuống.','Cuộn từng đốt sống lên, không giật cổ.','Hạ chậm.'],loi:['Kéo cổ bằng tay.']},
 dbug:{ten:'Dead bug',loai:'lan',cach:['Nằm ngửa, 2 tay hướng lên trần, gối co 90°.','Duỗi tay trái + chân phải ra xa, lưng dưới luôn ép sàn.','Đổi bên. Mỗi bên tính 1 lần.'],loi:['Lưng dưới bị cong lên khỏi sàn.']},
 splk:{ten:'Plank nghiêng',loai:'giay',cach:['Chống 1 khuỷu tay, người nghiêng thẳng.','Nâng hông, giữ người thẳng.'],loi:['Xệ hông.']},
 mcl:{ten:'Mountain climber',loai:'giay',cach:['Tư thế chống đẩy.','Kéo luân phiên từng gối về ngực, nhanh mà vẫn giữ hông thấp.'],loi:['Chổng mông.']},
 circ:{ten:'Vòng tròn toàn thân',loai:'tick',cach:['Mỗi vòng làm liền: goblet squat 12 · hít đất 12 · chèo tạ 2 tay 12 · vung tạ tay qua háng 15 · nhảy dây 1 phút.','Nghỉ 2 phút giữa các vòng. Tích 1 ô sau mỗi vòng.'],loi:['Bỏ tư thế đúng để làm cho nhanh.']},
 iw20:{ten:'Đi bộ dốc',loai:'tick',cach:['Dốc 8–10%, tốc độ 5 km/h.','Vẫn nói chuyện được là đúng mức.'],loi:[]},
 iw40:{ten:'Đi bộ nhẹ',loai:'tick',cach:['Dốc 4–6%, tốc độ 5 km/h, thoải mái.'],loi:[]},
 strc:{ten:'Giãn cơ',loai:'tick',cach:['Đùi trước, đùi sau, mông, ngực, vai, lưng — mỗi chỗ 30–45 giây.','Thở chậm, không nhún.'],loi:[]}
};
export const SESS={
 TA:{ten:'Thân trên A',phu:'Ngực · vai · tay sau',ic:'dumb',phut:65,items:[['dbp',4,'6–10'],['pull',4,'tối đa'],['idbp',3,'8–12'],['row1',3,'10–12',1],['sp',3,'8–12'],['dip',3,'tối đa'],['lat',3,'12–15']]},
 DA:{ten:'Thân dưới A',phu:'Đùi trước · mông · bụng',ic:'dumb',phut:65,items:[['gsq',4,'8–12'],['rdl',4,'8–12'],['bss',3,'8–10',1],['ht',3,'10–12'],['calf',3,'12–15'],['hkr',3,'10–15'],['plank',3,'30–45s']]},
 CD:{ten:'Cardio + bụng',phu:'Tim phổi · bụng',ic:'fire',phut:45,items:[['intv',10,'30s/90s'],['rope',5,'1 phút'],['dcr',3,'12'],['dbug',3,'10',1],['splk',3,'30s',1],['mcl',3,'30s']]},
 TB:{ten:'Thân trên B',phu:'Lưng · xô · tay trước',ic:'dumb',phut:65,items:[['chin',4,'tối đa'],['csrow',4,'8–12'],['dbp',3,'10–12'],['arn',3,'10–12'],['fp',3,'15'],['curl',3,'10–12'],['ohe',3,'10–12']]},
 DB:{ten:'Thân dưới B',phu:'Đùi sau · mông · bụng',ic:'dumb',phut:65,items:[['rdl',4,'6–10'],['lunge',3,'10',1],['step',3,'10',1],['gsqt',3,'10–12'],['slb',3,'12',1],['hlr',3,'8–12'],['rev',3,'15']]},
 TT:{ten:'Toàn thân',phu:'Sức bền toàn thân',ic:'bolt',phut:55,items:[['circ',4,'vòng'],['iw20',1,'20 phút']]},
 NN:{ten:'Nghỉ chủ động',phu:'Đi bộ · giãn cơ · 18h',ic:'leaf',phut:55,items:[['iw40',1,'40 phút'],['strc',1,'15 phút']]}
};
export const BYDOW=['NN','TA','DA','CD','TB','DB','TT'];

/* ───── GIÁO ÁN v2 (thầy duyệt 30/10/2026, áp từ T2 2/11) ─────
   Máy chạy dốc CỐ ĐỊNH 8% (chỉ đi, không chạy) · đạp đồi CHIỀU T3 + T7 (2 km tới chân đồi + leo 3 km) · T7 trên đỉnh có xà chắc ⇒ vòng xà
   · xà/ghế ở nhà lung lay ⇒ bỏ treo xà nâng chân / co gối / bước lên ghế · buổi sáng T2–T7 chọn đi bộ HOẶC đạp xe.
   Buổi mới có thể có `mua` = danh sách bài thay khi trời mưa (thầy bật nút ☔ trong ngày) · `buoi` = nhãn nhóm (Sáng/Chiều) · `ngan` = tên ngắn ở thẻ Tuần. */
export const LIB2 = {
 ...LIB,
 hill:{ten:'Đạp xe lên đồi',loai:'tick',cach:['Đạp nhẹ 2 km từ nhà tới chân đồi để khởi động.','Leo 3 km ở mức hơi khó — chỉ nói được vài từ. Về số nhẹ, đạp đều, ngồi yên trên yên.','Thả dốc xuống chậm, đạp nhẹ về nhà.'],loi:['Đạp số nặng ngay từ chân dốc rồi hết sức giữa đường.']},
 xa7:{ten:'Vòng xà trên đỉnh đồi',loai:'tick',cach:['Mỗi vòng làm liền: kéo xà tối đa → dip tối đa → hít đất 10–15.','Nghỉ 2 phút giữa các vòng. Tích 1 ô sau mỗi vòng.'],loi:['Đung đưa người khi kéo xà.']},
 pu:{ten:'Hít đất',loai:'lan',cach:['Tay đặt rộng hơn vai một chút, người thẳng từ đầu tới gót.','Hạ ngực xuống gần sàn, khuỷu tay chếch khoảng 45° so với thân.','Đẩy lên thẳng tay.'],loi:['Võng hông hoặc chổng mông.']},
 tmi:{ten:'Máy 8% nhanh–chậm',loai:'tick',cach:['Khởi động 5 phút ở 4 km/h.','Mỗi vòng: đi nhanh 1 phút ở 6–6,5 km/h → đi chậm 2 phút ở 4 km/h.','Không vịn tay vào máy. Tích 1 ô sau mỗi vòng.'],loi:['Chạy thay vì đi nhanh.']},
 iw20:{ten:'Đi dốc máy 8%',loai:'tick',cach:['Máy dốc cố định 8%, tốc độ 4,5–5 km/h.','Vẫn nói chuyện được là đúng mức. Không vịn tay vào máy.'],loi:[]},
 hillcn:{ten:'Đạp xe ngắm cảnh',loai:'tick',cach:['Đạp thong thả buổi sáng, vừa đạp vừa nói chuyện được.','Đường đồi hoặc đường đẹp gần nhà, 45–60 phút.'],loi:[]},
 hol:{ten:'Hollow body',loai:'giay',cach:['Nằm ngửa, ép lưng dưới sát sàn.','Nhấc nhẹ đầu, vai và 2 chân duỗi thẳng khỏi sàn, 2 tay duỗi dọc thân.','Giữ, thở đều. Dễ quá thì duỗi 2 tay qua đầu; khó quá thì co gối.'],loi:['Lưng dưới cong lên khỏi sàn.']},
 llr:{ten:'Nâng chân nằm sàn',loai:'lan',cach:['Nằm ngửa, 2 bàn tay lót dưới mông.','Giữ 2 chân thẳng và khép, nâng lên tới khi chỉ thẳng lên trần.','Hạ thật chậm tới sát sàn (không chạm), lưng dưới luôn ép sàn.'],loi:['Thả chân rơi nhanh, lưng dưới cong lên.']},
 ssq:{ten:'Split squat tạ tay',loai:'kg',cach:['Cầm 2 tạ, đứng chân trước chân sau cách nhau khoảng 1 bước dài, gót sau nhấc.','Hạ thẳng người xuống tới khi gối sau gần chạm sàn, đùi trước song song sàn.','Đạp chân trước đứng lên, chân không di chuyển. Làm hết 1 chân rồi đổi.'],loi:['Đổ người về trước, gối trước đổ vào trong.']},
};
const BUNG = [['dcr',3,'12'],['splk',3,'30s',1],['dbug',3,'10',1],['mcl',3,'30s']];
export const SESS2 = {
 TA:{ten:'Thân trên A',ngan:'Trên A',phu:'Ngực · vai · tay sau',ic:'dumb',phut:65,items:[['dbp',4,'6–10'],['pull',4,'tối đa'],['sp',3,'8–12'],['row1',3,'10–12',1],['idbp',3,'8–12'],['lat',3,'12–15'],['dip',3,'tối đa']]},
 DOI3:{ten:'Đạp đồi + bụng',ngan:'Đồi',phu:'Leo đồi · bụng',ic:'bike',phut:80,items:[['hill',1,'2 km + leo 3 km'],...BUNG],
  mua:[['tmi',8,"1' + 2'"],...BUNG]},
 DA:{ten:'Thân dưới A',ngan:'Dưới A',phu:'Đùi trước · mông · bụng',ic:'dumb',phut:65,items:[['gsq',4,'8–12'],['rdl',4,'8–12'],['plank',3,'30–45s'],['bss',3,'8–10',1],['hol',3,'20–40s'],['ht',3,'10–12'],['calf',3,'12–15']]},
 TB:{ten:'Thân trên B',ngan:'Trên B',phu:'Lưng · xô · tay trước',ic:'dumb',phut:65,items:[['chin',4,'tối đa'],['dbp',3,'10–12'],['csrow',4,'8–12'],['arn',3,'10–12'],['curl',3,'10–12'],['fp',3,'15'],['ohe',3,'10–12']]},
 DB:{ten:'Thân dưới B',ngan:'Dưới B',phu:'Đùi sau · mông · bụng',ic:'dumb',phut:65,items:[['rdl',4,'6–10'],['lunge',3,'10',1],['rev',3,'15'],['gsqt',3,'10–12'],['slb',3,'12',1],['llr',3,'10–15'],['ssq',3,'10',1]]},
 DOI7:{ten:'Đạp đồi + xà đỉnh đồi',ngan:'Đồi',phu:'Leo đồi · kéo xà · dip · hít đất',ic:'bike',phut:80,items:[['hill',1,'2 km + leo 3 km'],['xa7',3,'vòng']],
  mua:[['circ',4,'vòng'],['iw20',1,'20 phút']]},
 NN:{ten:'Đạp xe ngắm cảnh',ngan:'Ngắm cảnh',phu:'Đạp thong thả · giãn cơ',ic:'leaf',phut:75,buoi:'Sáng',items:[['hillcn',1,'45–60 phút'],['strc',1,'15 phút']],
  mua:[['iw20',1,'30 phút'],['strc',1,'15 phút']]},
};
export const BYDOW2 = ['NN','TA','DOI3','DA','TB','DB','DOI7'];

/* (v2.7.0) CLIP HƯỚNG DẪN quay thật: mã bài ⇒ tên clip ở Storage mwUsers/{uid}/tapclip/<tên>.mp4 (đẩy bằng tools/day-clip-tap.js).
   Bài không có ở đây ⇒ vẽ người que cũ (hinh.js). */
export const CLIP = Object.fromEntries('arn bss calf chin circ csrow curl dbp dbug dcr dip fp gsq gsqt hill hillcn hol ht idbp iw20 iw40 lat llr lunge mcl ohe plank pu pull rdl rev row1 slb sp splk ssq strc tmi'
  .split(' ').map((k) => [k, k]).concat([['xa7', 'pu']]));
