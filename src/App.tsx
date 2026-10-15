/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, Share2 } from 'lucide-react';
import { DANH_SACH_LOI_CHUC, chuanHoaTiengViet } from './data/loiChucData.ts';
import { MagicalBloomCanvas, type AppState } from './components/MagicalBloomCanvas.tsx';
import { RoseVineBorder } from './components/RoseVineBorder.tsx';
import { FallingFlowersCanvas } from './components/FallingFlowersCanvas.tsx';
import { musicBox } from './utils/audioPlayer.ts';
import { xuatAnhLoiChuc } from './utils/exportImage.ts';
import { chayKiemTraNoiBo } from './utils/textCheck.ts';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [tenNguoiDung, setTenNguoiDung] = useState<string>('');
  const [chiSoLoiChuc, setChiSoLoiChuc] = useState<number>(0);
  const [dangPhatNhac, setDangPhatNhac] = useState<boolean>(true);
  const [dangChiaSe, setDangChiaSe] = useState<boolean>(false);

  // Hiệu ứng typewriter và hoa rơi
  const [soKyTuHienThi, setSoKyTuHienThi] = useState<number>(1);
  const [daGoXong, setDaGoXong] = useState<boolean>(false);
  const [kichHoatHoaRoi, setKichHoatHoaRoi] = useState<boolean>(false);

  // Cờ khóa đảm bảo hiệu ứng gõ chữ CHỈ CHẠY 1 LẦN DUY NHẤT
  const daChayGoChuRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typewriterTimerRef = useRef<number | null>(null);

  // Tách câu chúc thành các cụm ký tự Unicode an toàn (grapheme cluster)
  // Bảo đảm không bao giờ mất ký tự đầu tiên hay dấu tiếng Việt
  const cacKyTuLoiChuc = useMemo(() => {
    const chuoiGoc = chuanHoaTiengViet(DANH_SACH_LOI_CHUC[chiSoLoiChuc] || '');
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(chuoiGoc), (item) => item.segment);
    }
    return Array.from(chuoiGoc);
  }, [chiSoLoiChuc]);

  // Kiểm tra tính toàn vẹn văn bản tiếng Việt khi ứng dụng khởi chạy
  useEffect(() => {
    const kqKiemTra = chayKiemTraNoiBo();
    if (!kqKiemTra.thanhCong) {
      console.error('Cảnh báo phát hiện lỗi văn bản tiếng Việt:', kqKiemTra.chiTiet);
    }

    // Tự động kích hoạt nhạc nền theo mặc định
    musicBox.start();
    setDangPhatNhac(musicBox.getIsPlaying());

    const handleFirstTouch = () => {
      if (musicBox.getIsPlaying()) {
        musicBox.start();
      }
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };

    window.addEventListener('pointerdown', handleFirstTouch, { once: true });
    window.addEventListener('keydown', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };
  }, []);

  // Xử lý hiệu ứng gõ chữ Typewriting: CHỈ CHẠY 1 LẦN DUY NHẤT
  useEffect(() => {
    // Chỉ chạy khi bước vào màn hình lời chúc
    if (appState !== 'wishRevealing' && appState !== 'completed') {
      return;
    }

    // Nếu đã gõ xong 1 lần rồi thì KHÔNG chạy lại
    if (daChayGoChuRef.current) {
      setSoKyTuHienThi(cacKyTuLoiChuc.length);
      setDaGoXong(true);
      setKichHoatHoaRoi(true);
      return;
    }

    // Bắt đầu gõ lần đầu tiên
    setSoKyTuHienThi(1);
    setDaGoXong(false);

    const tongSoKyTu = cacKyTuLoiChuc.length;
    let dem = 1;

    typewriterTimerRef.current = window.setInterval(() => {
      dem++;
      if (dem <= tongSoKyTu) {
        setSoKyTuHienThi(dem);
      } else {
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        // Đánh dấu đã gõ xong vĩnh viễn (chỉ chạy 1 lần duy nhất)
        daChayGoChuRef.current = true;
        setDaGoXong(true);
        // Kích hoạt hiệu ứng hoa tung tràn màn hình và rơi phân bổ đều
        setKichHoatHoaRoi(true);
      }
    }, 38);

    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
      }
    };
  }, [appState, cacKyTuLoiChuc]);

  // Đếm số ký tự Unicode theo chuẩn grapheme cluster
  const demKyTuUnicode = (vanBan: string): number => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(vanBan)).length;
    }
    return vanBan.length;
  };

  const handleThayDoiTen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const giaTri = e.target.value;
    const soKyTu = demKyTuUnicode(giaTri);
    if (soKyTu <= 40) {
      setTenNguoiDung(chuanHoaTiengViet(giaTri));
    }
  };

  // Xử lý gửi tên và bắt đầu chuỗi hiệu ứng
  const handleGui = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tenHopLe = chuanHoaTiengViet(tenNguoiDung.trim());
    if (!tenHopLe || appState !== 'idle') return;

    if (inputRef.current) {
      inputRef.current.blur();
    }

    if (dangPhatNhac) {
      musicBox.start();
    }

    const chiSoNgauNhien = Math.floor(Math.random() * DANH_SACH_LOI_CHUC.length);
    setChiSoLoiChuc(chiSoNgauNhien);
    daChayGoChuRef.current = false;
    setAppState('shrinking');
  };

  // Điều phối chuyển giai đoạn từ Canvas
  const handleAnimationPhaseComplete = (phase: AppState) => {
    setAppState(phase);
  };

  // Bật/tắt nhạc nền
  const handleBatTatNhac = () => {
    const trangThaiMoi = musicBox.toggle();
    setDangPhatNhac(trangThaiMoi);
  };

  // Nút duy nhất: Chia sẻ lời chúc
  const handleChiaSe = async () => {
    if (dangChiaSe) return;
    setDangChiaSe(true);

    try {
      const tenChuan = chuanHoaTiengViet(tenNguoiDung.trim());
      const loiChucChuan = chuanHoaTiengViet(DANH_SACH_LOI_CHUC[chiSoLoiChuc]);
      const blob = await xuatAnhLoiChuc(tenChuan, loiChucChuan);
      const file = new File([blob], 'loi-chuc-20-10.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: chuanHoaTiengViet('Chúc mừng ngày Phụ nữ Việt Nam 20/10'),
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'loi-chuc-20-10.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch {
      // Bỏ qua lỗi hủy thao tác chia sẻ
    } finally {
      setDangChiaSe(false);
    }
  };

  // Chuỗi lời chúc đang hiển thị theo hiệu ứng gõ
  const vanBanHienThi = cacKyTuLoiChuc.slice(0, soKyTuHienThi).join('');
  // Tiến trình gõ chữ từ 0 đến 1 đồng bộ với dây leo
  const tienTrinhGiamGia =
    cacKyTuLoiChuc.length > 0 ? Math.min(1, soKyTuHienThi / cacKyTuLoiChuc.length) : 0;
  const tenHienThi = chuanHoaTiengViet(tenNguoiDung.trim());

  const isScreenInitial = appState === 'idle' || appState === 'shrinking';
  const isScreenResult =
    appState === 'cardMorphing' ||
    appState === 'wishRevealing' ||
    appState === 'completed';

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden dreamy-gradient-bg flex flex-col justify-between items-center px-4 py-6 sm:py-8">
      {/* Nút điều khiển âm thanh ở góc trên bên phải */}
      <button
        type="button"
        onClick={handleBatTatNhac}
        className="fixed top-5 right-5 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-md text-[#745A9E] active:scale-95 transition-transform"
        aria-label={dangPhatNhac ? 'Tắt nhạc' : 'Bật nhạc'}
      >
        {dangPhatNhac ? (
          <Volume2 className="w-5 h-5 text-[#745A9E]" />
        ) : (
          <VolumeX className="w-5 h-5 text-[#745A9E]/60" />
        )}
      </button>

      {/* Mạng lưới ánh sáng và hiệu ứng hoa nở trên Canvas */}
      <MagicalBloomCanvas
        appState={appState}
        onAnimationPhaseComplete={handleAnimationPhaseComplete}
      />

      {/* Hiệu ứng hoa tung tràn màn hình và phân bổ đều rơi xuống khi gõ xong lời chúc */}
      <FallingFlowersCanvas active={kichHoatHoaRoi} />

      {/* MÀN HÌNH NHẬP TÊN */}
      {isScreenInitial && (
        <div
          className={`relative z-20 flex flex-col items-center justify-center w-full max-w-sm my-auto transition-all duration-700 ease-out ${
            appState === 'shrinking'
              ? 'opacity-0 scale-50 pointer-events-none translate-y-6'
              : 'opacity-100 scale-100'
          }`}
        >
          {/* Tiêu đề */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#745A9E] mb-3 leading-snug tracking-tight px-2">
            20/10 – Một điều đặc biệt dành cho bạn
          </h1>

          {/* Mô tả */}
          <p className="text-sm sm:text-base text-center text-[#745A9E]/85 mb-8 px-4 leading-relaxed font-normal">
            Hãy để lại tên của bạn, một lời chúc đang chờ được gửi đến...
          </p>

          {/* Thẻ nhập tên Glassmorphism */}
          <form
            onSubmit={handleGui}
            className="w-full glass-card p-6 sm:p-7 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="tenInput"
                className="text-sm font-semibold text-[#745A9E] px-1"
              >
                Bạn tên là gì nhỉ?
              </label>

              <input
                id="tenInput"
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={tenNguoiDung}
                onChange={handleThayDoiTen}
                placeholder="Nhập tên của bạn..."
                className="w-full px-4 py-3.5 glass-input text-base font-medium placeholder-[#745A9E]/50"
              />
            </div>

            <button
              type="submit"
              disabled={!tenNguoiDung.trim() || appState !== 'idle'}
              className="w-full py-3.5 px-6 glass-button-primary font-semibold text-base flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* MÀN HÌNH KẾT QUẢ – THẺ LỜI CHÚC GLASSMORPHISM VỚI DÂY LEO HOA HỒNG QUẤN 3D */}
      {isScreenResult && (
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm my-auto">
          {/* Container chứa thẻ và dây leo quấn từ trước ra sau xuyên qua thẻ kính */}
          <div className="relative w-full">
            {/* 1. LỚP DÂY LEO MẶT SAU (LAYER: BACK) - Nằm sau kính, nhìn mờ ảo qua lớp kính mờ */}
            <RoseVineBorder progress={tienTrinhGiamGia} layer="back" />

            {/* 2. THẺ KÍNH CHÍNH (GLASS CARD) */}
            <div
              className={`relative z-10 w-full glass-card pt-9 pb-7 px-6 sm:px-8 flex flex-col text-center transition-all duration-700 ease-out ${
                appState === 'cardMorphing'
                  ? 'opacity-0 scale-90 translate-y-4'
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {/* Tiêu đề dạng chuẩn theo mẫu: không bị ngắt đôi "Việt Nam" */}
              <h2 className="text-lg sm:text-xl font-bold text-[#745A9E] mb-2 leading-snug tracking-tight text-center">
                <span>Chúc mừng ngày Phụ nữ</span>
                <br />
                <span className="whitespace-nowrap">Việt Nam 20/10</span>
              </h2>

              {/* Đường kẻ mỏng nhẹ */}
              <div className="w-16 h-0.5 bg-[#C8B6FF]/50 mx-auto my-3 rounded-full" />

              {/* Lời chào với tên người dùng */}
              <h3 className="text-base sm:text-lg font-semibold text-[#745A9E] mb-4">
                {`Thân gửi ${tenHienThi},`}
              </h3>

              {/* Nội dung lời chúc: Gõ chữ 1 lần duy nhất, dây leo chạy đồng bộ */}
              <div className="min-h-[110px] flex items-center justify-center">
                <p className="text-sm sm:text-base font-normal text-[#4A3B66] leading-relaxed select-text">
                  {vanBanHienThi}
                  {!daGoXong && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-[#C8B6FF] animate-pulse rounded-full align-middle" />
                  )}
                </p>
              </div>

              {/* Dòng kết */}
              <div className="mt-5 pt-3 border-t border-[#C8B6FF]/35">
                <p className="text-sm sm:text-base font-semibold text-[#745A9E]">
                  Chúc bạn một ngày thật rực rỡ!
                </p>
              </div>
            </div>

            {/* 3. LỚP DÂY LEO MẶT TRƯỚC (LAYER: FRONT) - Nằm trên mặt kính, vắt qua mép thẻ tạo chiều sâu 3D */}
            <RoseVineBorder progress={tienTrinhGiamGia} layer="front" />
          </div>

          {/* Duy nhất 1 nút chức năng: Chia sẻ lời chúc */}
          <div
            className={`w-full flex flex-col items-center mt-5 transition-all duration-500 ease-out ${
              daGoXong || appState === 'completed'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={handleChiaSe}
              disabled={dangChiaSe}
              className="w-full py-3.5 px-6 glass-button-primary font-semibold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-transform disabled:opacity-50"
            >
              <Share2 className="w-5 h-5 text-white" />
              <span>Chia sẻ lời chúc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
