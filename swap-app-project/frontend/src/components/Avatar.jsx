import React, { useState } from 'react';

const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    xs: 'w-8 h-8 rounded-full',
    sm: 'w-10 h-10 rounded-full',
    md: 'w-12 h-12 rounded-full',
    lg: 'w-16 h-16 rounded-full',
    xl: 'w-24 h-24 rounded-[1.5rem]',
    xxl: 'w-32 h-32 rounded-[2rem]'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
    xxl: 'text-4xl'
  };

  const fallback = (
    <div className={`${sizeClasses[size]} bg-indigo-100 flex items-center justify-center text-indigo-600 font-black border border-indigo-200 ${className}`}>
      {alt?.charAt(0).toUpperCase() || '?'}
    </div>
  );

  if (error || !src) return fallback;

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setError(true)}
      className={`${sizeClasses[size]} object-cover border border-slate-100 shadow-sm ${className}`}
    />
  );
};

export default Avatar;
