import React from 'react';
import { getInitials } from '../utils';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ name, color, size = 'md', className = '' }) => (
  <div
    className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`}
    style={{ backgroundColor: color, boxShadow: `0 0 0 2px white, 0 0 0 3px ${color}22` }}
  >
    {getInitials(name)}
  </div>
);

// Stacked avatars (like Splitwise group preview)
export const AvatarStack: React.FC<{ members: { name: string; color: string }[]; max?: number }> = ({
  members,
  max = 4,
}) => {
  const visible = members.slice(0, max);
  const remaining = members.length - max;
  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      {visible.map((m, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}>
          <Avatar name={m.name} color={m.color} size="sm" />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center border-2 border-white"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
