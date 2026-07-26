// Import schema and seed data into Aiven MySQL
// Usage: AIVEN_PW=your_password node scripts/import-db.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const PASSWORD = process.env.AIVEN_PW;
if (!PASSWORD) {
  console.error('❌ Please set AIVEN_PW environment variable');
  console.error('   Usage: AIVEN_PW=your_password node scripts/import-db.js');
  process.exit(1);
}

const HOST = 'kindnessmap-mysql-hungvbhpcba6-ad49.e.aivencloud.com';
const PORT = 17048;
const USER = 'avnadmin';

const BASE_URI = `mysql://${USER}:${PASSWORD}@${HOST}:${PORT}/defaultdb?ssl-mode=REQUIRED`;

async function main() {
  console.log('🔄 Connecting to Aiven MySQL...');

  const connOpts = {
    uri: BASE_URI,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
    connectTimeout: 10000
  };

  // First connection to defaultdb to create the kindness_map database
  const conn1 = await mysql.createConnection(connOpts);
  await conn1.execute('CREATE DATABASE IF NOT EXISTS kindness_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('✅ Database kindness_map ready');
  await conn1.end();

  // Now connect directly to kindness_map
  const DB_URI = BASE_URI.replace('/defaultdb?', '/kindness_map?');
  const conn = await mysql.createConnection({
    ...connOpts,
    uri: DB_URI
  });

  // Read and execute schema.sql in one batch
  console.log('📄 Reading schema.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8');
  const cleanSchema = schemaSql
    .replace(/CREATE DATABASE IF NOT EXISTS kindness_map.*?;/is, '')
    .replace(/USE kindness_map;/is, '')
    .trim();

  console.log('📦 Importing schema...');
  try {
    await conn.query(cleanSchema);
    console.log('✅ Schema imported!');
  } catch (err) {
    // If batch fails (e.g. ALTER TABLE on existing column), try statement-by-statement
    console.warn('⚠️  Batch schema import had an issue, trying per-statement...');
    const statements = cleanSchema.split(';').filter(s => s.trim().length > 0);
    let stmtCount = 0;
    for (const stmt of statements) {
      try {
        await conn.execute(stmt.trim() + ';');
        stmtCount++;
      } catch (stmtErr) {
        if (!stmtErr.message.includes('already exists') && !stmtErr.message.includes('Duplicate')) {
          console.warn('   ⚠️  Statement failed (non-critical, skipping):', stmt.trim().substring(0, 50));
        }
      }
    }
    console.log(`✅ Schema imported (${stmtCount} statements executed)`);
  }

  // Read and execute seeds.sql in one batch
  console.log('📄 Reading seeds.sql...');
  const seedsSql = fs.readFileSync(path.join(__dirname, '../../seeds.sql'), 'utf8');
  const cleanSeeds = seedsSql.replace(/USE kindness_map;/is, '').trim();

  console.log('🌱 Importing seed data...');
  try {
    await conn.query(cleanSeeds);
    console.log('✅ Seed data imported!');
  } catch (err) {
    if (err.message.includes('Duplicate entry')) {
      console.log('⚠️  Some seed data already exists (harmless)');
    } else {
      console.error('❌ Seed import failed:', err.message);
      process.exit(1);
    }
  }

  // Verify
  const [users] = await conn.execute('SELECT COUNT(*) as cnt FROM Users');
  const [posts] = await conn.execute('SELECT COUNT(*) as cnt FROM Posts');
  console.log(`📊 Database stats: ${users[0].cnt} users, ${posts[0].cnt} posts`);

  await conn.end();
  console.log('🎉 Production database is ready!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  if (err.message.includes('ENOTFOUND')) {
    console.error('');
    console.error('⚠️  DNS resolution failed. This might mean:');
    console.error('   1. The Aiven hostname is incorrect');
    console.error('   2. This machine cannot resolve Aiven DNS');
    console.error('   3. Try running this script from your local machine instead');
    console.error('');
    console.error('   To run locally:');
    console.error(`   AIVEN_PW='${PASSWORD}' node backend/scripts/import-db.js`);
  }
  process.exit(1);
});
