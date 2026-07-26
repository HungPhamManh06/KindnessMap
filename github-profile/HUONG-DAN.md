# 🎨 Phân tích & Hướng dẫn làm GitHub Profile giống video TikTok của @yvivas_

> Video: https://www.tiktok.com/@yvivas_/video/7455049277023243526
> Profile thật trong video: **https://github.com/YhonV** (Yhon Vivas)
> Mình đã truy được chính xác source README của anh ấy tại thời điểm quay video (commit `03c1e5a`, ngày 01/01/2025).

---

## 1️⃣ Nguyên lý hoạt động: "Profile README"

GitHub có một tính năng đặc biệt: nếu bạn tạo một **repository trùng tên với username** của bạn, thì file `README.md` trong repo đó sẽ **hiển thị ngay đầu trang profile** của bạn.

Với bạn:
- Tạo repo mới tên: **`HungPhamManh06`** (trùng username)
- Repo phải để **Public**
- Tick chọn **"Add a README file"** khi tạo
- GitHub sẽ hiện thông báo: *"You found a secret! HungPhamManh06/HungPhamManh06 is a special repository..."*

Toàn bộ "phép màu" trong video chỉ là **Markdown + HTML + ảnh động (GIF/SVG) + các API tạo ảnh tự động**.

---

## 2️⃣ Giải phẫu từng thành phần trong video

### 🔤 (a) Dòng chữ đánh máy động (Typing Animation)
Dòng chữ "Heyyy! I'm Yhon Vivas / Welcome to my profile!" tự gõ ra rồi xoá — dùng dịch vụ **readme-typing-svg**:

```html
<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Architects+Daughter&color=%2338C2FF&size=50&center=true&vCenter=true&height=60&width=600&lines=Heyyy!+I'm+Yhon+Vivas;Welcome+to+my+profile!" />
</div>
```
- `font=` → tên font Google Fonts (video dùng `Architects+Daughter`)
- `color=%2338C2FF` → màu chữ (mã hex, `%23` = dấu `#`)
- `lines=` → các dòng chữ, ngăn cách bằng `;`
- Tùy chỉnh trực quan tại: https://readme-typing-svg.demolab.com/demo/

### 🐦 (b) GIF trang trí (chim bay, tay vẫy 👋)
Chỉ là thẻ `<img>` trỏ tới file GIF/WebP bất kỳ trên mạng:
```html
<div align="center">
    <img src="https://raw.githubusercontent.com/ashu-guo/ashu-guo/master/assets/fly.webp" height="120px" />
</div>

## <img src="https://raw.githubusercontent.com/ashu-guo/ashu-guo/main/assets/wave.gif" width="50px" height="50px"> About Me
```
💡 Mẹo: GIF đặt cạnh tiêu đề `##` sẽ tạo hiệu ứng icon động cho từng section. Nguồn GIF: Giphy, hoặc "mượn" từ các profile khác trên GitHub.

### 📋 (c) Bố cục 2 cột "About Me" (chữ bên trái, ảnh bên phải)
Markdown không hỗ trợ cột → dùng **bảng HTML** `<table>`:
```html
<table align="center">
<tr border="none">
<td width="50%" align="left">

- 🔭 I'm currently working as a `Software` Developer.
- 🌱 I'm currently learning `Swift`...
- 📍 From Colombia, living in Santiago, Chile 🇨🇱.

</td>
<td width="50%" align="center">
  <img width="450" src="...ảnh-hoặc-gif-coding..." />
</td>
</tr>
</table>
```
⚠️ Lưu ý: phải có **dòng trống** giữa thẻ `<td>` và nội dung Markdown thì GitHub mới render Markdown bên trong HTML.

### 🛠 (d) Icon ngôn ngữ / công nghệ (Languages & Tools)
Mỗi icon là 1 ảnh SVG 40x40 từ bộ **Devicon**, bọc trong link:
```html
<a href="https://www.typescriptlang.org/" target="_blank">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" width="40" height="40"/>
</a>
```
- Kho icon đầy đủ: https://devicon.dev (hàng trăm ngôn ngữ/framework)
- Cách khác gọn hơn: https://skillicons.dev → `https://skillicons.dev/icons?i=js,html,css,react,nodejs`

### 📊 (e) Thẻ thống kê GitHub (Stats Cards)
3 thẻ trong video đều là ảnh SVG sinh tự động theo username:

| Thẻ | Dịch vụ | URL mẫu |
|---|---|---|
| GitHub Stats (sao, commit...) | github-readme-stats | `https://github-readme-stats.vercel.app/api?username=USERNAME&theme=chartreuse-dark&show_icons=true&count_private=true` |
| Streak (chuỗi ngày commit 🔥) | github-readme-streak-stats | `https://github-readme-streak-stats.herokuapp.com/?user=USERNAME&theme=chartreuse-dark` |
| Top Languages | github-readme-stats | `https://github-readme-stats.vercel.app/api/top-langs/?username=USERNAME&theme=chartreuse-dark&langs_count=10` |

- Video dùng theme **`chartreuse-dark`** (nền đen, chữ xanh lá neon)
- Danh sách toàn bộ theme: https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md
- Các theme đẹp khác: `tokyonight`, `radical`, `dracula`, `material-palenight`, `onedark`
- Xếp 2 cột bằng `<table>` giống phần About Me.

### 🐍 (f) Con rắn ăn ô contribution (Snake Animation)
Đây là phần "wow" nhất video — con rắn chạy ăn các ô xanh contribution. Nó **không phải dịch vụ online** mà là **GitHub Action** tự chạy mỗi ngày để sinh file SVG:

1. Trong repo profile, tạo file `.github/workflows/snake.yml` (mình đã viết sẵn trong thư mục này)
2. Action `Platane/snk` sẽ vẽ SVG từ contribution graph của bạn và đẩy vào branch `output`
3. Trong README nhúng:
```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/HungPhamManh06/HungPhamManh06/output/github-contribution-grid-snake-dark.svg">
    <img src="https://raw.githubusercontent.com/HungPhamManh06/HungPhamManh06/output/github-contribution-grid-snake.svg">
  </picture>
</p>
```
4. Sau khi push, vào tab **Actions** → chọn workflow **generate snake** → bấm **Run workflow** để chạy lần đầu.
5. ⚠️ Nếu Actions hỏi quyền: vào **Settings → Actions → General → Workflow permissions** → chọn **Read and write permissions**.

---

## 3️⃣ Các bước thực hiện cho bạn (checklist)

- [ ] **Bước 1:** Tạo repo public tên `HungPhamManh06` (trùng username), tick "Add a README"
- [ ] **Bước 2:** Copy nội dung file `README.md` trong thư mục này vào repo đó (đã điền sẵn username của bạn + stack JavaScript/CSS/HTML từ KindnessMap)
- [ ] **Bước 3:** Copy file `snake.yml` vào `.github/workflows/snake.yml` trong repo đó
- [ ] **Bước 4:** Vào Settings → Actions → General → bật **Read and write permissions**
- [ ] **Bước 5:** Vào tab Actions → chạy thủ công workflow "generate snake" lần đầu
- [ ] **Bước 6:** Sửa lại nội dung About Me, thêm/bớt icon công nghệ theo ý bạn
- [ ] **Bước 7 (tuỳ chọn):** Đổi theme stats card, đổi font/màu typing animation

---

## 4️⃣ Tài nguyên hữu ích

| Công cụ | Link | Dùng để |
|---|---|---|
| Typing SVG | https://readme-typing-svg.demolab.com | Chữ đánh máy động |
| Devicon | https://devicon.dev | Icon ngôn ngữ/framework |
| Skill Icons | https://skillicons.dev | Icon skill kiểu gọn |
| GitHub Readme Stats | https://github.com/anuraghazra/github-readme-stats | Thẻ thống kê |
| Streak Stats | https://streak-stats.demolab.com | Thẻ chuỗi ngày commit |
| Snake (snk) | https://github.com/Platane/snk | Rắn ăn contribution |
| Shields.io | https://shields.io | Badge (huy hiệu) |
| Profile Trophy | https://github.com/ryo-ma/github-profile-trophy | Kệ cúp thành tích |
| Tổng hợp ý tưởng | https://github.com/abhisheknaiidu/awesome-github-profile-readme | Kho profile đẹp để tham khảo |

---

## 5️⃣ Lưu ý nhỏ

- Stats card chỉ đẹp khi bạn **commit đều** — profile trang trí đẹp + contribution graph xanh mới là combo hoàn chỉnh 😄
- `github-readme-streak-stats.herokuapp.com` đôi khi quá tải → có thể tự deploy bản riêng lên Vercel (hướng dẫn trong repo của họ) hoặc dùng `streak-stats.demolab.com`.
- Ảnh GIF bên ngoài (Giphy...) có thể chết link theo thời gian → nên tải về và bỏ vào thư mục `assets/` trong chính repo profile rồi trỏ link raw tới đó (như Yhon Vivas làm với con rắn).
