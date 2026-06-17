import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  PlusCircle,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';

const categoryOptions = ['Môi trường', 'Người cao tuổi', 'Trồng cây', 'Hiến máu', 'Giáo dục', 'Tình nguyện', 'Cộng đồng'];
const slotOptions = [
  { value: 'morning', label: 'Buổi sáng' },
  { value: 'afternoon', label: 'Buổi chiều' },
  { value: 'evening', label: 'Buổi tối' },
  { value: 'weekend', label: 'Cuối tuần' },
  { value: 'emergency', label: 'Sẵn sàng khẩn cấp' },
];
const experienceOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const urgencyOptions = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
  { value: 'critical', label: 'Khẩn cấp' },
];
const availabilityOptions = [
  { value: 'available', label: 'Sẵn sàng' },
  { value: 'busy', label: 'Bận' },
  { value: 'offline', label: 'Tạm nghỉ' },
];
const formulaText = 'MS=(S×0.35)+(D×0.25)+(T×0.15)+(R×0.15)+(U×0.10)';

const emptyProfileForm = {
  skills: '',
  communityExperience: 'Beginner',
  yearsExperience: 0,
  serviceAreas: '',
  availableTimeSlots: ['weekend'],
  interests: ['Cộng đồng'],
  availabilityStatus: 'available',
  baseLatitude: '',
  baseLongitude: '',
  locationName: 'Việt Nam',
};

const emptyRequestForm = {
  title: '',
  description: '',
  requiredSkills: '',
  category: 'Cộng đồng',
  locationName: '',
  latitude: '',
  longitude: '',
  preferredTimeSlot: 'flexible',
  urgencyLevel: 'medium',
};

const toCsv = (value) => (Array.isArray(value) ? value.join(', ') : '');

export const AIMatchingEngine = () => {
  const { isAuthenticated, setActiveModal, user } = useAuth();
  const { addToast } = useNotification();

  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [profileSummary, setProfileSummary] = useState(null);
  const [kindnessVector, setKindnessVector] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [latestTopMatches, setLatestTopMatches] = useState([]);
  const [selectedRequestMatches, setSelectedRequestMatches] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const myRequests = useMemo(
    () => requests.filter((item) => Number(item.requesterUserId) === Number(user?.id)),
    [requests, user]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchMatchingDashboard();
  }, [isAuthenticated]);

  const fetchMatchingDashboard = async () => {
    try {
      setLoading(true);
      const [profileRes, recommendationsRes, requestsRes] = await Promise.all([
        api.get('/matching/profile'),
        api.get('/matching/recommendations'),
        api.get('/matching/requests'),
      ]);

      const profile = profileRes.data.profile;
      setProfileSummary(profile);
      setKindnessVector(profileRes.data.kindnessVector);
      setProfileForm({
        skills: toCsv(profile.skills),
        communityExperience: profile.communityExperience || 'Beginner',
        yearsExperience: profile.yearsExperience || 0,
        serviceAreas: toCsv(profile.serviceAreas),
        availableTimeSlots: profile.availableTimeSlots || ['weekend'],
        interests: profile.interests || ['Cộng đồng'],
        availabilityStatus: profile.availabilityStatus || 'available',
        baseLatitude: profile.baseLatitude ?? '',
        baseLongitude: profile.baseLongitude ?? '',
        locationName: profile.locationName || 'Việt Nam',
      });

      setRecommendations(recommendationsRes.data.recommendations || []);
      setRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch matching dashboard', error);
      addToast('Không tải được AI Matching Engine', 'Vui lòng thử lại sau.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayValue = (field, value) => {
    setProfileForm((prev) => {
      const current = prev[field] || [];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/matching/profile', profileForm);
      setProfileSummary(res.data.profile);
      setKindnessVector(res.data.kindnessVector);
      addToast('Đã cập nhật Kindness Vector', 'AI sẽ dùng hồ sơ mới để ghép nối chính xác hơn.', 'success');
      await fetchMatchingDashboard();
    } catch (error) {
      addToast('Không thể lưu hồ sơ năng lực số', error.response?.data?.message || 'Vui lòng thử lại.', 'warning');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.description.trim() || !requestForm.locationName.trim()) {
      addToast('Thiếu thông tin', 'Hãy nhập tiêu đề, mô tả và địa điểm của nhu cầu hỗ trợ.', 'warning');
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await api.post('/matching/requests', requestForm);
      setLatestTopMatches(res.data.topMatches || []);
      setRequestForm(emptyRequestForm);
      addToast('AI đã ghép nối thành công!', 'Top hồ sơ phù hợp đã được ưu tiên nhận thông báo.', 'success');
      await fetchMatchingDashboard();
    } catch (error) {
      addToast('Không thể tạo nhu cầu hỗ trợ', error.response?.data?.message || 'Vui lòng thử lại.', 'warning');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleOpenMatches = async (requestId) => {
    try {
      setLoadingMatches(true);
      const res = await api.get(`/matching/requests/${requestId}/matches`);
      setSelectedRequestMatches(res.data);
    } catch (error) {
      addToast('Không tải được danh sách ghép nối', error.response?.data?.message || 'Vui lòng thử lại.', 'warning');
    } finally {
      setLoadingMatches(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col gap-8">
        <div className="km-panel-hero p-8 sm:p-12 text-center flex flex-col items-center gap-5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_30%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-5 max-w-3xl">
            <div className="w-20 h-20 rounded-full bg-brand-lightGreen text-brand-green flex items-center justify-center shadow-lg shadow-brand-green/20">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              AI Ghép nối Năng lực và Nhu cầu
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              KindnessMap sẽ xây dựng <strong>Digital Capability Profile</strong> cho mỗi thành viên, chuyển thành <strong>Kindness Vector</strong> và so khớp với <strong>Need Vector</strong> của từng yêu cầu hỗ trợ để chủ động tìm đúng người cho đúng nhu cầu.
            </p>
            <div className="km-panel-soft px-5 py-4 text-left max-w-2xl w-full">
              <p className="text-xs font-black text-brand-green uppercase tracking-widest mb-2">Công thức ghép nối</p>
              <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 break-all">{formulaText}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={() => setActiveModal('login')}
                className="px-8 py-3.5 rounded-2xl bg-brand-green text-white font-black text-sm shadow-lg shadow-brand-green/20"
              >
                Đăng nhập để kích hoạt AI Matching
              </button>
              <button
                onClick={() => setActiveModal('register')}
                className="px-8 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-black text-sm"
              >
                Tạo hồ sơ năng lực số
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <section className="km-panel-hero p-8 sm:p-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.18),_transparent_26%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-4xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-lightGreen border border-brand-green/20 text-brand-deepGreen text-xs font-black uppercase tracking-wide w-fit">
              <Sparkles className="w-4 h-4" /> Skill-to-Need Matching Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              AI chủ động tìm đúng người cho đúng nhu cầu cộng đồng
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Hồ sơ năng lực số của bạn được AI chuyển thành <strong>Kindness Vector</strong>; mỗi nhu cầu hỗ trợ được chuyển thành <strong>Need Vector</strong>. Hệ thống sẽ ưu tiên thông báo cho người có Match Score cao nhất để rút ngắn thời gian kết nối và tăng hiệu quả hỗ trợ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            <div className="km-panel-soft px-5 py-4 min-w-[220px]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Kindness Vector</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{profileSummary?.skills?.length || 0} kỹ năng</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{profileSummary?.locationName || 'Chưa khai báo khu vực'}</p>
            </div>
            <div className="km-panel-soft px-5 py-4 min-w-[220px]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Uy tín AI</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{kindnessVector?.reputationScore || 0}/100</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Dựa trên điểm, level và hoạt động đã duyệt</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 km-panel-soft p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-brand-green">Công thức Match Score</p>
              <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 break-all mt-2">{formulaText}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              {[
                ['S', 'Skill Match'],
                ['D', 'Distance Score'],
                ['T', 'Time Availability'],
                ['R', 'Reputation Score'],
                ['U', 'Urgency Factor'],
              ].map(([code, label]) => (
                <div key={code} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-3 text-center">
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">{code}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="km-panel p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-sm animate-pulse">
          Đang tải AI Matching Engine...
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-6 km-panel p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="w-6 h-6 text-brand-green" />
                    Hồ sơ năng lực số
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cập nhật kỹ năng, khu vực, thời gian rảnh và mối quan tâm để AI ghép nối chính xác hơn.
                  </p>
                </div>
                <div className="shrink-0 whitespace-nowrap min-w-fit px-4 py-2 rounded-full bg-brand-lightGreen text-brand-deepGreen text-xs font-black uppercase tracking-wide text-center">
                  {profileSummary?.communityExperience || 'Beginner'}
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kỹ năng chuyên môn</label>
                  <input
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, skills: e.target.value }))}
                    placeholder="VD: Sơ cứu cơ bản, Kèm học, Điều phối tình nguyện"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Mức kinh nghiệm cộng đồng</label>
                  <select
                    value={profileForm.communityExperience}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, communityExperience: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {experienceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Số năm kinh nghiệm</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={profileForm.yearsExperience}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, yearsExperience: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Khu vực hoạt động</label>
                  <input
                    value={profileForm.serviceAreas}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, serviceAreas: e.target.value }))}
                    placeholder="VD: Cầu Giấy, Hà Nội; Quận 1, TP. Hồ Chí Minh"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Vị trí trung tâm</label>
                  <input
                    value={profileForm.locationName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, locationName: e.target.value }))}
                    placeholder="VD: Cầu Giấy, Hà Nội"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Trạng thái sẵn sàng</label>
                  <select
                    value={profileForm.availabilityStatus}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, availabilityStatus: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {availabilityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Vĩ độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={profileForm.baseLatitude}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, baseLatitude: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kinh độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={profileForm.baseLongitude}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, baseLongitude: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 p-4">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">Khung giờ sẵn sàng</p>
                    <div className="flex flex-wrap gap-2">
                      {slotOptions.map((slot) => {
                        const active = profileForm.availableTimeSlots.includes(slot.value);
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => toggleArrayValue('availableTimeSlots', slot.value)}
                            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                              active
                                ? 'bg-brand-green text-white shadow-md'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 p-4">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">Lĩnh vực quan tâm</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((category) => {
                        const active = profileForm.interests.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleArrayValue('interests', category)}
                            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                              active
                                ? 'bg-slate-900 text-white'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Uy tín AI hiện tại: <strong className="text-slate-900 dark:text-slate-100">{kindnessVector?.reputationScore || 0}/100</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-3 rounded-2xl bg-brand-green text-white font-black text-sm shadow-lg shadow-brand-green/20 hover:opacity-95 disabled:opacity-60"
                  >
                    {savingProfile ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>

            <div className="xl:col-span-6 km-panel p-6 sm:p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HeartHandshake className="w-6 h-6 text-brand-blue" />
                  Tạo yêu cầu hỗ trợ
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mỗi yêu cầu hỗ trợ sẽ được AI chuyển thành Need Vector, tính Match Score và chủ động gửi thông báo đến hồ sơ phù hợp nhất.
                </p>
              </div>

              <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tiêu đề nhu cầu hỗ trợ</label>
                  <input
                    value={requestForm.title}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="VD: Cần tình nguyện viên sơ cứu tại sự kiện hiến máu"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Mô tả chi tiết</label>
                  <textarea
                    rows="5"
                    value={requestForm.description}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả rõ quy mô, người cần hỗ trợ, kết quả kỳ vọng và các điều kiện liên quan..."
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Danh mục</label>
                  <select
                    value={requestForm.category}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Độ khẩn cấp</label>
                  <select
                    value={requestForm.urgencyLevel}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, urgencyLevel: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {urgencyOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kỹ năng cần thiết</label>
                  <input
                    value={requestForm.requiredSkills}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, requiredSkills: e.target.value }))}
                    placeholder="VD: Sơ cứu cơ bản, Kèm học, Điều phối sự kiện"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Địa điểm</label>
                  <input
                    value={requestForm.locationName}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, locationName: e.target.value }))}
                    placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Khung giờ mong muốn</label>
                  <select
                    value={requestForm.preferredTimeSlot}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredTimeSlot: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="flexible">Linh hoạt</option>
                    {slotOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Vĩ độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={requestForm.latitude}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, latitude: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kinh độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={requestForm.longitude}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, longitude: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    AI sẽ tính Match Score và ưu tiên thông báo cho người phù hợp nhất ngay sau khi bạn tạo nhu cầu.
                  </div>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-6 py-3 rounded-2xl bg-brand-blue text-white font-black text-sm shadow-lg shadow-brand-blue/20 hover:opacity-95 disabled:opacity-60"
                  >
                    {submittingRequest ? 'Đang phân tích AI...' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {latestTopMatches.length > 0 && (
            <section className="km-panel p-6 sm:p-8 flex flex-col gap-5 animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" /> Top hồ sơ AI vừa ưu tiên ghép nối
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Đây là những hồ sơ có Match Score cao nhất vừa được hệ thống gửi thông báo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestTopMatches.map((match, index) => (
                  <div key={`${match.userId}-${index}`} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-green">Top {index + 1}</span>
                      <span className="px-3 py-1 rounded-full bg-brand-lightGreen text-brand-deepGreen text-xs font-black">MS {match.matchScore}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={match.avatar} alt={match.fullName} className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{match.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{match.level}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {Object.entries(match.breakdown).map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-2">
                          <div className="text-slate-900 dark:text-slate-100">{key}</div>
                          <div className="mt-1">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-5 km-panel p-6 sm:p-8 flex flex-col gap-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" /> Gợi ý AI dành cho bạn
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Những yêu cầu mà hồ sơ của bạn có Match Score cao nhất hiện tại.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {recommendations.length === 0 ? (
                  <div className="km-panel-soft p-8 text-center text-slate-400 dark:text-slate-500 text-sm font-bold">
                    Chưa có nhu cầu phù hợp nào để AI gợi ý cho bạn.
                  </div>
                ) : (
                  recommendations.map(({ request, match }) => (
                    <div key={request.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">MS {match.matchScore}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          request.urgencyLevel === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            : request.urgencyLevel === 'high'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {request.urgencyLevel}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{request.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{request.locationName} • {request.category}</p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">{request.description}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <span key={reason} className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="xl:col-span-7 km-panel p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-6 h-6 text-brand-green" /> Danh sách nhu cầu đang mở
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Theo dõi các Need Vector đã tạo và xem Top Match chi tiết cho từng yêu cầu.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-brand-lightGreen text-brand-deepGreen text-xs font-black uppercase tracking-wide w-fit">
                  {myRequests.length} yêu cầu của bạn
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[720px] overflow-y-auto pr-1">
                {requests.length === 0 ? (
                  <div className="km-panel-soft p-10 text-center text-slate-400 dark:text-slate-500 text-sm font-bold">
                    Chưa có nhu cầu hỗ trợ nào đang mở.
                  </div>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-lightGreen text-brand-deepGreen border border-brand-green/20 text-[10px] font-black uppercase">
                              {request.category}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase">
                              {request.urgencyLevel}
                            </span>
                            {request.topMatchScore !== null && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
                                Top MS {request.topMatchScore}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-base text-slate-900 dark:text-slate-100 mt-2 leading-snug">{request.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{request.requesterName} • {request.locationName}</p>
                        </div>
                        <button
                          onClick={() => handleOpenMatches(request.id)}
                          disabled={loadingMatches}
                          className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors shrink-0"
                        >
                          Xem Top Match
                        </button>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{request.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="km-panel-soft px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Kỹ năng cần</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2">{request.requiredSkills?.join(', ') || 'Linh hoạt theo tình huống'}</p>
                        </div>
                        <div className="km-panel-soft px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Khung giờ</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2">{request.preferredTimeSlot || 'flexible'}</p>
                        </div>
                        <div className="km-panel-soft px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Người được AI ưu tiên</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2">{request.matchedVolunteerName || 'Chưa có'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {selectedRequestMatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="km-modal-shell max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900/95 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] font-black text-emerald-400">AI Match Ranking</p>
                <h3 className="text-lg font-black mt-1">{selectedRequestMatches.request.title}</h3>
              </div>
              <button onClick={() => setSelectedRequestMatches(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              <div className="km-panel-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-brand-green">Công thức đang áp dụng</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2 break-all">{selectedRequestMatches.formula}</p>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  AI sẽ xếp hạng theo kỹ năng, khoảng cách, độ sẵn sàng, uy tín và mức khẩn cấp để chọn người ưu tiên nhận thông báo.
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedRequestMatches.matches.slice(0, 8).map((match, index) => (
                  <div key={`${match.userId}-${index}`} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={match.avatar} alt={match.fullName} className="w-14 h-14 rounded-2xl object-cover bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 text-base">#{index + 1} • {match.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{match.level} • {match.locationName}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-brand-lightGreen text-brand-deepGreen text-xs font-black uppercase">MS {match.matchScore}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {Object.entries(match.breakdown).map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-2">
                          <div className="text-slate-900 dark:text-slate-100">{key}</div>
                          <div className="mt-1">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {match.reasons.map((reason) => (
                        <span key={reason} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Kỹ năng trùng khớp: <strong className="text-slate-900 dark:text-slate-100">{match.matchedSkills?.join(', ') || 'Chưa có kỹ năng trùng trực tiếp'}</strong>
                      {match.distanceKm !== null && (
                        <span> • Khoảng cách ước tính: <strong className="text-slate-900 dark:text-slate-100">{match.distanceKm} km</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatchingEngine;
