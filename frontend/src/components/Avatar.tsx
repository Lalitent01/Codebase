'use client';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ src, name = 'User', size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl',
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name || 'Avatar'} 
        className={`${sizeClasses[size]} rounded-2xl object-cover border border-white/10`} 
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-2xl bg-[#152328] border border-[#7be4d5]/30 flex items-center justify-center font-bold text-[#7be4d5] uppercase select-none`}
    >
      {name?.charAt(0) || '?'}
    </div>
  );
}