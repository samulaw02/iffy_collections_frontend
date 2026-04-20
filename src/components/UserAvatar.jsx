import React from 'react';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

export default function UserAvatar({ name, avatarUrl, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-xl' };
  const base = `${sizes[size] ?? sizes.md} rounded-full flex-shrink-0 ${className}`;

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${base} object-cover`} />;
  }

  return (
    <div className={`${base} bg-brand-100 flex items-center justify-center text-brand-700 font-bold`}>
      {getInitials(name)}
    </div>
  );
}
