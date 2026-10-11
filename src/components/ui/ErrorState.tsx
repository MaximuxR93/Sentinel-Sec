import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-[20px] bg-white border border-[#CED5E0]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FADADD] text-[#A1121F] mb-3">
        <AlertOctagon size={24} strokeWidth={1.7} />
      </div>
      <h3 className="text-[17px] font-[500] text-[#020C21] mb-1">{title}</h3>
      <p className="text-[14px] font-[425] text-[#59627E] max-w-md mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-[#CED5E0] bg-white px-4 py-2 text-[14px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
        >
          <RotateCw size={15} strokeWidth={1.7} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
