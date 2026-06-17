const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('kindness_map.db');

db.get("SELECT COUNT(*) AS total FROM Posts WHERE status='Approved'", (err, row) => {
  if (err) {
    console.error(err);
  } else {
    console.log(row);
  }

  db.close();
});