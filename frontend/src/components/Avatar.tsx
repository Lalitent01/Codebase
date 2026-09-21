'use client';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ src, name = 'User', size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl',
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name || 'Avatar'} 
        className={`${sizeClasses[size]} rounded-[1.5rem] object-cover border border-white/10`} 
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-black text-white uppercase italic border border-white/10 shadow-lg select-none`}
    >
      {name?.charAt(0) || '?'}
    </div>
  );
}