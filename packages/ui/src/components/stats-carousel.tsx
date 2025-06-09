'use client';

import { useState } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

export interface StatItem {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
  iconColor: string;
}

interface StatsCarouselProps {
  stats: StatItem[];
  className?: string;
}

export const StatsCarousel = ({ stats, className = "" }: StatsCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < stats.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getVisibleStats = () => {
    // Responsive: 1 on mobile, 2 on tablet, 3 on desktop, 4 on large screens
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    let cardsPerView = 4;
    if (screenWidth < 640) cardsPerView = 1;
    else if (screenWidth < 768) cardsPerView = 2;
    else if (screenWidth < 1024) cardsPerView = 3;
    
    return stats.slice(currentSlide, currentSlide + cardsPerView);
  };

  const maxSlide = Math.max(0, stats.length - getVisibleStats().length);

  return (
    <div className={`relative mb-8 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getVisibleStats().map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.title}
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center shadow-lg`}>
                    <IconComponent className={`h-7 w-7 ${stat.iconColor}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 leading-none">
                      {stat.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{stat.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{stat.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 rounded-3xl pointer-events-none"></div>
              </div>
            </div>
          );
        })}
      </div>

      {maxSlide > 0 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: maxSlide + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentSlide === index 
                    ? 'w-8 bg-blue-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide >= maxSlide}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}; 