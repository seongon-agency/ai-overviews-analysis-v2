'use client';

import { useMemo } from 'react';
import { parseMarkdownWithCitations } from '@/lib/parse-citations';
import { CitationBadge } from './CitationBadge';
import { Reference } from '@/lib/types';
import { splitTextByBrand } from '@/lib/analysis';

interface AIOContentProps {
  markdown: string;
  references: Reference[];
  highlightedCitation: number | null;
  onCitationHover: (num: number | null) => void;
  onCitationClick: (num: number) => void;
  brandName?: string;
}

export function AIOContent({
  markdown,
  references,
  highlightedCitation,
  onCitationHover,
  onCitationClick,
  brandName
}: AIOContentProps) {
  // Parse markdown with citation matching
  const segments = useMemo(
    () => parseMarkdownWithCitations(markdown, references),
    [markdown, references]
  );

  // Highlight brand name in text using unified brand matching logic
  const highlightBrandName = (text: string, keyPrefix: string): React.ReactNode => {
    if (!brandName || brandName.length < 2) {
      return text;
    }

    // Use the unified splitTextByBrand function from analysis.ts
    const parts = splitTextByBrand(brandName, text);

    if (parts.length === 1 && !parts[0].isBrand) {
      return text; // No matches
    }

    return parts.map((part, idx) => {
      if (part.isBrand) {
        return (
          <mark
            key={`${keyPrefix}-brand-${idx}`}
            className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium"
          >
            {part.text}
          </mark>
        );
      }
      return part.text;
    });
  };

  // Render inline formatting (bold, italic, code, links)
  const renderInlineFormatting = (text: string, keyPrefix: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;

    // Combined pattern for bold, italic, code, and links
    // Order: code first (to not interfere), then bold, then italic, then links
    const patterns = [
      { regex: /`([^`]+)`/g, render: (m: string) => <code key={`${keyPrefix}-${partKey++}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{m}</code> },
      { regex: /\*\*([^*]+)\*\*/g, render: (m: string) => <strong key={`${keyPrefix}-${partKey++}`} className="font-semibold">{m}</strong> },
      { regex: /__([^_]+)__/g, render: (m: string) => <strong key={`${keyPrefix}-${partKey++}`} className="font-semibold">{m}</strong> },
      { regex: /\*([^*]+)\*/g, render: (m: string) => <em key={`${keyPrefix}-${partKey++}`} className="italic">{m}</em> },
      { regex: /_([^_]+)_/g, render: (m: string) => <em key={`${keyPrefix}-${partKey++}`} className="italic">{m}</em> },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (m: string, url: string) => (
        <a key={`${keyPrefix}-${partKey++}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{m}</a>
      )},
    ];

    // Simple approach: just handle bold for now, can be extended
    const boldPattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    const codePattern = /`([^`]+)`/g;

    // First pass: handle code
    let processed = text;
    const codeMatches: { placeholder: string; element: React.ReactNode }[] = [];
    let codeMatch;
    let codeIdx = 0;

    while ((codeMatch = codePattern.exec(text)) !== null) {
      const placeholder = `__CODE_${codeIdx}__`;
      codeMatches.push({
        placeholder,
        element: <code key={`${keyPrefix}-code-${codeIdx}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{codeMatch[1]}</code>
      });
      processed = processed.replace(codeMatch[0], placeholder);
      codeIdx++;
    }

    // Second pass: handle bold
    const boldMatches: { placeholder: string; element: React.ReactNode }[] = [];
    let boldMatch;
    let boldIdx = 0;
    const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;

    while ((boldMatch = boldRegex.exec(processed)) !== null) {
      const placeholder = `__BOLD_${boldIdx}__`;
      boldMatches.push({
        placeholder,
        element: <strong key={`${keyPrefix}-bold-${boldIdx}`} className="font-semibold">{boldMatch[1] || boldMatch[2]}</strong>
      });
      processed = processed.replace(boldMatch[0], placeholder);
      boldIdx++;
    }

    // Now split by placeholders and reconstruct
    const allMatches = [...codeMatches, ...boldMatches];
    if (allMatches.length === 0) {
      // No formatting, just highlight brand name
      return highlightBrandName(text, keyPrefix);
    }

    // Create regex to split by all placeholders
    const placeholderPattern = /__(?:CODE|BOLD)_\d+__/g;
    const textParts = processed.split(placeholderPattern);
    const placeholders = processed.match(placeholderPattern) || [];

    const result: React.ReactNode[] = [];
    textParts.forEach((part, idx) => {
      if (part) {
        // Highlight brand name in text parts
        result.push(<span key={`${keyPrefix}-text-${idx}`}>{highlightBrandName(part, `${keyPrefix}-text-${idx}`)}</span>);
      }
      if (placeholders[idx]) {
        const match = allMatches.find(m => m.placeholder === placeholders[idx]);
        if (match) {
          result.push(match.element);
        }
      }
    });

    return result;
  };

  // Parse and render a table
  const renderTable = (tableText: string, key: string): React.ReactNode => {
    const lines = tableText.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return null;

    // Parse header
    const headerCells = lines[0].split('|').map(c => c.trim()).filter(c => c);

    // Skip separator line (index 1)
    // Parse body rows
    const bodyRows = lines.slice(2).map(line =>
      line.split('|').map(c => c.trim()).filter(c => c)
    );

    return (
      <div key={key} className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headerCells.map((cell, i) => (
                <th key={i} className="border border-gray-300 px-3 py-2 text-left font-medium">
                  {renderInlineFormatting(cell, `${key}-th-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-300 px-3 py-2">
                    {renderInlineFormatting(cell, `${key}-td-${rowIdx}-${cellIdx}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Check if a line is part of a table
  const isTableLine = (line: string): boolean => {
    return line.includes('|') && (line.trim().startsWith('|') || line.split('|').length > 2);
  };

  // Check if a line is a table separator
  const isTableSeparator = (line: string): boolean => {
    return /^\|?[\s\-:|]+\|?$/.test(line.trim());
  };

  // Render text content with markdown formatting
  const renderText = (text: string, keyPrefix: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const tableContent = tableBuffer.join('\n');
        result.push(renderTable(tableContent, `${keyPrefix}-table-${result.length}`));
        tableBuffer = [];
      }
      inTable = false;
    };

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      const lineKey = `${keyPrefix}-${lineIdx}`;

      // Handle table lines
      if (isTableLine(line) || (inTable && isTableSeparator(line))) {
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Handle empty lines
      if (trimmedLine === '') {
        result.push(<div key={lineKey} className="h-3" />);
        return;
      }

      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        result.push(
          <h4 key={lineKey} className="font-semibold text-base mt-4 mb-2 text-gray-900">
            {renderInlineFormatting(trimmedLine.slice(4), lineKey)}
          </h4>
        );
        return;
      }
      if (trimmedLine.startsWith('## ')) {
        result.push(
          <h3 key={lineKey} className="font-semibold text-lg mt-5 mb-2 text-gray-900">
            {renderInlineFormatting(trimmedLine.slice(3), lineKey)}
          </h3>
        );
        return;
      }
      if (trimmedLine.startsWith('# ')) {
        result.push(
          <h2 key={lineKey} className="font-bold text-xl mt-5 mb-3 text-gray-900">
            {renderInlineFormatting(trimmedLine.slice(2), lineKey)}
          </h2>
        );
        return;
      }

      // Handle unordered list items
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        result.push(
          <div key={lineKey} className="flex gap-2 ml-4 my-1.5">
            <span className="text-gray-400 select-none">•</span>
            <span className="flex-1">{renderInlineFormatting(trimmedLine.slice(2), lineKey)}</span>
          </div>
        );
        return;
      }

      // Handle numbered list items
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        result.push(
          <div key={lineKey} className="flex gap-2 ml-4 my-1.5">
            <span className="text-gray-500 font-medium min-w-[1.5rem]">{numberedMatch[1]}.</span>
            <span className="flex-1">{renderInlineFormatting(numberedMatch[2], lineKey)}</span>
          </div>
        );
        return;
      }

      // Handle blockquotes
      if (trimmedLine.startsWith('> ')) {
        result.push(
          <blockquote key={lineKey} className="border-l-4 border-gray-300 pl-4 my-2 text-gray-600 italic">
            {renderInlineFormatting(trimmedLine.slice(2), lineKey)}
          </blockquote>
        );
        return;
      }

      // Regular paragraph text
      result.push(
        <p key={lineKey} className="my-1">
          {renderInlineFormatting(line, lineKey)}
        </p>
      );
    });

    // Flush any remaining table
    flushTable();

    return result;
  };

  if (!markdown) {
    return (
      <div className="text-gray-500 italic">
        No AI Overview content available
      </div>
    );
  }

  return (
    <div className="text-gray-800 leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <span key={i}>
              {renderText(seg.content || '', `seg-${i}`)}
            </span>
          );
        }

        // Citation badge - now with correctly matched reference rank
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
