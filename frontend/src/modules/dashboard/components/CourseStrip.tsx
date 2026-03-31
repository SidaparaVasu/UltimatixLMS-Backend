import React, { useRef } from 'react';
import { CourseCard } from './CourseCard';
import { Code, Users, Shield, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

export const CourseStrip: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const courses = [
    {
      title: "Advanced Data Analytics with Python",
      category: "Data Science",
      progress: 67,
      thumbClass: "thumb-1",
      accentColor: "var(--color-info)",
      icon: Code
    },
    {
      title: "People Management & Team Dynamics",
      category: "Leadership",
      progress: 35,
      thumbClass: "thumb-2",
      accentColor: "var(--color-success)",
      icon: Users
    },
    {
      title: "Information Security Awareness 2026",
      category: "Compliance",
      progress: 88,
      thumbClass: "thumb-3",
      accentColor: "var(--color-danger)",
      icon: Shield
    },
    {
      title: "AWS Solutions Architect Fundamentals",
      category: "Cloud",
      progress: 12,
      thumbClass: "thumb-4",
      accentColor: "#7C3AED",
      icon: Globe
    },
    {
      title: "React Performance Optimization",
      category: "Development",
      progress: 45,
      thumbClass: "thumb-1",
      accentColor: "var(--color-info)",
      icon: Code
    },
    {
      title: "Strategic Decision Making",
      category: "Strategy",
      progress: 20,
      thumbClass: "thumb-2",
      accentColor: "#059669",
      icon: Users
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="anim delay-2">
      <div className="section-header">
        <span className="section-title">Continue Learning</span>
        <a href="#" className="section-link">See all courses</a>
      </div>
      
      <div className="course-scroll-container">
        <button className="scroll-nav-btn left" onClick={() => scroll('left')}>
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <div className="course-scroll-wrap" ref={scrollRef}>
          <div className="course-strip">
            {courses.map((course, i) => (
              <CourseCard key={i} {...course} />
            ))}
          </div>
        </div>

        <button className="scroll-nav-btn right" onClick={() => scroll('right')}>
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
