import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Star, Heart, Sparkles, Medal, Users, Leaf, ArrowRight } from 'lucide-react';

const criteria = [
  {
    title: '1. Tác Động Thực Tế',
    description: 'Số lượng người được hỗ trợ và kết quả cụ thể đối với môi trường hoặc đời sống địa phương.',
    icon: Leaf,
    iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  {
    title: '2. Sự Bền Vững',
    description: 'Hoạt động được thực hiện định kỳ, có tính tổ chức và duy trì giá trị lâu dài.',
    icon: Heart,
    iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  },
  {
    title: '3. Gắn Kết Cộng Đồng',
    description: 'Mức độ tương tác, tương trợ và thu hút tình nguyện viên tham gia cùng chương trình.',
    icon: Users,
    iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  },
];

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
    <div className="km-page-modern max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-8 sm:p-12 text-white shadow-2xl border border-emerald-700/30">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold w-fit uppercase tracking-wider self-center md:self-start">
              <Sparkles className="w-4 h-4 text-emerald-300" /> Vinh Danh Tháng
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Giải Thưởng Cộng Đồng Hàng Tháng
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Vinh danh các cá nhân và tập thể có đóng góp xuất sắc nhất trong các hoạt động ghim việc tốt, bảo vệ môi trường và tương trợ xã hội.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center text-center gap-2 max-w-xs self-center shrink-0 shadow-xl">
            <Trophy className="w-10 h-10 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Quỹ Điểm Thưởng Tháng</span>
            <span className="text-2xl font-black text-amber-400">5,000 pts</span>
            <span className="text-[11px] text-slate-300">Tổng kết định kỳ ngày 30 hàng tháng</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">3 Tiêu Chí Xét Duyệt</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {criteria.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="km-panel p-6 flex flex-col gap-3 hover:border-emerald-500/40 transition-all">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.iconWrap}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Medal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Sảnh Đường Vinh Danh</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Danh sách chính thức</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 km-panel p-16 text-center text-slate-500 font-medium text-xs animate-pulse">
              Đang tải dữ liệu sảnh đường vinh danh...
            </div>
          ) : awards.length === 0 ? (
            <div className="col-span-2 km-panel p-16 text-center text-slate-500 font-medium text-xs">
              Hiện chưa có dữ liệu giải thưởng tháng.
            </div>
          ) : (
            awards.map((aw) => (
              <article
                key={aw.id}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-7 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    {aw.month}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black text-xs">
                    +{aw.awardPoints || 100} pts
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">{aw.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{aw.description}</p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Người nhận:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{aw.recipientName || 'Thành viên cộng đồng'}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
