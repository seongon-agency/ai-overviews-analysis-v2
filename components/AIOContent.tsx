'use client';

import { useMemo } from 'react';
import { parseMarkdownWithCitations } from '@/lib/parse-citations';
import { CitationBadge } from './CitationBadge';

interface AIOContentProps {
  markdown: string;
  highlightedCitation: number | null;
  onCitationHover: (num: number | null) => void;
  onCitationClick: (num: number) => void;
}

export function AIOContent({
  markdown,
  highlightedCitation,
  onCitationHover,
  onCitationClick
}: AIOContentProps) {
  const segments = useMemo(() => parseMarkdownWithCitations(markdown), [markdown]);

  // Simple markdown text rendering (handles basic formatting)
  const renderText = (text: string, key: string) => {
    // Split by newlines to handle paragraphs and lists
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // Handle list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().slice(2);
        return (
          <div key={`${key}-${lineIdx}`} className="flex gap-2 ml-4 my-1">
            <span className="text-gray-400">•</span>
            <span>{renderInlineFormatting(content)}</span>
          </div>
        );
      }

      // Handle numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        return (
          <div key={`${key}-${lineIdx}`} className="flex gap-2 ml-4 my-1">
            <span className="text-gray-500 font-medium">{numberedMatch[1]}.</span>
            <span>{renderInlineFormatting(numberedMatch[2])}</span>
          </div>
        );
      }

      // Handle headers
      if (line.trim().startsWith('### ')) {
        return (
          <h4 key={`${key}-${lineIdx}`} className="font-semibold text-base mt-3 mb-1">
            {renderInlineFormatting(line.trim().slice(4))}
          </h4>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <h3 key={`${key}-${lineIdx}`} className="font-semibold text-lg mt-4 mb-2">
            {renderInlineFormatting(line.trim().slice(3))}
          </h3>
        );
      }
      if (line.trim().startsWith('# ')) {
        return (
          <h2 key={`${key}-${lineIdx}`} className="font-bold text-xl mt-4 mb-2">
            {renderInlineFormatting(line.trim().slice(2))}
          </h2>
        );
      }

      // Empty line = paragraph break
      if (line.trim() === '') {
        return <div key={`${key}-${lineIdx}`} className="h-2" />;
      }

      // Regular text
      return (
        <span key={`${key}-${lineIdx}`}>
          {renderInlineFormatting(line)}
          {lineIdx < lines.length - 1 && ' '}
        </span>
      );
    });
  };

  // Handle bold, italic, code, and links within text
  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Process bold (**text** or __text__)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;

    // Bold pattern
    const boldPattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    let lastIndex = 0;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={partKey++}>{text.slice(lastIndex, match.index)}</span>
        );
      }
      // Add bold text
      parts.push(
        <strong key={partKey++} className="font-semibold">
          {match[1] || match[2]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={partKey++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  if (!markdown) {
    return (
      <div className="text-gray-500 italic">
        No AI Overview content available
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <span key={i}>
              {renderText(seg.content || '', `seg-${i}`)}
            </span>
          );
        }

        // Citation badge
        return (
          <CitationBadge
            key={i}
            num={seg.citationNum!}
            isHighlighted={highlightedCitation === seg.citationNum}
            onHover={() => onCitationHover(seg.citationNum!)}
            onLeave={() => onCitationHover(null)}
            onClick={() => onCitationClick(seg.citationNum!)}
          />
        );
      })}
    </div>
  );
}
