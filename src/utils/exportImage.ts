/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chuanHoaTiengViet } from '../data/loiChucData.ts';

/**
 * Xuất ảnh thiệp chúc mừng tỷ lệ 9:16 chuẩn Glassmorphism chất lượng cao,
 * bảo đảm 100% tiếng Việt không bị mất chữ đầu hay dấu.
 */
export const xuatAnhLoiChuc = async (
  tenNguoiDung: string,
  noiDungLoiChuc: string
): Promise<Blob> => {
  // Chờ tải toàn bộ font hệ thống và Be Vietnam Pro
  if (document.fonts) {
    await document.fonts.ready;
  }

  const chieuRong = 1080;
  const chieuCao = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = chieuRong;
  canvas.height = chieuCao;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Không thể khởi tạo ngữ cảnh vẽ ảnh');
  }

  // 1. Vẽ nền gradient chuyển sắc dịu dàng
  const gradientNen = ctx.createLinearGradient(0, 0, chieuRong, chieuCao);
  gradientNen.addColorStop(0, '#FFF9FC');
  gradientNen.addColorStop(0.25, '#FFE6A7');
  gradientNen.addColorStop(0.55, '#FFB7C5');
  gradientNen.addColorStop(0.8, '#C8B6FF');
  gradientNen.addColorStop(1, '#B8E7FF');
  ctx.fillStyle = gradientNen;
  ctx.fillRect(0, 0, chieuRong, chieuCao);

  // 2. Vẽ các đốm sáng bokeh và hạt ánh sáng lung linh phía sau
  const soHat = 40;
  for (let i = 0; i < soHat; i++) {
    const x = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * chieuRong;
    const y = (Math.cos(i * 33 + 2) * 0.5 + 0.5) * chieuCao;
    const r = 40 + ((i * 17) % 60);

    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Tọa độ thẻ Glassmorphism trung tâm
  const leTrai = 90;
  const leTren = 260;
  const rongThe = chieuRong - leTrai * 2;
  const caoThe = chieuCao - leTren * 2;
  const boGoc = 64;

  // Vẽ bóng đổ thẻ
  ctx.save();
  ctx.shadowColor = 'rgba(116, 90, 158, 0.22)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 24;

  // Nền kính mờ
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.beginPath();
  ctx.roundRect(leTrai, leTren, rongThe, caoThe, boGoc);
  ctx.fill();
  ctx.restore();

  // Viền sáng kính
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(leTrai, leTren, rongThe, caoThe, boGoc);
  ctx.stroke();
  ctx.restore();

  // 4. Bố cục nội dung văn bản trong thẻ (được chuẩn hóa NFC)
  const tenChuan = chuanHoaTiengViet(tenNguoiDung.trim());
  const loiChucChuan = chuanHoaTiengViet(noiDungLoiChuc.trim());

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Biểu tượng đóa hoa / trái tim trang trí trên đỉnh thẻ
  ctx.font = '600 48px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#C8B6FF';
  ctx.fillText('🌸', chieuRong / 2, leTren + 120);

  // Tiêu đề: Chúc mừng ngày Phụ nữ Việt Nam 20/10 (chia thành 2 dòng chuẩn, không ngắt đôi từ Việt Nam)
  ctx.font = '700 44px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#745A9E';
  ctx.fillText(
    chuanHoaTiengViet('Chúc mừng ngày Phụ nữ'),
    chieuRong / 2,
    leTren + 190
  );
  ctx.fillText(
    chuanHoaTiengViet('Việt Nam 20/10'),
    chieuRong / 2,
    leTren + 245
  );

  // Đường kẻ phân cách tinh tế
  ctx.strokeStyle = 'rgba(200, 182, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chieuRong / 2 - 160, leTren + 290);
  ctx.lineTo(chieuRong / 2 + 160, leTren + 290);
  ctx.stroke();

  // Lời chào: Thân gửi [Tên người dùng],
  ctx.font = '600 44px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#745A9E';
  ctx.fillText(
    chuanHoaTiengViet(`Thân gửi ${tenChuan},`),
    chieuRong / 2,
    leTren + 375
  );

  // Nội dung lời chúc (ngắt dòng an toàn theo từ, giữ nguyên vẹn toàn bộ ký tự)
  ctx.font = '400 38px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#4A3B66';

  const cacTu = loiChucChuan.split(' ');
  const cacDong: string[] = [];
  let dongHienTai = '';
  const chieuRongToiDa = rongThe - 180;

  for (let i = 0; i < cacTu.length; i++) {
    const tu = cacTu[i];
    const thuDong = dongHienTai ? `${dongHienTai} ${tu}` : tu;
    const doRong = ctx.measureText(thuDong).width;
    if (doRong > chieuRongToiDa && dongHienTai) {
      cacDong.push(dongHienTai);
      dongHienTai = tu;
    } else {
      dongHienTai = thuDong;
    }
  }
  if (dongHienTai) {
    cacDong.push(dongHienTai);
  }

  // Tọa độ vẽ các dòng lời chúc
  const chieuCaoDong = 68;
  const tongChieuCaoVanBan = cacDong.length * chieuCaoDong;
  const viTriBDDau = leTren + 460 + (460 - tongChieuCaoVanBan) / 2;

  cacDong.forEach((dong, idx) => {
    ctx.fillText(dong, chieuRong / 2, viTriBDDau + idx * chieuCaoDong);
  });

  // Dòng kết: Chúc bạn một ngày thật rực rỡ!
  ctx.font = '600 42px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#745A9E';
  ctx.fillText(
    chuanHoaTiengViet('Chúc bạn một ngày thật rực rỡ!'),
    chieuRong / 2,
    leTren + caoThe - 140
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Không thể tạo file ảnh'));
      }
    }, 'image/png');
  });
};
