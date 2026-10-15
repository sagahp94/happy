/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DANH_SACH_LOI_CHUC, chuanHoaTiengViet, kiemTraToanVenVanBan } from '../data/loiChucData.ts';

// 10 chuỗi kiểm thử bắt buộc theo yêu cầu Phần 12
export const CHUOI_KIEM_THU_BAT_BUOC: string[] = [
  "Chúc bạn một ngày 20/10 thật rực rỡ!",
  "Thu Ngân ơi, chúc bạn luôn vui vẻ và hạnh phúc.",
  "Đừng quên dành cho bản thân những điều tốt đẹp.",
  "Ước mong mọi niềm vui sẽ luôn ở bên bạn.",
  "Ánh nắng dịu dàng sẽ mang đến những ngày bình yên.",
  "Ừ thì hôm nay bạn xứng đáng được yêu thương nhiều hơn!",
  "Em hãy luôn tự tin và tỏa sáng theo cách riêng.",
  "Một ngày đặc biệt dành cho những điều tuyệt vời.",
  "Ngọc Ánh, chúc bạn thật nhiều may mắn.",
  "Ỷ Lan, chúc bạn một ngày tràn đầy niềm vui."
];

/**
 * Kiểm tra tính toàn vẹn ký tự đầu tiên và chuẩn Unicode NFC của toàn bộ tập dữ liệu.
 */
export const chayKiemTraNoiBo = (): { thanhCong: boolean; soLoi: number; chiTiet: string[] } => {
  const chiTiet: string[] = [];
  let soLoi = 0;

  // Kiểm tra 60 lời chúc
  DANH_SACH_LOI_CHUC.forEach((chuc, index) => {
    const chucNFC = chuanHoaTiengViet(chuc);
    if (!chucNFC || chucNFC.trim().length === 0) {
      soLoi++;
      chiTiet.push(`Lời chúc #${index + 1} bị rỗng.`);
      return;
    }

    const kyTuDau = chucNFC[0];
    if (kyTuDau === " " || kyTuDau === "\t" || kyTuDau === "\n") {
      soLoi++;
      chiTiet.push(`Lời chúc #${index + 1} có khoảng trắng ở đầu: "${chucNFC}"`);
    }

    const kq = kiemTraToanVenVanBan(chuc, chucNFC);
    if (!kq.hopLe) {
      soLoi++;
      chiTiet.push(`Lời chúc #${index + 1} lỗi toàn vẹn: ${kq.lyDo}`);
    }
  });

  // Kiểm tra 10 chuỗi bắt buộc
  CHUOI_KIEM_THU_BAT_BUOC.forEach((chuoi, index) => {
    const chuoiNFC = chuanHoaTiengViet(chuoi);
    const kq = kiemTraToanVenVanBan(chuoi, chuoiNFC);
    if (!kq.hopLe) {
      soLoi++;
      chiTiet.push(`Chuỗi kiểm thử #${index + 1} lỗi: ${kq.lyDo}`);
    }
  });

  return {
    thanhCong: soLoi === 0,
    soLoi,
    chiTiet,
  };
};
