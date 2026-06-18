# 💚 KindnessMap – Bản Đồ Việc Tốt (Full-stack Community Platform)

![Tech Stack](https://img.shields.io/badge/Tech%20Stack-React%20%7C%20Tailwind%20CSS%20%7C%20Node.js%20%7C%20Express%20%7C%20MySQL%20%2F%20SQLite-10B981?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Complete%20Production%20Ready-success?style=for-the-badge)

**KindnessMap** là một nền tảng mạng xã hội và cộng đồng khuyến khích mọi người cùng chia sẻ, ghim và khám phá những việc làm tử tế, từ thiện, bảo vệ môi trường diễn ra xung quanh họ. Mục tiêu cao cả của nền tảng là giúp giảm thiểu sự vô cảm trong xã hội, kết nối trái tim và xây dựng những cộng đồng nhân ái, bền vững.

---

## 🎯 Đối Tượng Người Dùng Mục Tiêu (Target Users)
- **👨‍🎓 Học sinh / Sinh viên**: Năng nổ, muốn đóng góp sức trẻ và tham gia các hoạt động xã hội.
- **💚 Tình nguyện viên (Volunteers)**: Cống hiến thời gian và tâm huyết cho các chiến dịch y tế, giáo dục, từ thiện.
- **🏡 Cư dân địa phương (Local Residents)**: Cùng nhau giữ gìn khu phố xanh, sạch và quan tâm đến láng giềng.
- **🏢 Tổ chức / CLB Cộng đồng**: Kêu gọi, tổ chức và quản lý các phong trào quy mô lớn.

---

## 🔑 Phân Quyền Vai Trò (User Roles)

### 1. Khách (Guest)
- Xem danh sách và luồng (feed) các câu chuyện việc tốt công khai.
- Khám phá Bản đồ tương tác trực tuyến.
- Xem Bảng xếp hạng vinh danh (Leaderboard) toàn quốc.
- Đăng ký / Đăng nhập tài khoản.

### 2. Thành Viên Đăng Ký (Registered User)
- Tạo và quản lý hồ sơ cá nhân, ảnh đại diện, danh hiệu cấp độ.
- Gửi (submit) bài viết việc tốt kèm hình ảnh và tọa độ ghim trên Bản đồ.
- Tích lũy **Điểm Công Dân Số** qua mỗi đóng góp tích cực.
- Thích (Like) và Bình luận (Comment) tương tác theo thời gian thực.
- Xem Bộ sưu tập Huy hiệu Thành tựu và theo dõi tiến trình thăng hạng.

### 3. Quản Trị Viên (Admin)
- Phê duyệt (Approve) hoặc Từ chối (Reject) các bài viết do người dùng gửi lên.
- Quản lý danh sách người dùng, cấp hoặc hạ quyền Admin.
- Quản lý quỹ Điểm thưởng và hệ thống danh hiệu.
- Xem Bảng phân tích dữ liệu tổng quan (Platform Analytics) với biểu đồ trực quan.
- Tự động cảnh báo và gỡ bỏ các nội dung vi phạm tiêu chuẩn cộng đồng.

---

## 🌟 Các Tính Năng Nổi Bật (Core Features)

1. **Hệ Thống Xác Thực & Phân Quyền (JWT Authentication)**: Đăng ký, Đăng nhập, Đăng xuất, Đặt lại mật khẩu. Trình chuyển đổi Demo nhanh (Quick Demo Switcher) cho phép người đánh giá chuyển tài khoản chỉ với 1 cú nhấp chuột.
2. **Hệ Thống Đăng & Ghim Việc Tốt (Post System)**: Nhập tiêu đề, nội dung, phân loại danh mục (*Môi trường, Người cao tuổi, Trồng cây, Hiến máu, Giáo dục, Tình nguyện, Cộng đồng*), đính kèm hình ảnh và tọa độ chính xác.
3. **Bản Đồ Tương Tác Trực Tuyến (Interactive OpenStreetMap & Leaflet Map)**: Hiển thị marker sinh động theo từng danh mục. Bấm vào marker để xem dạng popup thẻ thông tin và đi đến chi tiết. Hỗ trợ tìm kiếm theo từ khóa/khu vực và lọc theo mục.
4. **Hệ Thống Tích Điểm Công Dân Số (Digital Citizen Points)**: Tự động cộng điểm khi bài được duyệt:
   - *Nhặt rác / Môi trường*: +10 điểm
   - *Giúp đỡ người cao tuổi*: +20 điểm
   - *Trồng cây xanh*: +30 điểm
   - *Hiến máu nhân đạo*: +50 điểm
   - *Các hoạt động cộng đồng khác*: +25 điểm
5. **Danh Hiệu Thăng Hạng (Level Tiers)**:
   - **0 - 100 Điểm**: Active Citizen (Công Dân Tích Cực)
   - **101 - 300 Điểm**: Kindness Ambassador (Đại Sứ Việc Tốt)
   - **301 - 500 Điểm**: Community Inspiration (Nguồn Cảm Hứng)
   - **500+ Điểm**: Community Hero (Anh Hùng Cộng Đồng)
6. **Bảng Vàng Vinh Danh (Leaderboard)**: Top những người dẫn đầu, hỗ trợ xem theo Tuần, Tháng 6/2026 và Tất cả thời gian. Bục vinh danh (Podium) lộng lẫy cho Top 3.
7. **Cơ Chế Kiểm Duyệt AI (AI Content Moderation)**: Tự động phân tích và cảnh báo ngay khi người dùng nhập từ khóa thô tục, bạo lực hoặc lừa đảo.
8. **Chế Độ Bản Đồ Mật Độ (Heatmap Hotspots Mode)**: Trực quan hóa các khu vực đô thị tập trung nhiều việc tốt nhất (*Hồ Tây, Cầu Giấy, Quận 1, Tân Bình, Đà Nẵng, Cần Thơ*).
9. **Giải Thưởng Cộng Đồng Hàng Tháng (Monthly Awards Showcase)**: Vinh danh đặc biệt dành cho các Hiệp sĩ của tháng.
10. **Thông Báo Tương Tác (Real-time Live Stream Alerts)**: Hỗ trợ luồng SSE mô phỏng các việc tốt mới liên tục xuất hiện theo thời gian thực và thông báo thăng hạng/huy hiệu.

---

## 🛠 Tech Stack Sử Dụng
- **Frontend**: React 18, Vite, Tailwind CSS 3, Lucide React (Bespoke Icons), React-Leaflet 4 & OpenStreetMap.
- **Backend**: Node.js, Express.js, JWT, Bcrypt.
- **Database**:
  - Tệp `schema.sql` và `seeds.sql` hoàn chỉnh sẵn sàng cho **MySQL**.
  - Backend tích hợp module tự động khởi tạo và mô phỏng hoàn hảo qua **SQLite** (Zero-config DB) để chạy ngay lập tức trên mọi máy tính mà không cần cài đặt MySQL Server!

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng Tức Thì (Quick Start)

Dự án đã được cấu hình dưới dạng **Monorepo** với `concurrently` giúp bạn khởi chạy cả Backend (cổng `5000`) và Frontend (cổng `3000`) cùng một lúc chỉ bằng 1 lệnh duy nhất.

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Từ thư mục gốc `kindness-map`, chạy lệnh:
```bash
npm install
```

### 2. Khởi chạy Ứng Dụng (Dev Mode)
Chạy lệnh:
```bash
npm run dev
```

- **Frontend React Web App**: Truy cập tại [http://localhost:3000](http://localhost:3000)
- **Backend Express API Health Check**: Truy cập tại [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Các Tài Khoản Mẫu Để Thử Nghiệm (Demo Accounts)

Bạn có thể sử dụng nút **"Thử Vai Trò Demo"** trên thanh Nav để đăng nhập ngay lập tức, hoặc nhập thủ công thông tin sau:

### 1. Tài Khoản Quản Trị Viên (Admin)
- **Email**: `admin@kindnessmap.vn`
- **Mật khẩu**: `password123`
- *Quyền hạn*: Duyệt/Từ chối bài viết, thay đổi quyền người dùng, xem thống kê Analytics, trao tặng giải thưởng.

### 2. Tài Khoản Sinh Viên / Tình Nguyện Viên Năng Nổ
- **Email**: `hoangyen.volunteer@gmail.com` (520 điểm - *Community Hero*)
- **Email**: `tuan.tran@student.vn` (340 điểm - *Community Inspiration*)
- **Mật khẩu**: `password123`
- *Quyền hạn*: Ghim bài viết, xem huy hiệu, bình luận và thả tim các câu chuyện.

---

### 🌟 Kính chúc quý cộng đồng những trải nghiệm tuyệt vời cùng KindnessMap VN!
