const { queryAll, queryGet, queryRun } = require('../config/db');

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const URGENCY_SCORE_MAP = {
  low: 55,
  medium: 70,
  high: 85,
  critical: 100,
};

const LEVEL_REPUTATION_BONUS = {
  'Active Citizen': 5,
  'Kindness Ambassador': 10,
  'Community Inspiration': 13,
  'Community Hero': 15,
};

const CATEGORY_SKILL_MAP = {
  'Môi trường': ['Tổ chức dọn rác', 'Phân loại rác', 'Truyền thông môi trường'],
  'Người cao tuổi': ['Chăm sóc người cao tuổi', 'Giao tiếp cộng đồng', 'Hỗ trợ sinh hoạt'],
  'Trồng cây': ['Trồng cây', 'Chăm sóc cây xanh', 'Điều phối tình nguyện'],
  'Hiến máu': ['Hỗ trợ y tế cộng đồng', 'Sơ cứu cơ bản', 'Tổ chức sự kiện'],
  'Giáo dục': ['Kèm học', 'Đào tạo kỹ năng', 'Tổ chức lớp học'],
  'Tình nguyện': ['Điều phối tình nguyện', 'Gây quỹ', 'Hậu cần cộng đồng'],
  'Cộng đồng': ['Kết nối cộng đồng', 'Điều phối sự kiện', 'Hỗ trợ khẩn cấp'],
};
const buildUserVector = (user) => {
  return {
    skills: user.skills || [],
    interests: user.interests || [],
    reputation: user.points || 0,
    location: {
      lat: user.baseLatitude,
      lng: user.baseLongitude
    }
  };
};
const buildNeedVector = (request) => {
  return {
    skills: request.requiredSkills,
    urgency: request.urgency,
    location: {
      lat: request.latitude,
      lng: request.longitude
    }
  };
};
const similarity = (arr1, arr2) => {
  const common =
      arr1.filter(x => arr2.includes(x)).length;

  return common / Math.max(arr1.length, arr2.length);
};

const PROFILE_DEFAULTS = {
  skills: [],
  communityExperience: 'Beginner',
  yearsExperience: 0,
  serviceAreas: [],
  availableTimeSlots: ['weekend'],
  interests: ['Cộng đồng'],
  availabilityStatus: 'available',
  baseLatitude: null,
  baseLongitude: null,
  locationName: 'Việt Nam',
};

const cleanText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const uniqueCleanList = (values = []) => {
  const seen = new Set();
  const result = [];

  values
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .forEach((item) => {
      const normalized = cleanText(item);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(item);
      }
    });

  return result;
};

const parseListInput = (value) => {
  if (Array.isArray(value)) return uniqueCleanList(value);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return uniqueCleanList(parsed);
    } catch (error) {
      return uniqueCleanList(value.split(','));
    }
  }
  return [];
};

const serializeList = (value) => JSON.stringify(uniqueCleanList(value));

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const values = [lat1, lon1, lat2, lon2].map(Number);
  if (values.some((item) => !Number.isFinite(item))) return null;

  const [aLat, aLon, bLat, bLon] = values;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadiusKm * c;
};

const distanceToScore = (distanceKm) => {
  if (distanceKm === null) return 45;
  if (distanceKm <= 2) return 100;
  if (distanceKm <= 5) return 92;
  if (distanceKm <= 10) return 82;
  if (distanceKm <= 20) return 68;
  if (distanceKm <= 35) return 52;
  if (distanceKm <= 50) return 35;
  return 15;
};

const urgencyToScore = (urgencyLevel = 'medium') =>
  URGENCY_SCORE_MAP[cleanText(urgencyLevel)] || URGENCY_SCORE_MAP.medium;

const normalizeProfileRow = (row = {}, fallbackUser = {}) => ({
  id: row.id,
  userId: row.userId || fallbackUser.id,
  fullName: row.fullName || fallbackUser.fullName,
  email: row.email || fallbackUser.email,
  avatar: row.avatar || fallbackUser.avatar,
  points: Number(row.points || fallbackUser.points || 0),
  level: row.level || fallbackUser.level || 'Active Citizen',
  approvedPostsCount: Number(row.approvedPostsCount || 0),
  skills: parseListInput(row.skills),
  communityExperience: EXPERIENCE_LEVELS.includes(row.communityExperience) ? row.communityExperience : 'Beginner',
  yearsExperience: Number(row.yearsExperience || 0),
  serviceAreas: parseListInput(row.serviceAreas),
  availableTimeSlots: parseListInput(row.availableTimeSlots),
  interests: parseListInput(row.interests),
  availabilityStatus: row.availabilityStatus || 'available',
  baseLatitude: toNumberOrNull(row.baseLatitude),
  baseLongitude: toNumberOrNull(row.baseLongitude),
  locationName: row.locationName || 'Việt Nam',
});

const sortRequestsByUrgency = (rows = []) => {
  const priority = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...rows].sort((a, b) => {
    const urgencyDiff = (priority[cleanText(a.urgencyLevel)] ?? 4) - (priority[cleanText(b.urgencyLevel)] ?? 4);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

const getDefaultProfileSeedFromHistory = async (userId) => {
  const history = await queryAll(
    `SELECT category, locationName, latitude, longitude
     FROM Posts
     WHERE userId = ? AND status = 'Approved'
     ORDER BY createdAt DESC`,
    [userId]
  );

  const approvedPostsCount = history.length;
  const latest = history[0] || {};
  const interests = uniqueCleanList(history.map((item) => item.category).filter(Boolean));
  const skills = uniqueCleanList(
    history.flatMap((item) => CATEGORY_SKILL_MAP[item.category] || ['Hỗ trợ cộng đồng'])
  );

  let communityExperience = 'Beginner';
  if (approvedPostsCount >= 6) communityExperience = 'Expert';
  else if (approvedPostsCount >= 4) communityExperience = 'Advanced';
  else if (approvedPostsCount >= 2) communityExperience = 'Intermediate';

  return {
    ...PROFILE_DEFAULTS,
    skills,
    interests: interests.length ? interests : PROFILE_DEFAULTS.interests,
    communityExperience,
    yearsExperience: Math.min(approvedPostsCount, 8),
    serviceAreas: latest.locationName ? [latest.locationName] : PROFILE_DEFAULTS.serviceAreas,
    baseLatitude: toNumberOrNull(latest.latitude),
    baseLongitude: toNumberOrNull(latest.longitude),
    locationName: latest.locationName || PROFILE_DEFAULTS.locationName,
    availableTimeSlots: approvedPostsCount >= 2 ? ['weekend', 'evening'] : PROFILE_DEFAULTS.availableTimeSlots,
  };
};

const ensureCapabilityProfile = async (userId) => {
  const existing = await queryGet(`SELECT * FROM UserCapabilityProfiles WHERE userId = ?`, [userId]);
  if (existing) return existing;

  const seed = await getDefaultProfileSeedFromHistory(userId);
  await queryRun(
    `INSERT INTO UserCapabilityProfiles (
      userId, skills, communityExperience, yearsExperience, serviceAreas,
      availableTimeSlots, interests, availabilityStatus, baseLatitude, baseLongitude, locationName
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      serializeList(seed.skills),
      seed.communityExperience,
      seed.yearsExperience,
      serializeList(seed.serviceAreas),
      serializeList(seed.availableTimeSlots),
      serializeList(seed.interests),
      seed.availabilityStatus,
      seed.baseLatitude,
      seed.baseLongitude,
      seed.locationName,
    ]
  );

  return queryGet(`SELECT * FROM UserCapabilityProfiles WHERE userId = ?`, [userId]);
};

const computeSkillScore = (profile, request) => {
  const requiredSkills = parseListInput(request.requiredSkills);
  const profileSkills = uniqueCleanList(profile.skills);

  if (!requiredSkills.length) {
    return profile.interests.some((interest) => cleanText(interest) === cleanText(request.category)) ? 82 : 62;
  }

  const profileSkillSet = new Set(profileSkills.map(cleanText));
  const overlap = requiredSkills.filter((skill) => profileSkillSet.has(cleanText(skill)));
  const overlapRatio = overlap.length / requiredSkills.length;
  const interestBonus = profile.interests.some((interest) => cleanText(interest) === cleanText(request.category)) ? 10 : 0;
  const experienceBonus = {
    Beginner: 0,
    Intermediate: 5,
    Advanced: 10,
    Expert: 12,
  }[profile.communityExperience] || 0;

  return clamp(overlapRatio * 100 + interestBonus + experienceBonus);
};

const computeDistanceScore = (profile, request) => {
  const distanceKm = haversineKm(profile.baseLatitude, profile.baseLongitude, request.latitude, request.longitude);
  if (distanceKm !== null) {
    return { score: distanceToScore(distanceKm), distanceKm };
  }

  const profileAreas = new Set(profile.serviceAreas.map(cleanText));
  const requestLocation = cleanText(request.locationName);
  const fallbackScore = [...profileAreas].some((area) => requestLocation.includes(area) || area.includes(requestLocation)) ? 72 : 45;
  return { score: fallbackScore, distanceKm: null };
};

const computeTimeScore = (profile, request) => {
  const availableSlots = profile.availableTimeSlots.map(cleanText);
  const preferred = cleanText(request.preferredTimeSlot || 'flexible');
  const availabilityStatus = cleanText(profile.availabilityStatus || 'available');

  let score = 70;
  if (preferred && preferred !== 'flexible') {
    score = availableSlots.includes(preferred) ? 92 : 52;
  }

  if (availableSlots.includes('emergency') && ['high', 'critical'].includes(cleanText(request.urgencyLevel))) {
    score += 8;
  }

  if (availabilityStatus === 'available') score += 8;
  if (availabilityStatus === 'busy') score -= 18;
  if (availabilityStatus === 'offline') score -= 35;

  return clamp(score);
};

const computeReputationScore = (profile) => {
  const pointsScore = Math.min(55, profile.points / 10);
  const activityScore = Math.min(25, profile.approvedPostsCount * 5);
  const levelScore = LEVEL_REPUTATION_BONUS[profile.level] || 5;
  const profileCompleteness = [
    profile.skills.length >= 3,
    profile.serviceAreas.length > 0,
    profile.availableTimeSlots.length > 0,
    profile.interests.length > 0,
  ].filter(Boolean).length * 3;

  return clamp(pointsScore + activityScore + levelScore + profileCompleteness);
};

const computeMatchForVolunteer = (profile, request) => {
  const skillScore = computeSkillScore(profile, request);
  const { score: distanceScore, distanceKm } = computeDistanceScore(profile, request);
  const timeScore = computeTimeScore(profile, request);
  const reputationScore = computeReputationScore(profile);
  const urgencyScore = urgencyToScore(request.urgencyLevel);

  const matchScore =
    skillScore * 0.35 +
    distanceScore * 0.25 +
    timeScore * 0.15 +
    reputationScore * 0.15 +
    urgencyScore * 0.1;

  const reasons = [];
  if (skillScore >= 80) reasons.push('Kỹ năng phù hợp cao với nhu cầu');
  if (distanceScore >= 75) reasons.push(distanceKm !== null ? `Ở gần hiện trường (~${distanceKm.toFixed(1)} km)` : 'Khu vực hoạt động trùng khớp');
  if (timeScore >= 80) reasons.push('Khung giờ sẵn sàng phù hợp');
  if (reputationScore >= 80) reasons.push('Uy tín cộng đồng tốt');
  if (urgencyScore >= 85) reasons.push('Ưu tiên cho yêu cầu khẩn cấp');

  return {
    userId: profile.userId,
    fullName: profile.fullName,
    email: profile.email,
    avatar: profile.avatar,
    level: profile.level,
    locationName: profile.locationName,
    availabilityStatus: profile.availabilityStatus,
    matchScore: Number(matchScore.toFixed(2)),
    breakdown: {
      S: Number(skillScore.toFixed(2)),
      D: Number(distanceScore.toFixed(2)),
      T: Number(timeScore.toFixed(2)),
      R: Number(reputationScore.toFixed(2)),
      U: Number(urgencyScore.toFixed(2)),
    },
    distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null,
    matchedSkills: parseListInput(request.requiredSkills).filter((skill) =>
      profile.skills.map(cleanText).includes(cleanText(skill))
    ),
    reasons,
  };
};

const getVolunteerCandidates = async (excludeUserId = null) => {
  const users = await queryAll(
    `SELECT u.id, u.fullName, u.email, u.avatar, u.points, u.level, u.role,
            (SELECT COUNT(*) FROM Posts p WHERE p.userId = u.id AND p.status = 'Approved') AS approvedPostsCount
     FROM Users u
     WHERE u.role IN ('user', 'admin')
     ${excludeUserId ? 'AND u.id != ?' : ''}`,
    excludeUserId ? [excludeUserId] : []
  );

  const result = [];
  for (const user of users) {
    const profileRow = await ensureCapabilityProfile(user.id);
    result.push(normalizeProfileRow(profileRow, user));
  }

  return result;
};

const getRequestById = async (requestId) => {
  const row = await queryGet(
    `SELECT sr.*, u.fullName AS requesterName, u.avatar AS requesterAvatar, mv.fullName AS matchedVolunteerName
     FROM SupportRequests sr
     JOIN Users u ON sr.requesterUserId = u.id
     LEFT JOIN Users mv ON sr.matchedVolunteerId = mv.id
     WHERE sr.id = ?`,
    [requestId]
  );

  if (!row) return null;

  return {
    ...row,
    requiredSkills: parseListInput(row.requiredSkills),
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    topMatchScore: row.topMatchScore !== null && row.topMatchScore !== undefined ? Number(row.topMatchScore) : null,
  };
};

const getProfile = async (req, res) => {
  try {
    const user = await queryGet(
      `SELECT id, fullName, email, avatar, points, level FROM Users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    const profileRow = await ensureCapabilityProfile(req.user.id);
    const approvedPostsCount = await queryGet(
      `SELECT COUNT(*) AS cnt FROM Posts WHERE userId = ? AND status = 'Approved'`,
      [req.user.id]
    );

    const normalizedProfile = normalizeProfileRow(
      { ...profileRow, approvedPostsCount: approvedPostsCount?.cnt || 0 },
      user
    );

    res.status(200).json({
      profile: normalizedProfile,
      kindnessVector: {
        skills: normalizedProfile.skills,
        serviceAreas: normalizedProfile.serviceAreas,
        availability: normalizedProfile.availableTimeSlots,
        interests: normalizedProfile.interests,
        reputationScore: computeReputationScore(normalizedProfile),
      },
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Không thể tải hồ sơ năng lực số.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    await ensureCapabilityProfile(req.user.id);

    const payload = {
      skills: parseListInput(req.body.skills),
      communityExperience: EXPERIENCE_LEVELS.includes(req.body.communityExperience) ? req.body.communityExperience : 'Beginner',
      yearsExperience: clamp(Number(req.body.yearsExperience || 0), 0, 30),
      serviceAreas: parseListInput(req.body.serviceAreas),
      availableTimeSlots: parseListInput(req.body.availableTimeSlots),
      interests: parseListInput(req.body.interests),
      availabilityStatus: req.body.availabilityStatus || 'available',
      baseLatitude: toNumberOrNull(req.body.baseLatitude),
      baseLongitude: toNumberOrNull(req.body.baseLongitude),
      locationName: String(req.body.locationName || 'Việt Nam').trim() || 'Việt Nam',
    };

    await queryRun(
      `UPDATE UserCapabilityProfiles
       SET skills = ?, communityExperience = ?, yearsExperience = ?, serviceAreas = ?,
           availableTimeSlots = ?, interests = ?, availabilityStatus = ?,
           baseLatitude = ?, baseLongitude = ?, locationName = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE userId = ?`,
      [
        serializeList(payload.skills),
        payload.communityExperience,
        payload.yearsExperience,
        serializeList(payload.serviceAreas),
        serializeList(payload.availableTimeSlots),
        serializeList(payload.interests),
        payload.availabilityStatus,
        payload.baseLatitude,
        payload.baseLongitude,
        payload.locationName,
        req.user.id,
      ]
    );

    const profile = await getRequestProfileSnapshot(req.user.id);

    res.status(200).json({
      message: 'Đã cập nhật hồ sơ năng lực số thành công.',
      profile,
      kindnessVector: {
        skills: profile.skills,
        serviceAreas: profile.serviceAreas,
        availability: profile.availableTimeSlots,
        interests: profile.interests,
        reputationScore: computeReputationScore(profile),
      },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Không thể cập nhật hồ sơ năng lực số.' });
  }
};

const getRequestProfileSnapshot = async (userId) => {
  const user = await queryGet(
    `SELECT id, fullName, email, avatar, points, level FROM Users WHERE id = ?`,
    [userId]
  );
  const profileRow = await ensureCapabilityProfile(userId);
  const approvedPostsCount = await queryGet(
    `SELECT COUNT(*) AS cnt FROM Posts WHERE userId = ? AND status = 'Approved'`,
    [userId]
  );

  return normalizeProfileRow(
    { ...profileRow, approvedPostsCount: approvedPostsCount?.cnt || 0 },
    user
  );
};

const createSupportRequest = async (req, res) => {
  try {
    const { title, description, requiredSkills, category, latitude, longitude, locationName, preferredTimeSlot, urgencyLevel } = req.body;

    if (!title || !description || !category || !locationName) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tiêu đề, mô tả, danh mục và địa điểm.' });
    }

    const normalizedSkills = parseListInput(requiredSkills);
    const preferredSlot = preferredTimeSlot || 'flexible';
    const urgency = ['low', 'medium', 'high', 'critical'].includes(cleanText(urgencyLevel)) ? cleanText(urgencyLevel) : 'medium';

    const insertResult = await queryRun(
      `INSERT INTO SupportRequests (
        requesterUserId, title, description, requiredSkills, category,
        latitude, longitude, locationName, preferredTimeSlot, urgencyLevel, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        req.user.id,
        title.trim(),
        description.trim(),
        serializeList(normalizedSkills),
        category,
        toNumberOrNull(latitude),
        toNumberOrNull(longitude),
        locationName.trim(),
        preferredSlot,
        urgency,
      ]
    );

    const request = await getRequestById(insertResult.lastID);
    const candidates = await getVolunteerCandidates(req.user.id);
    const matches = candidates
      .map((candidate) => computeMatchForVolunteer(candidate, request))
      .sort((a, b) => b.matchScore - a.matchScore);

    const topMatches = matches.slice(0, 3);
    const bestMatch = topMatches[0] || null;

    if (bestMatch) {
      await queryRun(
        `UPDATE SupportRequests SET matchedVolunteerId = ?, topMatchScore = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [bestMatch.userId, bestMatch.matchScore, request.id]
      );
    }

    for (const match of topMatches) {
      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          match.userId,
          'AI ghép nối cơ hội hỗ trợ mới',
          `Yêu cầu "${request.title}" tại ${request.locationName} phù hợp với hồ sơ của bạn (MS ${match.matchScore}). Hãy vào mục AI Ghép Nối để xem chi tiết.`,
          'matching',
        ]
      );
    }

    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        'AI đã phân tích yêu cầu hỗ trợ',
        bestMatch
          ? `Yêu cầu "${request.title}" đã được AI ưu tiên ghép với ${bestMatch.fullName} (MS ${bestMatch.matchScore}).`
          : `Yêu cầu "${request.title}" đã được ghi nhận. Hiện chưa có hồ sơ phù hợp cao, hệ thống sẽ tiếp tục theo dõi.`,
        'info',
      ]
    );


    const updatedRequest = await getRequestById(request.id);

    res.status(201).json({
      message: 'Đã tạo yêu cầu hỗ trợ và kích hoạt AI ghép nối thành công.',
      request: updatedRequest,
      topMatches,
      formula: 'MS=(S×0.35)+(D×0.25)+(T×0.15)+(R×0.15)+(U×0.10)',
    });
  } catch (error) {
    console.error('createSupportRequest error:', error);
    res.status(500).json({ message: 'Không thể tạo yêu cầu hỗ trợ.' });
  }

}
const listSupportRequests = async (req, res) => {
  try {
    const scope = cleanText(req.query.scope || 'all');
    const rows = await queryAll(
      `SELECT sr.*, u.fullName AS requesterName, u.avatar AS requesterAvatar, mv.fullName AS matchedVolunteerName
       FROM SupportRequests sr
       JOIN Users u ON sr.requesterUserId = u.id
       LEFT JOIN Users mv ON sr.matchedVolunteerId = mv.id
       WHERE sr.status != 'closed'
       ORDER BY sr.createdAt DESC`
    );

    let requests = rows.map((row) => ({
      ...row,
      requiredSkills: parseListInput(row.requiredSkills),
      latitude: toNumberOrNull(row.latitude),
      longitude: toNumberOrNull(row.longitude),
      topMatchScore: row.topMatchScore !== null && row.topMatchScore !== undefined ? Number(row.topMatchScore) : null,
    }));

    if (scope === 'mine') {
      requests = requests.filter((item) => Number(item.requesterUserId) === Number(req.user.id));
    }

    res.status(200).json({ requests: sortRequestsByUrgency(requests) });
  } catch (error) {
    console.error('listSupportRequests error:', error);
    res.status(500).json({ message: 'Không thể tải danh sách nhu cầu hỗ trợ.' });
  }
};

const getSupportRequestMatches = async (req, res) => {
  try {
    const request = await getRequestById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ.' });

    const candidates = await getVolunteerCandidates(request.requesterUserId);
    const matches = candidates
      .map((candidate) => computeMatchForVolunteer(candidate, request))
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      request,
      matches,
      formula: 'MS=(S×0.35)+(D×0.25)+(T×0.15)+(R×0.15)+(U×0.10)',
    });
  } catch (error) {
    console.error('getSupportRequestMatches error:', error);
    res.status(500).json({ message: 'Không thể tính toán danh sách ghép nối.' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const profile = await getRequestProfileSnapshot(req.user.id);
    const rows = await queryAll(
      `SELECT sr.*, u.fullName AS requesterName, u.avatar AS requesterAvatar
       FROM SupportRequests sr
       JOIN Users u ON sr.requesterUserId = u.id
       WHERE sr.status = 'open' AND sr.requesterUserId != ?
       ORDER BY sr.createdAt DESC`,
      [req.user.id]
    );

    const recommendations = rows
      .map((row) => {
        const request = {
          ...row,
          requiredSkills: parseListInput(row.requiredSkills),
          latitude: toNumberOrNull(row.latitude),
          longitude: toNumberOrNull(row.longitude),
        };
        const match = computeMatchForVolunteer(profile, request);
        return {
          request,
          match,
        };
      })
      .sort((a, b) => b.match.matchScore - a.match.matchScore)
      .slice(0, 8);

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error('getRecommendations error:', error);
    res.status(500).json({ message: 'Không thể tải gợi ý AI dành cho bạn.' });
  }
};
const getEmergencyTeams = async (req, res) => {
  try {

    const candidates = await queryAll(`
      SELECT userId
      FROM UserCapabilityProfiles 
      WHERE availabilityStatus = 'available'
    `);

    const medicalTeam = [];
    const transportTeam = [];
    const logisticsTeam = [];
    const mediaTeam = [];

    for (const row of candidates) {

      const profile =
        await getRequestProfileSnapshot(row.userId);

      const skills = profile.skills || [];

      if (
        skills.some(skill =>
          cleanText(skill).includes('y te') ||
          cleanText(skill).includes('so cuu')
        )
      ) {
        medicalTeam.push(profile);
      }

      if (
        skills.some(skill =>
          cleanText(skill).includes('lai xe') ||
          cleanText(skill).includes('van chuyen')
        )
      ) {
        transportTeam.push(profile);
      }

      if (
        skills.some(skill =>
          cleanText(skill).includes('hau can') ||
          cleanText(skill).includes('dieu phoi')
        )
      ) {
        logisticsTeam.push(profile);
      }

      if (
        skills.some(skill =>
          cleanText(skill).includes('truyen thong')
        )
      ) {
        mediaTeam.push(profile);
      }
    }

    res.json([
      {
        name: '🚑 Đội Y tế',
        members: medicalTeam.length
      },
      {
        name: '🚚 Đội Vận chuyển',
        members: transportTeam.length
      },
      {
        name: '📦 Đội Hậu cần',
        members: logisticsTeam.length
      },
      {
        name: '📢 Đội Truyền thông',
        members: mediaTeam.length
      }
    ]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'AI Emergency Error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createSupportRequest,
  listSupportRequests,
  getSupportRequestMatches,
  getRecommendations,
  getEmergencyTeams,

};
