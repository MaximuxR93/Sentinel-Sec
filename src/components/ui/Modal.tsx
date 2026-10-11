import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`fixed inset-0 m-auto p-0 rounded-[20px] bg-white border border-[#DDE4EE] shadow-[0_8px_32px_rgba(28,52,92,0.18)] backdrop:bg-black/40 backdrop:backdrop-blur-none w-full ${maxWidth} overflow-hidden outline-none`}
    >
      <div className="flex items-center justify-between border-b border-[#CED5E0] px-6 py-4 bg-white">
        <h3 className="text-[18px] font-[500] text-[#020C21]">{title}</h3>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6] transition-colors duration-150 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.7} />
        </button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
    </dialog>
  );
};
