import React from 'react';
import churchLogoImg from '../assets/images/church_logo.jpg';

interface ChurchLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const ChurchLogo: React.FC<ChurchLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const sizeDimensions = {
    sm: { img: 'w-8 h-8', text: 'text-[9px]', title: 'text-xs', sub: 'text-[8px]' },
    md: { img: 'w-11 h-11', text: 'text-[10px]', title: 'text-sm', sub: 'text-[9px]' },
    lg: { img: 'w-16 h-16', text: 'text-xs', title: 'text-base', sub: 'text-[11px]' },
    xl: { img: 'w-24 h-24', text: 'text-sm', title: 'text-xl', sub: 'text-xs' }
  };

  const dim = sizeDimensions[size];

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Uploaded Church Logo Container */}
      <div
        className={`${dim.img} rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-xs flex items-center justify-center shrink-0 p-1`}
      >
        <img
          src={churchLogoImg}
          alt="The Shelter Junior Church Logo"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
          }}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Typography Label */}
      {showSubtitle && (
        <div className="text-left">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-slate-900 tracking-tight leading-tight text-base sm:text-lg">
              The Shelter
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Junior Church
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Central Records & Attendance Portal
          </p>
        </div>
      )}
    </div>
  );
};
