import React from 'react';
import { Leaf, Heart, Droplet, Users, Star, Award, Shield, Smile } from 'lucide-react';

export const BadgeIcon = ({ name, className = "w-6 h-6", iconType }) => {
  const getBadgeVisuals = () => {
    switch (name || iconType) {
      case 'Environmental Guardian':
      case 'leaf':
        return {
          icon: <Leaf className={className} />,
          bg: 'bg-emerald-100 text-emerald-600 border-emerald-300',
          title: 'Hiệp Sĩ Môi Trường',
        };
      case 'Kindness Ambassador':
      case 'heart':
        return {
          icon: <Heart className={className} />,
          bg: 'bg-rose-100 text-rose-600 border-rose-300',
          title: 'Đại Sứ Việc Tốt',
        };
      case 'Blood Donation Hero':
      case 'droplet':
        return {
          icon: <Droplet className={className} />,
          bg: 'bg-red-100 text-red-600 border-red-300',
          title: 'Anh Hùng Hiến Máu',
        };
      case 'Community Volunteer':
      case 'users':
        return {
          icon: <Users className={className} />,
          bg: 'bg-blue-100 text-blue-600 border-blue-300',
          title: 'Tình Nguyện Viên',
        };
      case 'Social Impact Maker':
      case 'star':
        return {
          icon: <Star className={className} />,
          bg: 'bg-amber-100 text-amber-600 border-amber-300',
          title: 'Người Tạo Tác Động',
        };
      default:
        return {
          icon: <Award className={className} />,
          bg: 'bg-indigo-100 text-indigo-600 border-indigo-300',
          title: 'Công Dân Tích Cực',
        };
    }
  };

  const visuals = getBadgeVisuals();

  return (
    <div className={`inline-flex items-center justify-center p-3 rounded-2xl border shadow-sm ${visuals.bg} transition-all hover:scale-105 duration-200`} title={visuals.title}>
      {visuals.icon}
    </div>
  );
};
