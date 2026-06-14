import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Award, Star, Medal, Users, ArrowUp, Sparkles, HelpCircle } from 'lucide-react';

export const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-time'); // 'weekly' | 'monthly' | 'all-time'
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
          shadow: 'shadow-yellow-500/30',
        };
      case 1:
        return {
          icon: '🥈',
          border: 'border-slate-300 ring-4 ring-slate-300/30',
          bg: 'from-slate-400 to-slate-300',
          text: 'Top 2 Á Quân',
          shadow: 'shadow-slate-500/20',
        };
      case 2:
        return {
          icon: '🥉',
          border: 'border-amber-600 ring-4 ring-amber-600/30',
          bg: 'from-amber-700 to-amber-600',
          text: 'Top 3 Quý Quân',
          shadow: 'shadow-amber-700/20',
        };
      default:
        return null;
    }
  };

  const top3 = rankings.slice(0, 3);
  const remainder = rankings.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-dark to-slate-900 p-8 sm:p-12 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col gap-3 relative z-10 max-w-2xl text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs w-fit self-center md:self-start">
            <Trophy className="w-4 h-4 animate-bounce" /> Bảng Vàng Vinh Danh
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Những Trái Tim Vàng Của Cộng Đồng
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Bảng xếp hạng vinh danh những cá nhân có nhiều đóng góp tích cực nhất trong việc gieo hạt giống tử tế và làm sạch môi trường trên nền tảng KindnessMap.
          </p>
        </div>

        {/* Trigger Tier Guide Button */}
        <button
          onClick={() => setShowTierGuide(!showTierGuide)}
          className="px-6 py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-xs font-black transition-all flex items-center gap-2 shrink-0 backdrop-blur-md self-center md:self-end"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>{showTierGuide ? 'Ẩn Hướng Dẫn Các Mốc Cấp Độ' : '📊 Hướng Dẫn 4 Mốc Danh Hiệu'}</span>
        </button>
      </div>

      {/* Tier Breakdown Guide Alert Box */}
      {showTierGuide && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 w-fit">0 - 100 Điểm</span>
            <h4 className="font-extrabold text-sm text-slate-900 mt-1">Active Citizen</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Công dân tích cực, bước đầu tham gia chia sẻ và ủng hộ việc tốt.</p>
          </div>
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col gap-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800 w-fit">101 - 300 Điểm</span>
            <h4 className="font-extrabold text-sm text-rose-900 mt-1">Kindness Ambassador</h4>
            <p className="text-xs text-rose-700 leading-relaxed">Đại sứ việc tốt, thường xuyên đăng tải và truyền cảm hứng mạnh mẽ.</p>
          </div>
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col gap-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 w-fit">301 - 500 Điểm</span>
            <h4 className="font-extrabold text-sm text-blue-900 mt-1">Community Inspiration</h4>
            <p className="text-xs text-blue-700 leading-relaxed">Nguồn cảm hứng cộng đồng, dẫn dắt các phong trào tình nguyện.</p>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col gap-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-800 w-fit">500+ Điểm</span>
            <h4 className="font-extrabold text-sm text-amber-900 mt-1">Community Hero</h4>
            <p className="text-xs text-amber-700 leading-relaxed">Anh hùng cộng đồng, được vinh danh đặc biệt với phần thưởng tháng.</p>
          </div>
        </div>
      )}

      {/* Filter Ranking Tabs */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'weekly' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-105' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🔥 Bảng Xếp Hạng Tuần Này
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'monthly' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-105' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🌟 Bảng Xếp Hạng Tháng 6
        </button>
        <button
          onClick={() => setActiveTab('all-time')}
          className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'all-time' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25 scale-105' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🏆 Tất Cả Thời Gian (All-time)
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-20 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-extrabold text-sm animate-pulse">
          Đang tính toán Bảng xếp hạng điểm việc tốt...
        </div>
      ) : rankings.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          Chưa có dữ liệu xếp hạng.
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-8">
            {/* We order them so Top 1 is in the middle: Top 2 -> Top 1 -> Top 3 */}
            {[top3[1], top3[0], top3[2]].map((u, i) => {
              if (!u) return null;
              // Remap index because middle is Top 1 (idx 0 in original array)
              const originalIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
              const badge = getPodiumBadge(originalIdx);

              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-3xl p-8 text-center flex flex-col items-center gap-4 border border-slate-200 shadow-xl relative transition-all duration-300 hover:-translate-y-2 ${
                    originalIdx === 0 ? 'md:-translate-y-8 md:hover:-translate-y-10 border-yellow-300 shadow-2xl' : ''
                  }`}
                >
                  <span className={`absolute -top-5 px-4 py-1.5 rounded-full text-white font-black text-xs shadow-lg bg-gradient-to-r ${badge.bg}`}>
                    {badge.icon} {badge.text}
                  </span>

                  <img
                    src={u.avatar}
                    alt={u.fullName}
                    className={`w-24 h-24 rounded-full object-cover mt-2 bg-slate-100 ${badge.border}`}
                  />

                  <div className="flex flex-col gap-1 w-full">
                    <h3 className="font-extrabold text-lg text-slate-900 truncate">{u.fullName}</h3>
                    <span className="text-xs font-black text-brand-green">{u.level}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 w-full flex items-center justify-around border border-slate-100">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-semibold">Tổng Điểm</span>
                      <span className="text-base font-black text-slate-900 mt-0.5">{u.points} pts</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-semibold">Việc Tốt</span>
                      <span className="text-base font-black text-slate-900 mt-0.5">{u.deedsCount || 0} bài</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking Table List for remainder */}
          {remainder.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-600 uppercase tracking-wider">
                  Các thứ hạng tiếp theo (Top 4 - 20)
                </span>
                <span className="text-xs text-slate-400 font-semibold">Tích cực hoạt động để vươn lên Top 3</span>
              </div>

              <div className="divide-y divide-slate-100">
                {remainder.map((ru, idx) => (
                  <div
                    key={ru.id}
                    className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-brand-lightGreen/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 4}
                      </span>
                      <img src={ru.avatar} alt={ru.fullName} className="w-12 h-12 rounded-full object-cover bg-slate-200 shrink-0 border" />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-slate-900">{ru.fullName}</span>
                        <span className="text-[11px] font-bold text-brand-green mt-0.5">{ru.level}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[11px] text-slate-400 font-medium">Việc Tốt Ghi Nhận</span>
                        <span className="text-xs font-bold text-slate-700">{ru.deedsCount || 0} hoạt động</span>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-right">
                        <span className="font-black text-sm text-slate-900">{ru.points} pts</span>
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
