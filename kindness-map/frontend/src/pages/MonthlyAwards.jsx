import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Award, Star, Heart, Sparkles, Medal, Users, Leaf, ArrowRight } from 'lucide-react';

export const MonthlyAwards = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/awards');
      setAwards(res.data);
    } catch (error) {
      console.error('Failed to fetch awards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
      
      {/* 1. Page Intro Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-8 sm:p-12 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-80 h-80 bg-white/15 dark:bg-slate-800/50 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-3 relative z-10 max-w-2xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/20 text-xs font-black w-fit uppercase tracking-wider self-center md:self-start">
            <Sparkles className="w-4 h-4 text-yellow-200 animate-spin" /> Giải Thưởng Cộng Đồng (Extra Feature)
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Vinh Danh Anh Hùng Việc Tốt Hàng Tháng
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
            Mỗi tháng, KindnessMap phối hợp cùng các tổ chức cộng đồng trao tặng các danh hiệu cao quý và quỹ điểm thưởng đặc biệt cho những cá nhân có hoạt động cống hiến nổi bật nhất trên toàn quốc.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white/20 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 flex flex-col items-center text-center gap-2 max-w-xs self-center shrink-0">
          <Trophy className="w-12 h-12 text-yellow-200 animate-bounce" />
          <span className="font-extrabold text-sm text-white">Quỹ Giải Thưởng Kế Tiếp</span>
          <span className="text-2xl font-black text-yellow-200 drop-shadow-md">5,000 pts</span>
          <span className="text-[10px] text-amber-100">Công bố vào ngày 30/6/2026</span>
        </div>
      </div>

      {/* 2. Criteria Guide Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">3 Tiêu Chí Xét Duyệt Giải Thưởng Tháng</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center font-extrabold text-base">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">1. Tác Động Thực Tế</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed">Sự thay đổi tích cực mang lại cho môi trường, cảnh quan và cuộc sống của những người được giúp đỡ.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-extrabold text-base">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">2. Sự Kiên Trì & Bền Vững</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed">Hành động được duy trì đều đặn thay vì bộc phát, tạo thành thói quen tốt và lan tỏa tinh thần nhân ái.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-base">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">3. Khả Năng Truyền Cảm Hứng</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed">Số lượng người được truyền cảm hứng qua lượt Thích, chia sẻ và tham gia cùng phong trào trên Bản Đồ Việc Tốt.</p>
          </div>
        </div>
      </div>

      {/* 3. Past Winners Roll of Honour */}
      <div className="flex flex-col gap-8 pt-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Medal className="w-7 h-7 text-brand-green" />
            <span>Sảnh Đường Vinh Danh Các Tháng Trước</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Danh sách giải thưởng chính thức</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-2 p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs animate-pulse">
              Đang tải dữ liệu Sảnh đường vinh danh...
            </div>
          ) : awards.length === 0 ? (
            <div className="col-span-2 p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/70 rounded-3xl border border-slate-200 dark:border-slate-700">
              Hiện chưa có dữ liệu giải thưởng tháng.
            </div>
          ) : (
            awards.map((aw) => (
              <div
                key={aw.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-6 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-xs">
                      🏆 {aw.month}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-brand-green font-black text-xs border border-brand-green/20">
                      +{aw.awardPoints} pts
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">{aw.title}</h3>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    "{aw.description}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={aw.recipientAvatar} alt={aw.recipientName} className="w-12 h-12 rounded-full object-cover border-2 border-brand-green bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{aw.recipientName}</span>
                      <span className="text-[10px] font-bold text-brand-green uppercase mt-0.5">{aw.recipientLevel}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-brand-blue flex items-center gap-1 cursor-pointer hover:underline">
                    Xem hồ sơ <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
