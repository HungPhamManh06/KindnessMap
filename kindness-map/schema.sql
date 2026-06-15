-- KindnessMap (Bản Đồ Việc Tốt) - MySQL Database Schema
-- Run this script to create the database and tables in MySQL.

CREATE DATABASE IF NOT EXISTS kindness_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kindness_map;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    points INT DEFAULT 0,
    level VARCHAR(100) DEFAULT 'Active Citizen', -- Active Citizen, Kindness Ambassador, Community Inspiration, Community Hero
    role ENUM('guest', 'user', 'admin') DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Badges Table
CREATE TABLE IF NOT EXISTS Badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL -- Identifier or URL for the SVG/icon
) ENGINE=InnoDB;

-- 3. UserBadges Table
CREATE TABLE IF NOT EXISTS UserBadges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    badgeId INT NOT NULL,
    awardedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (badgeId) REFERENCES Badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (userId, badgeId)
) ENGINE=InnoDB;

-- 4. Posts Table (Kindness Posts)
CREATE TABLE IF NOT EXISTS Posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    imageUrl VARCHAR(1000) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Environment, Elderly Care, Tree Planting, Blood Donation, Volunteer, Community, Education
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    locationName VARCHAR(300) DEFAULT 'Hà Nội, Việt Nam',
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    isFeatured BOOLEAN DEFAULT FALSE,
    pointsAwarded BOOLEAN DEFAULT FALSE, -- TRUE nếu bài này đã từng cộng điểm cho tác giả, tránh cộng điểm trùng khi duyệt lại
    userId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Comments Table
CREATE TABLE IF NOT EXISTS Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    postId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Likes Table
CREATE TABLE IF NOT EXISTS Likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    postId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_like (userId, postId)
) ENGINE=InnoDB;

-- 7. Notifications Table (Extra feature)
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- success, warning, award, point
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. CommunityAwards Table (Extra feature)
CREATE TABLE IF NOT EXISTS CommunityAwards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    month VARCHAR(50) NOT NULL, -- e.g. "Tháng 6, 2026"
    description TEXT NOT NULL,
    recipientUserId INT NOT NULL,
    awardPoints INT DEFAULT 100,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipientUserId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
