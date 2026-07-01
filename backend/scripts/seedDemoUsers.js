/**
 * Seed 150 realistic demo user accounts so the community feels alive.
 * Points are randomized between 50 and 600 (inclusive), per user request.
 *
 * Usage:
 *   node scripts/seedDemoUsers.js
 *
 * Safe to re-run: it skips emails that already exist in the Users table.
 */
const bcrypt = require('bcryptjs');
const { queryAll, queryGet, queryRun } = require('../config/db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDatabase = async () => {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await queryGet('SELECT id FROM Users LIMIT 1');
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  throw lastError || new Error('Database is not ready');
};

const FIRST_NAMES = [
  'Nguyễn Văn', 'Nguyễn Thị', 'Trần Văn', 'Trần Thị', 'Lê Văn', 'Lê Thị',
  'Phạm Văn', 'Phạm Thị', 'Hoàng Văn', 'Hoàng Thị', 'Huỳnh Văn', 'Huỳnh Thị',
  'Phan Văn', 'Phan Thị', 'Vũ Văn', 'Vũ Thị', 'Võ Văn', 'Võ Thị',
  'Đặng Văn', 'Đặng Thị', 'Bùi Văn', 'Bùi Thị', 'Đỗ Văn', 'Đỗ Thị',
  'Ngô Văn', 'Ngô Thị', 'Dương Văn', 'Dương Thị', 'Lý Văn', 'Lý Thị',
  'Đinh Văn', 'Đinh Thị', 'Trịnh Văn', 'Trịnh Thị',
];

const MIDDLE_NAMES = [
  'An', 'Bảo', 'Châu', 'Dũng', 'Duy', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiền',
  'Hiếu', 'Hoa', 'Hoàng', 'Huy', 'Huyền', 'Khánh', 'Khoa', 'Lan', 'Linh',
  'Long', 'Mai', 'Minh', 'My', 'Nam', 'Ngọc', 'Nhi', 'Như', 'Oanh', 'Phong',
  'Phương', 'Quân', 'Quang', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Thắng', 'Thành',
  'Thu', 'Thúy', 'Thủy', 'Tiến', 'Trang', 'Trâm', 'Trung', 'Tuấn', 'Tuyết',
  'Uyên', 'Việt', 'Vy', 'Yến',
];

const LOCATIONS = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Huế',
  'Nha Trang', 'Vũng Tàu', 'Bắc Ninh', 'Hạ Long', 'Đà Lạt', 'Quy Nhơn',
  'Vinh', 'Biên Hòa', 'Thái Nguyên', 'Nam Định', 'Buôn Ma Thuột', 'Rạch Giá',
];

const levelForPoints = (points) => {
  if (points >= 500) return 'Community Hero';
  if (points >= 300) return 'Community Inspiration';
  if (points >= 100) return 'Kindness Ambassador';
  return 'Active Citizen';
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];

const removeDiacritics = (str) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const AVATAR_SEEDS = Array.from({ length: 150 }, (_, i) => i + 1);

const buildAvatarUrl = (seed, gender) => {
  // DiceBear "avataaars" gives friendly, varied, royalty-free demo avatars.
  const style = gender === 'female' ? 'avataaars' : 'avataaars';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=demo-user-${seed}`;
};

const TOTAL_ACCOUNTS = 150;
const MIN_POINTS = 50;
const MAX_POINTS = 600;

const main = async () => {
  await waitForDatabase();

  const hashedPw = await bcrypt.hash('password123', 10);

  const existingEmails = new Set(
    (await queryAll('SELECT email FROM Users')).map((u) => u.email.toLowerCase())
  );

  let created = 0;
  let skipped = 0;
  const usedEmails = new Set();

  for (let i = 1; i <= TOTAL_ACCOUNTS; i += 1) {
    const last = pick(FIRST_NAMES);
    const gender = last.endsWith('Thị') ? 'female' : 'male';
    const middle = pick(MIDDLE_NAMES);
    const fullName = `${last} ${middle}`;

    const emailBase = removeDiacritics(`${middle}.${last.split(' ').pop()}${i}`)
      .toLowerCase()
      .replace(/\s+/g, '');
    let email = `${emailBase}@kindnessmap.vn`;
    let suffix = 1;
    while (existingEmails.has(email) || usedEmails.has(email)) {
      email = `${emailBase}${suffix}@kindnessmap.vn`;
      suffix += 1;
    }
    usedEmails.add(email);

    const points = randomInt(MIN_POINTS, MAX_POINTS);
    const level = levelForPoints(points);
    const avatar = buildAvatarUrl(AVATAR_SEEDS[i - 1], gender);
    const locationName = pick(LOCATIONS);

    try {
      await queryRun(
        `INSERT INTO Users (fullName, email, password, avatar, points, level, role, locationName)
         VALUES (?, ?, ?, ?, ?, ?, 'user', ?)`,
        [fullName, email, hashedPw, avatar, points, level, locationName]
      );
      created += 1;
    } catch (error) {
      // Column locationName might not exist on some legacy schemas; retry without it.
      try {
        await queryRun(
          `INSERT INTO Users (fullName, email, password, avatar, points, level, role)
           VALUES (?, ?, ?, ?, ?, ?, 'user')`,
          [fullName, email, hashedPw, avatar, points, level]
        );
        created += 1;
      } catch (innerError) {
        console.error(`⚠️ Bỏ qua tài khoản ${email}:`, innerError.message);
        skipped += 1;
      }
    }
  }

  console.log(`🎉 Hoàn tất: đã tạo ${created} tài khoản demo mới, bỏ qua ${skipped}.`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed demo users failed:', error);
    process.exit(1);
  });
