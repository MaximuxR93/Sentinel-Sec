import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6EDF6] text-[#59627E] mb-4">
        <Icon size={26} strokeWidth={1.7} />
      </div>
      <h3 className="text-[18px] font-[500] text-[#020C21] mb-1">{title}</h3>
      <p className="text-[14px] font-[425] text-[#59627E] max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="rounded-full bg-[#0F1B31] px-5 py-2.5 text-[14px] font-[470] text-white hover:bg-[#020C21] transition-colors duration-150 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
