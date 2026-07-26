import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  Gamepad2,
  Heart,
  HeartHandshake,
  Leaf,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TOTAL_SEEDS_KEY = 'kindness-games-total-seeds';
const MEMORY_BEST_KEY = 'kindness-games-memory-best';
const QUIZ_BEST_KEY = 'kindness-games-quiz-best';
const CATCHER_BEST_KEY = 'kindness-games-catcher-best';

const PAGE_COPY = {
  vi: {
    badge: 'Khu vui chơi tử tế',
    title: 'Mini Game KindnessMap',
    subtitle:
      'Một góc nhỏ để người dùng vừa giải trí, vừa luyện phản xạ tử tế: ghi nhớ việc tốt, xử lý tình huống cộng đồng và thu thập “hạt mầm lòng tốt”.',
    playNow: 'Chơi ngay',
    exploreMap: 'Khám phá bản đồ',
    totalSeeds: 'Hạt mầm tích lũy',
    rankLabel: 'Danh hiệu game',
    completedLabel: 'Có 3 trò nhỏ',
    flashPrefix: '+',
    flashSuffix: ' hạt mầm!',
    gamesTitle: 'Chọn thử thách của bạn',
    gamesSubtitle:
      'Mỗi trò chơi được thiết kế theo chủ đề Bản Đồ Việc Tốt: lan tỏa, ghi nhớ, chọn hành động đúng và tránh những tín hiệu tiêu cực.',
    memoryCardTitle: 'Ghép Cặp Việc Tốt',
    memoryCardDesc: 'Lật thẻ để tìm những cặp hành động tử tế giống nhau.',
    quizCardTitle: 'Sứ Giả Tình Huống',
    quizCardDesc: 'Chọn cách ứng xử ấm áp nhất trong các tình huống đời thường.',
    catcherCardTitle: 'Bắt Hạt Mầm',
    catcherCardDesc: 'Thu thập trái tim, lá xanh và dọn rác; né các đám mây tiêu cực.',
    footerTitle: 'Bạn vừa luyện kỹ năng tử tế?',
    footerDesc:
      'Hãy biến điểm số trong mini game thành một hành động thật ngoài đời: giúp một người, nhặt một mẩu rác, hoặc đăng câu chuyện việc tốt của bạn lên KindnessMap.',
    submitStory: 'Gửi câu chuyện thật',
    backToStories: 'Xem câu chuyện cộng đồng',
    ranks: [
      { min: 180, label: 'Hiệp sĩ lan tỏa', icon: '🏆' },
      { min: 100, label: 'Người gieo mầm', icon: '🌱' },
      { min: 45, label: 'Bạn đồng hành tử tế', icon: '💚' },
      { min: 0, label: 'Tân binh việc tốt', icon: '✨' },
    ],
  },
  en: {
    badge: 'Kindness playground',
    title: 'KindnessMap Mini Games',
    subtitle:
      'A small place to play while training kind reflexes: remember good deeds, handle community scenarios, and collect “kindness seeds”.',
    playNow: 'Play now',
    exploreMap: 'Explore map',
    totalSeeds: 'Seeds collected',
    rankLabel: 'Game title',
    completedLabel: '3 mini games',
    flashPrefix: '+',
    flashSuffix: ' seeds!',
    gamesTitle: 'Choose your challenge',
    gamesSubtitle:
      'Each game follows the Map of Good Deeds theme: spread kindness, remember good actions, make thoughtful choices, and avoid negative signals.',
    memoryCardTitle: 'Good Deed Match',
    memoryCardDesc: 'Flip cards to find matching acts of kindness.',
    quizCardTitle: 'Scenario Messenger',
    quizCardDesc: 'Choose the warmest response in everyday community situations.',
    catcherCardTitle: 'Seed Catcher',
    catcherCardDesc: 'Collect hearts, green leaves, and clean trash; avoid negative clouds.',
    footerTitle: 'Did you just train your kindness skills?',
    footerDesc:
      'Turn your mini-game score into a real-life action: help someone, pick up a piece of litter, or post your good deed story on KindnessMap.',
    submitStory: 'Submit a real story',
    backToStories: 'View community stories',
    ranks: [
      { min: 180, label: 'Kindness champion', icon: '🏆' },
      { min: 100, label: 'Seed planter', icon: '🌱' },
      { min: 45, label: 'Kind companion', icon: '💚' },
      { min: 0, label: 'Good-deed rookie', icon: '✨' },
    ],
  },
};

const GAME_COPY = {
  vi: {
    common: {
      best: 'Kỷ lục',
      seeds: 'hạt mầm',
      reset: 'Chơi lại',
      points: 'điểm',
      moves: 'lượt lật',
      progress: 'Tiến độ',
      next: 'Câu tiếp theo',
      finish: 'Hoàn thành',
      start: 'Bắt đầu',
      playing: 'Đang chơi',
      reward: 'Thưởng',
    },
    memory: {
      eyebrow: 'Trò 1 • Ghi nhớ',
      title: 'Ghép Cặp Việc Tốt',
      description:
        'Lật 2 thẻ mỗi lượt. Nếu tìm đúng cặp hành động tử tế, thẻ sẽ được giữ lại và bạn nhận thưởng khi hoàn tất bảng.',
      complete: 'Tuyệt vời! Bạn đã ghép đủ các cặp việc tốt.',
      hiddenCard: 'Thẻ ẩn',
      matched: 'Đã ghép',
      reward: '+30 hạt mầm khi hoàn thành',
    },
    quiz: {
      eyebrow: 'Trò 2 • Quyết định tử tế',
      title: 'Sứ Giả Tình Huống',
      description:
        'Đọc tình huống và chọn hành động phù hợp nhất. Mỗi câu đúng giúp bạn rèn phản xạ tử tế ngoài đời.',
      question: 'Tình huống',
      correct: 'Lựa chọn rất tử tế!',
      wrong: 'Chưa tối ưu, thử nghĩ thêm một cách ấm áp hơn nhé.',
      score: 'Điểm đúng',
      resultTitle: 'Kết quả sứ giả',
      resultDesc: 'Bạn đã hoàn thành thử thách ứng xử cộng đồng.',
      reward: 'Nhận hạt mầm theo số câu đúng',
      playAgain: 'Làm lại bộ câu hỏi',
    },
    catcher: {
      eyebrow: 'Trò 3 • Phản xạ nhanh',
      title: 'Bắt Hạt Mầm Lòng Tốt',
      description:
        'Trong 25 giây, bấm vào biểu tượng tích cực để tăng điểm. Hãy né đám mây tiêu cực vì nó sẽ trừ điểm.',
      time: 'Thời gian',
      score: 'Điểm phản xạ',
      finalScore: 'Điểm vừa đạt',
      start: 'Bắt đầu 25 giây',
      restart: 'Chơi lại 25 giây',
      positiveHint: 'Nên bắt: 💚 🌱 🧹 🤝',
      negativeHint: 'Nên né: 🌩️',
      ended: 'Hết giờ! Bạn đã gieo thêm năng lượng tích cực.',
    },
  },
  en: {
    common: {
      best: 'Best',
      seeds: 'seeds',
      reset: 'Play again',
      points: 'points',
      moves: 'flips',
      progress: 'Progress',
      next: 'Next question',
      finish: 'Finish',
      start: 'Start',
      playing: 'Playing',
      reward: 'Reward',
    },
    memory: {
      eyebrow: 'Game 1 • Memory',
      title: 'Good Deed Match',
      description:
        'Flip 2 cards per turn. Matching kindness actions stay visible, and you earn seeds after completing the board.',
      complete: 'Wonderful! You matched every good-deed pair.',
      hiddenCard: 'Hidden card',
      matched: 'Matched',
      reward: '+30 seeds on completion',
    },
    quiz: {
      eyebrow: 'Game 2 • Kind decisions',
      title: 'Scenario Messenger',
      description:
        'Read each scenario and choose the best response. Every correct answer trains a real-life kindness reflex.',
      question: 'Scenario',
      correct: 'A very kind choice!',
      wrong: 'Not the best yet — try a warmer response next time.',
      score: 'Correct answers',
      resultTitle: 'Messenger result',
      resultDesc: 'You completed the community response challenge.',
      reward: 'Earn seeds based on correct answers',
      playAgain: 'Retake the quiz',
    },
    catcher: {
      eyebrow: 'Game 3 • Quick reflex',
      title: 'Kindness Seed Catcher',
      description:
        'In 25 seconds, tap positive symbols to score. Avoid the negative cloud because it removes points.',
      time: 'Time',
      score: 'Reflex score',
      finalScore: 'Last score',
      start: 'Start 25 seconds',
      restart: 'Restart 25 seconds',
      positiveHint: 'Catch: 💚 🌱 🧹 🤝',
      negativeHint: 'Avoid: 🌩️',
      ended: 'Time is up! You planted more positive energy.',
    },
  },
};

const MEMORY_PAIRS = [
  { id: 'elder', emoji: '👵', vi: 'Giúp người lớn tuổi', en: 'Help an elder' },
  { id: 'trash', emoji: '🧹', vi: 'Dọn rác công viên', en: 'Clean a park' },
  { id: 'blood', emoji: '🩸', vi: 'Hiến máu nhân đạo', en: 'Donate blood' },
  { id: 'book', emoji: '📚', vi: 'Tặng sách cũ', en: 'Donate books' },
  { id: 'meal', emoji: '🍱', vi: 'Chia sẻ bữa ăn', en: 'Share a meal' },
  { id: 'tree', emoji: '🌳', vi: 'Trồng cây xanh', en: 'Plant a tree' },
];

const QUIZ_QUESTIONS = [
  {
    id: 'bus-seat',
    vi: 'Trên xe buýt đông người, một cô chú lớn tuổi vừa bước lên và chưa có chỗ ngồi.',
    en: 'On a crowded bus, an older person has just stepped on and has no seat.',
    options: [
      {
        vi: 'Nhường ghế, hỏi cô/chú có cần hỗ trợ khi xuống trạm không.',
        en: 'Offer your seat and ask if they need help getting off at their stop.',
        correct: true,
      },
      {
        vi: 'Giả vờ không thấy vì mình cũng mệt.',
        en: 'Pretend not to notice because you are tired too.',
      },
      {
        vi: 'Chụp ảnh đăng mạng nhưng không làm gì thêm.',
        en: 'Take a photo for social media but do nothing else.',
      },
    ],
    explainVi: 'Lòng tốt bắt đầu từ hành động trực tiếp, tôn trọng và vừa đủ.',
    explainEn: 'Kindness starts with direct, respectful, practical action.',
  },
  {
    id: 'lost-wallet',
    vi: 'Bạn nhặt được một chiếc ví trong sân trường, bên trong có giấy tờ cá nhân.',
    en: 'You find a wallet at school with personal documents inside.',
    options: [
      {
        vi: 'Mang đến phòng bảo vệ/ban quản lý và tìm cách liên hệ người mất.',
        en: 'Take it to security/management and help contact the owner.',
        correct: true,
      },
      {
        vi: 'Giữ lại vì không ai nhìn thấy.',
        en: 'Keep it because nobody saw you.',
      },
      {
        vi: 'Để nguyên tại chỗ rồi đi tiếp.',
        en: 'Leave it there and walk away.',
      },
    ],
    explainVi: 'Trả lại tài sản đúng nơi giúp bảo vệ người mất và cả chính bạn.',
    explainEn: 'Returning property properly protects both the owner and yourself.',
  },
  {
    id: 'online-comment',
    vi: 'Một bạn đăng câu chuyện việc tốt nhưng bị bình luận mỉa mai.',
    en: 'Someone posts a good-deed story and receives a sarcastic comment.',
    options: [
      {
        vi: 'Viết bình luận động viên, báo cáo nội dung công kích nếu cần.',
        en: 'Leave encouragement and report harmful comments if needed.',
        correct: true,
      },
      {
        vi: 'Hùa theo để câu chuyện thêm náo nhiệt.',
        en: 'Join the sarcasm to make the thread more lively.',
      },
      {
        vi: 'Nhắn riêng trách người đăng vì làm màu.',
        en: 'Message the author privately accusing them of showing off.',
      },
    ],
    explainVi: 'Lan tỏa tử tế trên mạng cũng quan trọng như hành động ngoài đời.',
    explainEn: 'Spreading kindness online matters as much as offline action.',
  },
  {
    id: 'rain-crossing',
    vi: 'Trời mưa lớn, bạn thấy một em nhỏ đang loay hoay qua đường gần cổng trường.',
    en: 'It is raining heavily and a child is struggling to cross near the school gate.',
    options: [
      {
        vi: 'Quan sát an toàn, hỏi em có cần che ô và dẫn qua vạch sang đường.',
        en: 'Check safety, ask if they need your umbrella, and guide them across the crosswalk.',
        correct: true,
      },
      {
        vi: 'Chạy thật nhanh qua trước để khỏi bị ướt.',
        en: 'Run across first so you do not get wet.',
      },
      {
        vi: 'Đứng quay video làm kỷ niệm.',
        en: 'Record a video as a memory.',
      },
    ],
    explainVi: 'Tử tế cần đi cùng an toàn: hỏi trước, hỗ trợ đúng cách.',
    explainEn: 'Kindness should be safe: ask first and support properly.',
  },
  {
    id: 'community-map',
    vi: 'Nhóm bạn vừa dọn sạch một đoạn kênh nhỏ và muốn truyền cảm hứng cho khu phố.',
    en: 'Your group cleaned a small canal section and wants to inspire the neighborhood.',
    options: [
      {
        vi: 'Chụp ảnh trước/sau, viết câu chuyện thật và ghim lên KindnessMap.',
        en: 'Take before/after photos, write a real story, and pin it on KindnessMap.',
        correct: true,
      },
      {
        vi: 'Chỉ đăng trạng thái khoe công mà không ghi địa điểm hay bài học.',
        en: 'Only post a boastful status without location or lessons learned.',
      },
      {
        vi: 'Không chia sẻ với ai vì việc tốt không cần lan tỏa.',
        en: 'Share with nobody because good deeds should not spread.',
      },
    ],
    explainVi: 'Một câu chuyện rõ ràng có thể kéo thêm nhiều người cùng tham gia.',
    explainEn: 'A clear story can invite many more people to join.',
  },
];

const CATCHER_TYPES = [
  {
    id: 'heart',
    emoji: '💚',
    points: 3,
    vi: 'Trái tim tử tế',
    en: 'Kind heart',
    className: 'from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 dark:from-emerald-500/20 dark:to-teal-500/10 dark:text-emerald-200 dark:border-emerald-400/30',
  },
  {
    id: 'seed',
    emoji: '🌱',
    points: 2,
    vi: 'Hạt mầm xanh',
    en: 'Green seed',
    className: 'from-lime-100 to-emerald-100 text-lime-700 border-lime-200 dark:from-lime-500/20 dark:to-emerald-500/10 dark:text-lime-200 dark:border-lime-400/30',
  },
  {
    id: 'broom',
    emoji: '🧹',
    points: 4,
    vi: 'Dọn sạch rác',
    en: 'Clean up',
    className: 'from-amber-100 to-orange-100 text-amber-700 border-amber-200 dark:from-amber-500/20 dark:to-orange-500/10 dark:text-amber-200 dark:border-amber-400/30',
  },
  {
    id: 'handshake',
    emoji: '🤝',
    points: 5,
    vi: 'Kết nối cộng đồng',
    en: 'Community link',
    className: 'from-cyan-100 to-blue-100 text-cyan-700 border-cyan-200 dark:from-cyan-500/20 dark:to-blue-500/10 dark:text-cyan-200 dark:border-cyan-400/30',
  },
  {
    id: 'storm',
    emoji: '🌩️',
    points: -4,
    vi: 'Đám mây tiêu cực',
    en: 'Negative cloud',
    className: 'from-slate-200 to-slate-100 text-slate-700 border-slate-300 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200 dark:border-slate-600',
  },
];

const readNumberStorage = (key, fallback = 0) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const writeNumberStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, String(value));
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const randomBetween = (min, max) => Math.round(Math.random() * (max - min) + min);

const buildMemoryDeck = () =>
  [...MEMORY_PAIRS, ...MEMORY_PAIRS]
    .map((pair, index) => ({
      uid: `${pair.id}-${index}-${Math.random().toString(36).slice(2)}`,
      pairId: pair.id,
      emoji: pair.emoji,
      vi: pair.vi,
      en: pair.en,
    }))
    .sort(() => Math.random() - 0.5);

const createCatcherItem = () => {
  const type = Math.random() < 0.18 ? CATCHER_TYPES.find((item) => item.id === 'storm') : pick(CATCHER_TYPES.filter((item) => item.id !== 'storm'));
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    typeId: type.id,
    x: randomBetween(6, 86),
    y: randomBetween(12, 78),
    size: randomBetween(46, 62),
    rotate: randomBetween(-12, 12),
  };
};

const GameShell = ({ id, icon: Icon, eyebrow, title, description, children, accent = 'emerald' }) => {
  const accentClasses = {
    emerald: 'from-emerald-500 to-teal-400 shadow-emerald-500/20',
    cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/20',
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/20',
  };

  return (
    <section id={id} className="km-panel-hero p-5 sm:p-7 lg:p-8 scroll-mt-28">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-emerald-500/8 via-cyan-400/8 to-amber-300/8 pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${accentClasses[accent]} text-white flex items-center justify-center shadow-xl shrink-0`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-green dark:text-emerald-300">
                {eyebrow}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mt-1">
                {title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mt-2">
                {description}
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
};

const MetricPill = ({ icon: Icon, label, value, tone = 'emerald' }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-400/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-400/20',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${tones[tone]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-black opacity-75 truncate">{label}</p>
        <p className="text-sm sm:text-base font-black truncate">{value}</p>
      </div>
    </div>
  );
};

const MemoryKindnessMatch = ({ locale, onAward }) => {
  const copy = GAME_COPY[locale];
  const [cards, setCards] = useState(() => buildMemoryDeck());
  const [flipped, setFlipped] = useState([]);
  const [matchedIds, setMatchedIds] = useState(() => new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [best, setBest] = useState(() => readNumberStorage(MEMORY_BEST_KEY, 0));

  const reset = useCallback(() => {
    setCards(buildMemoryDeck());
    setFlipped([]);
    setMatchedIds(new Set());
    setMoves(0);
    setLocked(false);
    setAwarded(false);
  }, []);

  const handleFlip = (card) => {
    if (locked || matchedIds.has(card.pairId)) return;
    setFlipped((prev) => {
      if (prev.length >= 2 || prev.includes(card.uid)) return prev;
      return [...prev, card.uid];
    });
  };

  useEffect(() => {
    if (flipped.length !== 2) return undefined;

    setLocked(true);
    setMoves((prev) => prev + 1);
    const [firstUid, secondUid] = flipped;
    const first = cards.find((card) => card.uid === firstUid);
    const second = cards.find((card) => card.uid === secondUid);

    const timeout = window.setTimeout(() => {
      if (first && second && first.pairId === second.pairId) {
        setMatchedIds((prev) => {
          const next = new Set(prev);
          next.add(first.pairId);
          return next;
        });
      }
      setFlipped([]);
      setLocked(false);
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [cards, flipped]);

  const complete = matchedIds.size === MEMORY_PAIRS.length;
  const progress = Math.round((matchedIds.size / MEMORY_PAIRS.length) * 100);

  useEffect(() => {
    if (!complete || awarded) return;
    setAwarded(true);
    onAward(30);
    setBest((prev) => {
      const next = prev === 0 ? moves : Math.min(prev, moves);
      writeNumberStorage(MEMORY_BEST_KEY, next);
      return next;
    });
  }, [awarded, complete, moves, onAward]);

  return (
    <GameShell
      id="memory-game"
      icon={HeartHandshake}
      eyebrow={copy.memory.eyebrow}
      title={copy.memory.title}
      description={copy.memory.description}
      accent="emerald"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const isOpen = flipped.includes(card.uid) || matchedIds.has(card.pairId);
            const isMatched = matchedIds.has(card.pairId);
            return (
              <button
                key={card.uid}
                type="button"
                onClick={() => handleFlip(card)}
                disabled={locked || isMatched}
                aria-label={isOpen ? card[locale] : copy.memory.hiddenCard}
                className={`relative aspect-square rounded-3xl border p-3 sm:p-4 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-sm transition-all duration-300 ${
                  isOpen
                    ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 scale-[1.01] shadow-xl shadow-emerald-500/10'
                    : 'bg-gradient-to-br from-emerald-500 to-cyan-500 border-white/30 text-white hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20'
                } ${locked && !isOpen ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                {isOpen ? (
                  <>
                    <span className="text-3xl sm:text-4xl" aria-hidden="true">{card.emoji}</span>
                    <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-100 leading-tight text-center">
                      {card[locale]}
                    </span>
                    {isMatched && (
                      <span className="absolute right-2 top-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.32),transparent_32%)]" />
                    <Sparkles className="relative z-10 w-7 h-7 sm:w-9 sm:h-9" />
                    <span className="relative z-10 text-lg sm:text-2xl font-black">?</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
            <MetricPill icon={Target} label={copy.common.progress} value={`${progress}%`} tone="emerald" />
            <MetricPill icon={RotateCcw} label={copy.common.moves} value={moves} tone="blue" />
            <MetricPill icon={Trophy} label={copy.common.best} value={best ? `${best} ${copy.common.moves}` : '—'} tone="amber" />
            <MetricPill icon={Leaf} label={copy.common.reward} value={copy.memory.reward} tone="rose" />
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              {complete ? copy.memory.complete : `${matchedIds.size}/${MEMORY_PAIRS.length} ${copy.memory.matched}`}
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black hover:-translate-y-0.5 transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            {copy.common.reset}
          </button>
        </aside>
      </div>
    </GameShell>
  );
};

const ScenarioQuiz = ({ locale, onAward }) => {
  const copy = GAME_COPY[locale];
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [best, setBest] = useState(() => readNumberStorage(QUIZ_BEST_KEY, 0));

  const current = QUIZ_QUESTIONS[index];
  const selectedOption = selectedIndex === null ? null : current.options[selectedIndex];
  const isCorrect = Boolean(selectedOption?.correct);
  const progress = Math.round(((finished ? QUIZ_QUESTIONS.length : index) / QUIZ_QUESTIONS.length) * 100);

  const reset = useCallback(() => {
    setIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setFinished(false);
    setAwarded(false);
  }, []);

  const chooseOption = (optionIndex) => {
    if (selectedIndex !== null || finished) return;
    setSelectedIndex(optionIndex);
    if (current.options[optionIndex].correct) setScore((prev) => prev + 1);
  };

  const goNext = () => {
    if (selectedIndex === null) return;
    if (index === QUIZ_QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelectedIndex(null);
  };

  useEffect(() => {
    if (!finished || awarded) return;
    setAwarded(true);
    const reward = 8 + score * 6;
    onAward(reward);
    setBest((prev) => {
      const next = Math.max(prev, score);
      writeNumberStorage(QUIZ_BEST_KEY, next);
      return next;
    });
  }, [awarded, finished, onAward, score]);

  return (
    <GameShell
      id="quiz-game"
      icon={Brain}
      eyebrow={copy.quiz.eyebrow}
      title={copy.quiz.title}
      description={copy.quiz.description}
      accent="cyan"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm">
          {finished ? (
            <div className="min-h-[360px] flex flex-col items-center justify-center text-center gap-5">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                <Trophy className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{copy.quiz.resultTitle}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{copy.quiz.resultDesc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <MetricPill icon={CheckCircle2} label={copy.quiz.score} value={`${score}/${QUIZ_QUESTIONS.length}`} tone="emerald" />
                <MetricPill icon={Leaf} label={copy.common.seeds} value={`+${8 + score * 6}`} tone="amber" />
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-3 text-sm font-black shadow-xl shadow-cyan-500/20 hover:-translate-y-0.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {copy.quiz.playAgain}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 w-fit rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-200 px-3 py-1 text-xs font-black">
                  <MapPin className="w-4 h-4" />
                  {copy.quiz.question} {index + 1}/{QUIZ_QUESTIONS.length}
                </span>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {copy.quiz.score}: {score}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                {current[locale]}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {current.options.map((option, optionIndex) => {
                  const isSelected = selectedIndex === optionIndex;
                  const reveal = selectedIndex !== null;
                  const correct = Boolean(option.correct);
                  return (
                    <button
                      key={option[locale]}
                      type="button"
                      onClick={() => chooseOption(optionIndex)}
                      disabled={selectedIndex !== null}
                      className={`text-left rounded-3xl border p-4 sm:p-5 flex items-start gap-3 transition-all ${
                        reveal && correct
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100'
                          : reveal && isSelected && !correct
                            ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-white dark:bg-slate-950/70 border border-black/5 dark:border-white/10 flex items-center justify-center font-black text-xs shrink-0">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1 text-sm font-bold leading-relaxed">{option[locale]}</span>
                      {reveal && correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                      {reveal && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selectedIndex !== null && (
                <div className={`rounded-3xl p-4 border ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-400/20 dark:text-emerald-100' : 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-500/10 dark:border-amber-400/20 dark:text-amber-100'}`}>
                  <p className="text-sm font-black flex items-center gap-2">
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    {isCorrect ? copy.quiz.correct : copy.quiz.wrong}
                  </p>
                  <p className="text-xs font-semibold mt-1 opacity-90">
                    {locale === 'vi' ? current.explainVi : current.explainEn}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={goNext}
                disabled={selectedIndex === null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all shadow-lg"
              >
                {index === QUIZ_QUESTIONS.length - 1 ? copy.common.finish : copy.common.next}
                <Zap className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <MetricPill icon={Target} label={copy.common.progress} value={`${progress}%`} tone="blue" />
            <MetricPill icon={CheckCircle2} label={copy.quiz.score} value={`${score}/${QUIZ_QUESTIONS.length}`} tone="emerald" />
            <MetricPill icon={Trophy} label={copy.common.best} value={`${best}/${QUIZ_QUESTIONS.length}`} tone="amber" />
            <MetricPill icon={Leaf} label={copy.common.reward} value={copy.quiz.reward} tone="rose" />
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </GameShell>
  );
};

const KindnessCatcher = ({ locale, onAward }) => {
  const copy = GAME_COPY[locale];
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([]);
  const [best, setBest] = useState(() => readNumberStorage(CATCHER_BEST_KEY, 0));
  const [lastDelta, setLastDelta] = useState(null);
  const [endedScore, setEndedScore] = useState(null);
  const scoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const finishGame = useCallback(() => {
    setPlaying((wasPlaying) => {
      if (!wasPlaying) return wasPlaying;
      const finalScore = scoreRef.current;
      setEndedScore(finalScore);
      setItems([]);
      setLastDelta(null);
      const reward = Math.floor(Math.max(finalScore, 0) / 3);
      if (reward > 0) onAward(reward);
      setBest((prev) => {
        const next = Math.max(prev, finalScore);
        writeNumberStorage(CATCHER_BEST_KEY, next);
        return next;
      });
      return false;
    });
  }, [onAward]);

  const startGame = useCallback(() => {
    setScore(0);
    setEndedScore(null);
    setLastDelta(null);
    setTimeLeft(25);
    setItems(Array.from({ length: 8 }, createCatcherItem));
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;

    const countdown = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.setTimeout(finishGame, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawner = window.setInterval(() => {
      setItems((prev) => [...prev.slice(-8), createCatcherItem()]);
    }, 780);

    return () => {
      window.clearInterval(countdown);
      window.clearInterval(spawner);
    };
  }, [finishGame, playing]);

  const catchItem = (item) => {
    if (!playing) return;
    const type = CATCHER_TYPES.find((entry) => entry.id === item.typeId);
    if (!type) return;

    setScore((prev) => Math.max(0, prev + type.points));
    setLastDelta({ points: type.points, label: type[locale], uid: item.uid });
    setItems((prev) => prev.filter((entry) => entry.uid !== item.uid).concat(createCatcherItem()));
  };

  const progress = Math.round((timeLeft / 25) * 100);

  return (
    <GameShell
      id="catcher-game"
      icon={Gamepad2}
      eyebrow={copy.catcher.eyebrow}
      title={copy.catcher.title}
      description={copy.catcher.description}
      accent="amber"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="relative min-h-[420px] rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 via-cyan-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.18),transparent_24%),linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:auto,auto,48px_48px,48px_48px] pointer-events-none" />

          <div className="absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/85 dark:bg-slate-950/80 backdrop-blur px-3 py-2 border border-white/70 dark:border-slate-700 shadow-sm">
              <Timer className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-black text-slate-800 dark:text-white">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/85 dark:bg-slate-950/80 backdrop-blur px-3 py-2 border border-white/70 dark:border-slate-700 shadow-sm">
              <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span className="text-sm font-black text-slate-800 dark:text-white">{score}</span>
            </div>
          </div>

          <div className="absolute left-4 right-4 top-16 z-20 h-2 rounded-full bg-white/70 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {!playing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-white/50 dark:bg-slate-950/45 backdrop-blur-[2px]">
              <div className="max-w-md rounded-[32px] bg-white/92 dark:bg-slate-900/92 border border-white/70 dark:border-slate-700 p-6 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-[1.6rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-4">
                  {endedScore === null ? copy.catcher.title : copy.catcher.ended}
                </h3>
                {endedScore !== null && (
                  <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    {copy.catcher.finalScore}: <span className="text-brand-green font-black">{endedScore}</span>
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{copy.catcher.positiveHint}</span>
                  <span>{copy.catcher.negativeHint}</span>
                </div>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-5 py-3 text-sm font-black shadow-xl shadow-amber-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  {endedScore === null ? copy.catcher.start : copy.catcher.restart}
                </button>
              </div>
            </div>
          )}

          {items.map((item) => {
            const type = CATCHER_TYPES.find((entry) => entry.id === item.typeId);
            if (!type) return null;
            return (
              <button
                key={item.uid}
                type="button"
                onClick={() => catchItem(item)}
                aria-label={`${type[locale]} ${type.points > 0 ? '+' : ''}${type.points}`}
                className={`absolute z-10 rounded-3xl border bg-gradient-to-br ${type.className} flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform duration-200`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                  transform: `rotate(${item.rotate}deg)`,
                }}
              >
                <span className="text-2xl" aria-hidden="true">{type.emoji}</span>
              </button>
            );
          })}

          {lastDelta && playing && (
            <div className={`absolute right-5 bottom-5 z-20 rounded-2xl px-4 py-3 shadow-xl border bg-white/90 dark:bg-slate-950/90 ${lastDelta.points >= 0 ? 'text-emerald-700 border-emerald-100 dark:text-emerald-200 dark:border-emerald-400/20' : 'text-rose-700 border-rose-100 dark:text-rose-200 dark:border-rose-400/20'}`}>
              <p className="text-xs font-black uppercase tracking-widest">{lastDelta.label}</p>
              <p className="text-lg font-black">{lastDelta.points > 0 ? '+' : ''}{lastDelta.points}</p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
            <MetricPill icon={Timer} label={copy.catcher.time} value={`${timeLeft}s`} tone="amber" />
            <MetricPill icon={Star} label={copy.catcher.score} value={score} tone="emerald" />
            <MetricPill icon={Trophy} label={copy.common.best} value={best} tone="blue" />
            <MetricPill icon={Leaf} label={copy.common.seeds} value={`+${Math.floor(Math.max(score, 0) / 3)}`} tone="rose" />
          </div>
          <button
            type="button"
            onClick={playing ? finishGame : startGame}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black hover:-translate-y-0.5 transition-all shadow-lg"
          >
            {playing ? copy.common.finish : copy.catcher.start}
            <Zap className="w-4 h-4" />
          </button>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4 space-y-3">
            {CATCHER_TYPES.map((type) => (
              <div key={type.id} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{type.emoji}</span>
                  {type[locale]}
                </span>
                <span className={type.points >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                  {type.points > 0 ? '+' : ''}{type.points}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </GameShell>
  );
};

const GameIntroCard = ({ href, icon: Icon, title, description, tone }) => {
  const tones = {
    emerald: 'from-emerald-500/12 to-teal-500/8 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-400/20',
    cyan: 'from-cyan-500/12 to-blue-500/8 text-cyan-600 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-400/20',
    amber: 'from-amber-500/14 to-orange-500/8 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-400/20',
  };

  return (
    <a href={href} className={`group rounded-[28px] border bg-gradient-to-br ${tones[tone]} p-5 shadow-sm hover:-translate-y-1 hover:shadow-2xl transition-all`}>
      <div className="w-12 h-12 rounded-2xl bg-white/85 dark:bg-slate-950/60 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    </a>
  );
};

export const KindnessGames = () => {
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en' : 'vi';
  const page = PAGE_COPY[locale];
  const [totalSeeds, setTotalSeeds] = useState(() => readNumberStorage(TOTAL_SEEDS_KEY, 0));
  const [awardFlash, setAwardFlash] = useState(null);

  const rank = useMemo(
    () => page.ranks.find((item) => totalSeeds >= item.min) || page.ranks[page.ranks.length - 1],
    [page.ranks, totalSeeds]
  );

  const awardSeeds = useCallback((amount) => {
    if (!amount || amount <= 0) return;
    setTotalSeeds((prev) => {
      const next = prev + amount;
      writeNumberStorage(TOTAL_SEEDS_KEY, next);
      return next;
    });
    setAwardFlash({ id: Date.now(), amount });
  }, []);

  useEffect(() => {
    if (!awardFlash) return undefined;
    const timeout = window.setTimeout(() => setAwardFlash(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [awardFlash]);

  return (
    <div data-no-i18n="true" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {awardFlash && (
        <div className="fixed right-4 top-24 z-50 rounded-3xl border border-emerald-200 dark:border-emerald-400/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-5 py-4 shadow-2xl shadow-emerald-500/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-200 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <p className="font-black text-emerald-700 dark:text-emerald-200">
              {page.flashPrefix}{awardFlash.amount}{page.flashSuffix}
            </p>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[2.4rem] bg-slate-950 text-white border border-white/10 shadow-[0_35px_120px_-55px_rgba(16,185,129,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.34),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(6,182,212,0.24),transparent_32%),radial-gradient(circle_at_60%_95%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_420px] gap-10 p-6 sm:p-10 lg:p-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
              {page.badge}
            </span>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]">
                {page.title}
              </h1>
              <p className="mt-5 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-300 font-medium">
                {page.subtitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#memory-game" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 px-6 py-3.5 text-sm font-black shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 transition-all">
                <Gamepad2 className="w-5 h-5" />
                {page.playNow}
              </a>
              <NavLink to="/explore" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 text-white px-6 py-3.5 text-sm font-black hover:bg-white/15 transition-all">
                <MapPin className="w-5 h-5" />
                {page.exploreMap}
              </NavLink>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">{page.totalSeeds}</p>
                <p className="text-4xl font-black mt-1">{totalSeeds}</p>
              </div>
              <div className="w-16 h-16 rounded-[1.6rem] bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-3xl">
                {rank.icon}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-5">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{page.rankLabel}</p>
                <p className="font-black text-lg mt-1 text-white">{rank.label}</p>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 flex items-center gap-3">
                <BadgeCheck className="w-6 h-6 text-emerald-300" />
                <p className="font-black text-white">{page.completedLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{page.gamesTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{page.gamesSubtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GameIntroCard href="#memory-game" icon={HeartHandshake} title={page.memoryCardTitle} description={page.memoryCardDesc} tone="emerald" />
          <GameIntroCard href="#quiz-game" icon={Brain} title={page.quizCardTitle} description={page.quizCardDesc} tone="cyan" />
          <GameIntroCard href="#catcher-game" icon={Gamepad2} title={page.catcherCardTitle} description={page.catcherCardDesc} tone="amber" />
        </div>
      </section>

      <MemoryKindnessMatch locale={locale} onAward={awardSeeds} />
      <ScenarioQuiz locale={locale} onAward={awardSeeds} />
      <KindnessCatcher locale={locale} onAward={awardSeeds} />

      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/80 dark:border-emerald-400/20 bg-gradient-to-r from-emerald-50 via-cyan-50 to-amber-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-amber-950/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-3xl bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-sm shrink-0">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{page.footerTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{page.footerDesc}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <NavLink to="/submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black hover:-translate-y-0.5 transition-all shadow-lg">
              <Heart className="w-4 h-4 fill-current" />
              {page.submitStory}
            </NavLink>
            <NavLink to="/stories" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-3 text-sm font-black hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-4 h-4" />
              {page.backToStories}
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KindnessGames;
