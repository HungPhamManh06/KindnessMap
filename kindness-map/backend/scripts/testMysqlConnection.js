const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const safeDecode = (value = '') => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Please add it to backend/.env');
  }

  const parsed = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: safeDecode(parsed.username),
    password: safeDecode(parsed.password),
    database: parsed.pathname.replace(/^\//, '') || undefined,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 15000,
  });

  const [rows] = await connection.query('SELECT 1 AS ok');
  console.log('✅ MySQL connected successfully:', rows[0]);
  await connection.end();
};

main().catch((error) => {
  console.error('❌ MySQL connection failed');
  console.error({
    name: error.name,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    message: error.message,
  });
  process.exit(1);
});
