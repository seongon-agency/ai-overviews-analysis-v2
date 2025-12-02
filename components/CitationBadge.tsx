'use client';

interface CitationBadgeProps {
  num: number;
  isHighlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export function CitationBadge({
  num,
  isHighlighted,
  onHover,
  onLeave,
  onClick
}: CitationBadgeProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center
        min-w-5 h-5 px-1 mx-0.5 text-xs font-medium rounded
        transition-all duration-150 cursor-pointer
        border
        ${isHighlighted
          ? 'bg-blue-500 text-white border-blue-600 scale-110'
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-300'
        }
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      title={`Citation ${num}`}
    >
      {num}
    </button>
  );
}
