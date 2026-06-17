const fs = require('fs');
const path = require('path');
const { queryGet, queryRun } = require('../config/db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDefaultUser = async () => {
  let lastError;

  for (let attempt = 1; attempt <= 120; attempt += 1) {
    try {
      const admin = await queryGet(
        `SELECT id FROM Users WHERE role = 'admin' ORDER BY id LIMIT 1`
      );

      if (admin) return admin;

      const anyUser = await queryGet(
        `SELECT id FROM Users ORDER BY id LIMIT 1`
      );

      if (anyUser) return anyUser;
    } catch (error) {
      lastError = error;
    }

    console.log(`⏳ Đang chờ database seed user mặc định... (${attempt}/120)`);
    await sleep(500);
  }

  throw lastError || new Error('Database is not ready or no default user was seeded.');
};

const main = async () => {
  const owner = await waitForDefaultUser();

  const dataPath = path.join(__dirname, '..', 'data', 'community_posts_300.json');
  const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  let inserted = 0;
  let skipped = 0;

  for (const post of posts) {
    const existing = await queryGet(
      `SELECT id FROM Posts WHERE title = ? LIMIT 1`,
      [post.title]
    );

    if (existing) {
      skipped += 1;
      continue;
    }

    await queryRun(
      `INSERT INTO Posts
        (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', ?, 1, ?)`,
      [
        post.title,
        post.description,
        post.imageUrl,
        post.category,
        post.latitude,
        post.longitude,
        post.locationName,
        inserted < 18 ? 1 : 0,
        owner.id,
      ]
    );

    inserted += 1;
  }

  console.log(`✅ Import hoàn tất: thêm mới ${inserted} bài, bỏ qua ${skipped} bài đã tồn tại.`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Import community posts failed:', error);
    process.exit(1);
  });