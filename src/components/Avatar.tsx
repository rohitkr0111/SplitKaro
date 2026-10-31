import React from 'react';
import { getInitials } from '../utils';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ name, color, size = 'md' }) => {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
};
