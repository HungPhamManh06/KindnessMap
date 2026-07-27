# Community seed posts

This folder contains demo seed data for KindnessMap generated from public article metadata/excerpts and thumbnail URLs from:

- Dân trí – Tấm lòng nhân ái
- Báo Chính phủ – Đời sống
- Hội Chữ thập đỏ Việt Nam

Files:

- `community_posts_300.json`: 300 normalized posts for review/use in the app.
- `community_posts_300.sql`: SQL seed file that inserts the same posts into `Posts` and skips duplicate titles.

Important notes:

- The dataset uses short summaries/excerpts and source attribution only; it does not copy full article bodies.
- Images are stored as source image URLs, not downloaded into this repository.
- For production/public redistribution, verify each source site's content and image usage terms.
- Coordinates are inferred from locations mentioned in titles/excerpts. If no location is found, a deterministic fallback coordinate inside Vietnam is used.

Import command:

```bash
cd backend
npm run import:community
```
