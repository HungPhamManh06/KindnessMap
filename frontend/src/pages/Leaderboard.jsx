import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, HelpCircle, CheckCircle2, XCircle, AlertTriangle, Users } from 'lucide-react';

const tierCards = [
  {
    range: '0 - 100 Điểm',
    title: 'Active Citizen',
    description: 'Công dân tích cực, bắt đầu ghim bài và tham gia tương tác.',
    className: 'bg-slate-50 border-slate-200 dark:bg-slate-800/70 dark:border-slate-700 text-slate-700 dark:text-slate-200',
    pillClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  },
  {
    range: '101 - 300 Điểm',
    title: 'Kindness Ambassador',
    description: 'Đại sứ việc tốt, đóng góp đều đặn và chia sẻ hoạt động tích cực.',
    className: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200',
    pillClass: 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200',
  },
  {
    range: '301 - 500 Điểm',
    title: 'Community Inspiration',
    description: 'Thành viên nòng nốt, dẫn dắt các dự án môi trường và tương trợ.',
    className: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20 text-sky-800 dark:text-sky-200',
    pillClass: 'bg-sky-200 dark:bg-sky-500/20 text-sky-800 dark:text-sky-200',
  },
  {
    range: '500+ Điểm',
    title: 'Community Hero',
    description: 'Thành viên xuất sắc, đóng góp lớn nhất cho cộng đồng địa phương.',
    className: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-200',
    pillClass: 'bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200',
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
          border: 'border-amber-400 ring-4 ring-amber-400/20',
          bg: 'from-amber-500 to-yellow-400',
          text: 'Top 1 Quán Quân',
        };
      case 1:
        return {
          icon: '🥈',
          border: 'border-slate-300 ring-4 ring-slate-300/20 dark:border-slate-600',
          bg: 'from-slate-400 to-slate-300',
          text: 'Top 2 Á Quân',
        };
      case 2:
        return {
          icon: '🥉',
          border: 'border-amber-700 ring-4 ring-amber-700/20',
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
    <div className="km-page-modern relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <section className="km-dark-hero p-8 sm:p-12 text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-xs w-fit self-center md:self-start">
              <Trophy className="w-4 h-4 text-amber-400" /> Bảng Vàng Vinh Danh
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Bảng Xếp Hạng Công Dân Tích Cực
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Vinh danh các cá nhân có nhiều đóng góp tích cực nhất trong việc chia sẻ, ghim bài viết và hỗ trợ cộng đồng trên KindnessMap.
            </p>
          </div>

          <button
            onClick={() => setShowTierGuide(!showTierGuide)}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-xs font-bold transition-all flex items-center gap-2 shrink-0 backdrop-blur-md self-center md:self-end"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{showTierGuide ? 'Ẩn Hướng Dẫn Cấp Độ' : '📊 Xem Hướng Dẫn 4 Cấp Độ'}</span>
          </button>
        </div>
      </section>

      {showTierGuide && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {tierCards.map((tier) => (
            <div key={tier.title} className={`p-5 rounded-2xl border ${tier.className} flex flex-col justify-between gap-3`}>
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${tier.pillClass}`}>
                  {tier.range}
                </span>
                <h4 className="font-bold text-base">{tier.title}</h4>
                <p className="text-xs leading-relaxed mt-1 opacity-90">{tier.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'all-time', label: 'Tất Cả Thời Gian' },
          { id: 'month',    label: 'Tháng 6, 2026' },
          { id: 'week',     label: 'Tuần Này' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium Top 3 */}
      {loading ? (
        <div className="km-panel p-16 text-center text-slate-500 font-medium text-xs animate-pulse">
          Đang tải bảng xếp hạng...
        </div>
      ) : rankings.length === 0 ? (
        <div className="km-panel p-16 text-center text-slate-500 font-medium text-xs">
          Chưa có dữ liệu xếp hạng trong thời gian này.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {top3.map((userItem, index) => {
                const podium = getPodiumBadge(index);
                return (
                  <div
                    key={userItem.id}
                    className={`km-panel p-6 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-1 ${
                      index === 0 ? 'md:-order-none order-first ring-2 ring-amber-400/40' : ''
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-lg">{podium.icon}</div>
                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${podium.border} mb-3 shadow-md`}>
                      <img
                        src={userItem.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={userItem.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                      {podium.text}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{userItem.fullName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{userItem.level || 'Active Citizen'}</p>

                    <div className="mt-auto px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-sm">
                      {userItem.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List remaining */}
          {remainder.length > 0 && (
            <div className="km-panel overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-slate-100">
                Thành Viên Tiếp Theo
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {remainder.map((u, i) => (
                  <div key={u.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center text-xs font-bold text-slate-400">#{i + 4}</span>
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.fullName}</h4>
                        <span className="text-xs text-slate-500">{u.level || 'Active Citizen'}</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{u.points} pts</span>
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
