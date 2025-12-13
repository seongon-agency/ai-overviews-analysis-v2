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
          ? 'bg-[var(--color-accent-emphasis)] text-[var(--color-canvas-default)] border-[var(--color-accent-emphasis)] scale-110'
          : 'bg-[var(--color-canvas-subtle)] text-[var(--color-fg-default)] border-[var(--color-border-default)] hover:bg-[var(--color-accent-subtle)] hover:border-[var(--color-accent-muted)]'
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
