'use client';

import { useState } from 'react';
import { CheckSessionWithStats } from '@/lib/types';

interface SessionListProps {
  sessions: CheckSessionWithStats[];
  selectedSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onDeleteSession: (sessionId: number) => void;
  onCompareClick: () => void;
  comparisonMode: boolean;
  selectedForComparison: number[];
  onToggleComparison: (sessionId: number) => void;
}

export function SessionList({
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
  onCompareClick,
  comparisonMode,
  selectedForComparison,
  onToggleComparison
}: SessionListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (session: CheckSessionWithStats) => {
    setEditingId(session.id);
    setEditName(session.name || '');
  };

  const handleSaveEdit = async (sessionId: number) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      setEditingId(null);
      // Trigger refresh by selecting the session
      onSelectSession(sessionId);
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--color-fg-muted)' }}>
        <p>No check sessions yet.</p>
        <p className="text-sm mt-1">Fetch keywords or upload data to create your first session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Compare mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {comparisonMode
            ? `Select sessions to compare (${selectedForComparison.length} selected)`
            : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        </span>
        <button
          onClick={onCompareClick}
          className="px-3 py-1 text-sm rounded-md transition-colors"
          style={comparisonMode ? {
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-accent-fg)'
          } : {
            backgroundColor: 'var(--color-neutral-muted)',
            color: 'var(--color-fg-default)'
          }}
        >
          {comparisonMode ? 'Exit Compare Mode' : 'Compare Sessions'}
        </button>
      </div>

      {/* Session list */}
      {sessions.map((session, index) => {
        const isSelected = selectedSessionId === session.id;
        const isSelectedForComparison = selectedForComparison.includes(session.id);
        const isLatest = index === 0;

        return (
          <div
            key={session.id}
            className="gh-box p-3 rounded-md transition-all cursor-pointer"
            style={
              isSelectedForComparison ? {
                borderColor: 'var(--color-accent-emphasis)',
                backgroundColor: 'var(--color-accent-subtle)',
                boxShadow: '0 0 0 2px var(--color-accent-emphasis)'
              } : isSelected && !comparisonMode ? {
                borderColor: 'var(--color-accent-emphasis)',
                backgroundColor: 'var(--color-accent-subtle)'
              } : {}
            }
            onClick={() => {
              if (comparisonMode) {
                onToggleComparison(session.id);
              } else {
                onSelectSession(session.id);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm rounded-md focus:outline-none"
                      style={{
                        border: '1px solid var(--color-border-default)',
                        boxShadow: '0 0 0 3px var(--color-accent-emphasis)'
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(session.id)}
                      className="p-1 rounded-md"
                      style={{ color: 'var(--color-success-fg)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded-md"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {comparisonMode && (
                      <input
                        type="checkbox"
                        checked={isSelectedForComparison}
                        onChange={() => onToggleComparison(session.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded-md"
                        style={{ accentColor: 'var(--color-accent-fg)' }}
                      />
                    )}
                    <span className="font-medium truncate" style={{ color: 'var(--color-fg-default)' }}>
                      {session.name || `Session ${session.id}`}
                    </span>
                    {isLatest && (
                      <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                        backgroundColor: 'var(--color-success-subtle)',
                        color: 'var(--color-success-fg)'
                      }}>
                        Latest
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs mt-1" style={{ color: 'var(--color-fg-muted)' }}>
                  {formatDate(session.created_at)}
                </div>
              </div>

              {!comparisonMode && (
                <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleStartEdit(session)}
                    className="p-1 rounded-md"
                    style={{ color: 'var(--color-fg-subtle)' }}
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this session? This cannot be undone.')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1 rounded-md"
                    style={{ color: 'var(--color-fg-subtle)' }}
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--color-fg-muted)' }}>Keywords:</span>
                <span className="font-medium">{session.keyword_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--color-fg-muted)' }}>AIO:</span>
                <span className="font-medium" style={{ color: 'var(--color-success-fg)' }}>{session.aio_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--color-fg-muted)' }}>Rate:</span>
                <span className="font-medium" style={{ color: 'var(--color-accent-fg)' }}>{session.aio_rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Compare button (when sessions are selected) */}
      {comparisonMode && selectedForComparison.length >= 2 && (
        <div className="sticky bottom-0 pt-4" style={{ backgroundColor: 'var(--color-canvas-default)' }}>
          <button
            onClick={onCompareClick}
            className="w-full py-2 rounded-md transition-colors font-medium"
            style={{
              backgroundColor: 'var(--color-accent-emphasis)',
              color: 'var(--color-fg-on-emphasis)'
            }}
          >
            Compare {selectedForComparison.length} Sessions
          </button>
        </div>
      )}
    </div>
  );
}
