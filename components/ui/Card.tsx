import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/20 p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
};
