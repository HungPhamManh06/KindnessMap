import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, HelpCircle, CheckCircle2, XCircle, AlertTriangle, Users } from 'lucide-react';

const tierCards = [
  {
    range: '0 - 100 Điểm',
    title: 'Active Citizen',
    description: 'Công dân tích cực, bước đầu tham gia chia sẻ và ủng hộ việc tốt.',
    className: 'bg-slate-50 border-slate-200 dark:bg-slate-800/70 dark:border-slate-700 text-slate-700 dark:text-slate-200',
    pillClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  },
  {
    range: '101 - 300 Điểm',
    title: 'Kindness Ambassador',
    description: 'Đại sứ việc tốt, thường xuyên đăng tải và truyền cảm hứng mạnh mẽ.',
    className: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/15 text-rose-800 dark:text-rose-200',
    pillClass: 'bg-rose-200 dark:bg-rose-500/15 text-rose-800 dark:text-rose-200',
  },
  {
    range: '301 - 500 Điểm',
    title: 'Community Inspiration',
    description: 'Nguồn cảm hứng cộng đồng, dẫn dắt các phong trào tình nguyện.',
    className: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/15 text-blue-800 dark:text-blue-200',
    pillClass: 'bg-blue-200 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200',
  },
  {
    range: '500+ Điểm',
    title: 'Community Hero',
    description: 'Anh hùng cộng đồng, được vinh danh đặc biệt với phần thưởng tháng.',
    className: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/15 text-amber-800 dark:text-amber-200',
    pillClass: 'bg-amber-200 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
  },
];

export const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-time');
  const [showTierGuide, setShowTierGuide] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaderboard', { params: { time: activeTab } });
      setRankings(res.data);
    } catch (error) {
      console.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumBadge = (index) => {
    switch (index) {
      case 0:
        return {
          icon: '👑',
          border: 'border-yellow-400 ring-4 ring-yellow-400/30',
          bg: 'from-amber-500 to-yellow-400',
          text: 'Top 1 Quán Quân',
        };
      case 1:
        return {
          icon: '🥈',
          border: 'border-slate-300 ring-4 ring-slate-300/30 dark:border-slate-500 dark:ring-slate-500/20',
          bg: 'from-slate-400 to-slate-300',
          text: 'Top 2 Á Quân',
        };
      case 2:
        return {
          icon: '🥉',
          border: 'border-amber-600 ring-4 ring-amber-600/30',
          bg: 'from-amber-700 to-amber-600',
          text: 'Top 3 Quý Quân',
        };
      default:
        return null;
    }
  };

  const top3 = rankings.slice(0, 3);
  const remainder = rankings.slice(3);

  return (
    <div className="km-page-modern relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      <section className="km-dark-hero p-8 sm:p-12 text-white">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs w-fit self-center md:self-start">
              <Trophy className="w-4 h-4 animate-bounce" /> Bảng Vàng Vinh Danh
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Những Trái Tim Vàng Của Cộng Đồng
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bảng xếp hạng vinh danh những cá nhân có nhiều đóng góp tích cực nhất trong việc gieo hạt giống tử tế và làm sạch môi trường trên nền tảng KindnessMap.
            </p>
          </div>

          <button
            onClick={() => setShowTierGuide(!showTierGuide)}
            className="px-6 py-3.5 bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-700/70 rounded-2xl border border-white/10 text-xs font-black transition-all flex items-center gap-2 shrink-0 backdrop-blur-md self-center md:self-end"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{showTierGuide ? 'Ẩn Hướng Dẫn Các Mốc Cấp Độ' : '📊 Hướng Dẫn 4 Mốc Danh Hiệu'}</span>
          </button>
        </div>
      </section>

      {showTierGuide && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {tierCards.map((tier) => (
            <div key={tier.title} className={`rounded-3xl border p-5 flex flex-col gap-2 ${tier.className}`}>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full w-fit ${tier.pillClass}`}>{tier.range}</span>
              <h4 className="font-extrabold text-sm mt-1">{tier.title}</h4>
              <p className="text-xs leading-relaxed opacity-90">{tier.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="km-panel p-3 sm:p-4 flex flex-wrap items-center justify-center gap-2">
        {[['weekly', '🔥 Bảng Xếp Hạng Tuần Này'], ['monthly', '🌟 Bảng Xếp Hạng Tháng 6'], ['all-time', '🏆 Tất Cả Thời Gian']].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
              activeTab === value
                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-105'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="km-panel p-20 text-center text-slate-400 dark:text-slate-500 font-extrabold text-sm animate-pulse">
          Đang tính toán Bảng xếp hạng điểm việc tốt...
        </div>
      ) : rankings.length === 0 ? (
        <div className="km-panel p-20 text-center text-slate-400 dark:text-slate-500 font-bold text-sm">
          Chưa có dữ liệu xếp hạng.
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-2">
            {[top3[1], top3[0], top3[2]].map((u, i) => {
              if (!u) return null;
              const originalIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
              const badge = getPodiumBadge(originalIdx);

              return (
                <div
                  key={u.id}
                  className={`relative rounded-[30px] border bg-white dark:bg-slate-900 p-8 text-center flex flex-col items-center gap-4 shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                    originalIdx === 0
                      ? 'md:-translate-y-8 md:hover:-translate-y-10 border-yellow-300 dark:border-yellow-500/40 shadow-2xl'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent dark:from-white/5 pointer-events-none rounded-t-[30px]" />
                  <span className={`absolute -top-5 px-4 py-1.5 rounded-full text-white font-black text-xs shadow-lg bg-gradient-to-r ${badge.bg}`}>
                    {badge.icon} {badge.text}
                  </span>

                  <img
                    src={u.avatar}
                    alt={u.fullName}
                    className={`w-24 h-24 rounded-full object-cover mt-2 bg-slate-100 dark:bg-slate-800 ${badge.border}`}
                  />

                  <div className="flex flex-col gap-1 w-full relative z-10">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 truncate">{u.fullName}</h3>
                    <span className="text-xs font-black text-brand-green">{u.level}</span>
                  </div>

                  <div className="km-panel-soft p-4 w-full flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Tổng Điểm</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{u.points} pts</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Việc Tốt</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{u.deedsCount || 0} bài</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {remainder.length > 0 && (
            <div className="km-panel overflow-hidden">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Các thứ hạng tiếp theo (Top 4 - 20)
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Tích cực hoạt động để vươn lên Top 3</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {remainder.map((ru, idx) => (
                  <div
                    key={ru.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-lightGreen/40 dark:hover:bg-emerald-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 4}
                      </span>
                      <img src={ru.avatar} alt={ru.fullName} className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shrink-0 border ring-1 ring-black/5 dark:ring-white/5" />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{ru.fullName}</span>
                        <span className="text-[11px] font-bold text-brand-green mt-0.5">{ru.level}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Việc Tốt Ghi Nhận</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{ru.deedsCount || 0} hoạt động</span>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right min-w-[100px]">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">{ru.points} pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
