-- KindnessMap (Bản Đồ Việc Tốt) - MySQL Sample Data (Seeds)

USE kindness_map;

-- Insert Badges
INSERT INTO Badges (id, name, description, icon) VALUES
(1, 'Environmental Guardian', 'Người gác đền môi trường, tích cực tham gia các hoạt động làm sạch và bảo vệ tự nhiên.', 'leaf'),
(2, 'Kindness Ambassador', 'Đại sứ việc tốt, truyền cảm hứng mạnh mẽ cho cộng đồng qua những hành động thiết thực.', 'heart'),
(3, 'Blood Donation Hero', 'Anh hùng hiến máu, mang lại cơ hội sống và hy vọng cho những bệnh nhân cần máu.', 'droplet'),
(4, 'Community Volunteer', 'Tình nguyện viên cống献, luôn có mặt trong các phong trào hỗ trợ hoàn cảnh khó khăn.', 'users'),
(5, 'Social Impact Maker', 'Người tạo tác động xã hội, có những đóng góp mang tính bền vững cho địa phương.', 'star');

-- Insert Users (Passwords are hashed 'password123' or dummy value for seed simulation, in Express we can handle login or override)
-- We will insert Admin, Users, Volunteers
INSERT INTO Users (id, fullName, email, password, avatar, points, level, role) VALUES
(1, 'Nguyễn Văn Quản Trị', 'admin@kindnessmap.vn', '$2b$10$X7W6S....(mock hashed password123)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 850, 'Community Hero', 'admin'),
(2, 'Trần Minh Tuấn', 'tuan.tran@student.vn', '$2b$10$X7W6S....', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 340, 'Community Inspiration', 'user'),
(3, 'Lê Hoàng Yến', 'hoangyen.volunteer@gmail.com', '$2b$10$X7W6S....', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 520, 'Community Hero', 'user'),
(4, 'Phạm Quốc Bảo', 'quocbao.dev@yahoo.com', '$2b$10$X7W6S....', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 190, 'Kindness Ambassador', 'user'),
(5, 'Hoàng Thị Mai', 'maihoang.resident@hotmail.com', '$2b$10$X7W6S....', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', 90, 'Active Citizen', 'user');

-- Insert User Badges
INSERT INTO UserBadges (userId, badgeId) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 4),
(3, 2), (3, 3), (3, 4), (3, 5),
(4, 1), (4, 2),
(5, 4);

-- Insert Posts (Approved, Pending, and Rejected)
INSERT INTO Posts (id, title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId) VALUES
(1, 'Nhóm bạn trẻ dọn sạch rác tại Hồ Tây cuối tuần', 'Sáng Chủ Nhật vừa qua, hơn 20 bạn sinh viên và người dân quanh khu vực Hồ Tây đã cùng nhau thu gom được 15 bao rác thải nhựa và chai lọ, trả lại cảnh quan xanh sạch cho bờ hồ.', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Environment', 21.0583, 105.8159, 'Hồ Tây, Hà Nội', 'Approved', TRUE, TRUE, 2),
(2, 'Trồng 50 cây xanh tại khuôn viên trường Đại học', 'Đoàn thanh niên phối hợp cùng Câu lạc bộ Môi trường đã thực hiện chiến dịch phủ xanh đất trống, trồng và bảo vệ 50 cây phượng và bằng lăng trong trường.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Tree Planting', 21.0382, 105.7826, 'Cầu Giấy, Hà Nội', 'Approved', TRUE, TRUE, 3),
(3, 'Ngày hội hiến máu Giọt Hồng Yêu Thương 2026', 'Chương trình hiến máu nhân đạo đã thu hút hơn 300 lượt đăng ký, đóng góp hàng trăm đơn vị máu quý giá vào ngân hàng máu quốc gia phục vụ cấp cứu.', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Blood Donation', 10.7769, 106.7009, 'Quận 1, TP. Hồ Chí Minh', 'Approved', TRUE, TRUE, 3),
(4, 'Tặng quà và thăm hỏi các cụ già neo đơn tại viện dưỡng lão', 'Cuối tuần qua, chúng mình đã mang những món quà nhỏ gồm sữa, bánh và khăn ấm đến thăm các cụ. Được lắng nghe những câu chuyện đời và thấy nụ cười của các cụ là điều tuyệt vời nhất.', 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80', 'Elderly Care', 10.7925, 106.6541, 'Quận Tân Bình, TP. Hồ Chí Minh', 'Approved', TRUE, TRUE, 4),
(5, 'Dạy học miễn phí cho trẻ em làng chài ven sông', 'Lớp học tình thương buổi tối được tổ chức đều đặn vào thứ 3 và thứ 5 hàng tuần giúp các em nhỏ có hoàn cảnh khó khăn duy trì con chữ.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', 'Education', 16.0544, 108.2022, 'Đà Nẵng', 'Approved', TRUE, TRUE, 2),
(6, 'Phát suất ăn đêm cho người vô gia cư ở ga Trần Quý Cáp', 'Nhóm tình nguyện Đêm Ấm đã trao tặng 80 suất xôi chả và sữa nóng cho cô chú công nhân vệ sinh và người vô gia cư trong đêm đông.', 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80', 'Volunteer', 21.0285, 105.8402, 'Đống Đa, Hà Nội', 'Approved', FALSE, TRUE, 5),
(7, 'Giải cứu nông sản và hỗ trợ bà con nông dân bị ảnh hưởng bão', 'Hỗ trợ thu hoạch và phân phối gần 2 tấn dưa hấu giúp bà con nông dân vượt qua giai đoạn thiên tai khó khăn.', 'https://images.unsplash.com/photo-1592417817098-8f3d6eb263d7?auto=format&fit=crop&w=800&q=80', 'Community', 10.0333, 105.7833, 'Cần Thơ', 'Pending', FALSE, FALSE, 4),
(8, 'Kiểm tra nội dung vi phạm hoặc spam (Post Demo Bị Từ Chối)', 'Bài viết này chứa thông tin chưa được xác thực hoặc hình ảnh không phù hợp với tiêu chí lan tỏa việc tốt của cộng đồng.', 'https://images.unsplash.com/photo-1588702545922-521e82355fb4?auto=format&fit=crop&w=800&q=80', 'Community', 21.0123, 105.8234, 'Hà Nội', 'Rejected', FALSE, FALSE, 5);

-- Insert Comments
INSERT INTO Comments (content, userId, postId) VALUES
('Hành động thật ý nghĩa, hy vọng sẽ có thêm nhiều hoạt động như thế này!', 3, 1),
('Cho mình hỏi lần tới nhóm có tổ chức ở khu vực Cầu Giấy không để mình tham gia với?', 4, 1),
('Tuyệt vời quá Yến ơi! Lần sau đi nhớ rủ tớ nhé.', 2, 3),
('Các cụ ở viện dưỡng lão dễ thương lắm, cảm ơn tấm lòng của các bạn.', 5, 4),
('Một nghĩa cử cao đẹp, xứng đáng là tấm gương sáng cho cộng đồng.', 1, 2);

-- Insert Likes
INSERT INTO Likes (userId, postId) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
(1, 2), (2, 2), (4, 2),
(1, 3), (2, 3), (4, 3), (5, 3),
(1, 4), (3, 4), (5, 4),
(1, 5), (3, 5);

-- Insert Notifications
INSERT INTO Notifications (userId, title, message, type) VALUES
(2, 'Bài viết được phê duyệt!', 'Bài viết "Nhóm bạn trẻ dọn sạch rác tại Hồ Tây" của bạn đã được quản trị viên duyệt và hiển thị trên Bản Đồ Việc Tốt. Bạn nhận được +10 điểm.', 'success'),
(3, 'Huy hiệu mới!', 'Chúc mừng bạn đã đạt huy hiệu "Blood Donation Hero" nhờ những đóng góp xuất sắc trong chiến dịch Giọt Hồng Yêu Thương.', 'award'),
(2, 'Cộng đồng vinh danh', 'Bạn hiện đang lọt vào Top 3 Bảng xếp hạng tuần này. Hãy tiếp tục phát huy nhé!', 'point');

-- Insert Community Awards
INSERT INTO CommunityAwards (title, month, description, recipientUserId, awardPoints) VALUES
('Hiệp Sĩ Môi Trường Của Tháng', 'Tháng 5, 2026', 'Trao tặng cho Trần Minh Tuấn với chuỗi 4 dự án làm sạch cảnh quan đô thị và truyền cảm hứng mạnh mẽ cho sinh viên Hà Nội.', 2, 200),
('Đại Sứ Trái Tim Vàng', 'Tháng 4, 2026', 'Trao tặng cho Lê Hoàng Yến vì những nỗ lực không mệt mỏi trong các chiến dịch vận động hiến máu và hỗ trợ bệnh nhân.', 3, 200);
