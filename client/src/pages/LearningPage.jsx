import { useEffect, useState, useCallback } from 'react';
import { getLearningContent } from '../services/learningService';

function groupByCategory(lessons) {
  const groups = new Map();
  lessons.forEach((lesson) => {
    const list = groups.get(lesson.category) ?? [];
    list.push(lesson);
    groups.set(lesson.category, list);
  });
  return Array.from(groups.entries());
}

function ChevronIcon({ isOpen }) {
  return (
    <svg
      className={`accordion-chevron${isOpen ? ' open' : ''}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function LearningPage() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSlug, setExpandedSlug] = useState(null);

  const loadLessons = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getLearningContent()
      .then(setLessons)
      .catch(() => setError('Could not load learning content'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="msg-error" style={{ marginBottom: 12 }}>{error}</div>
        <button onClick={loadLessons} className="btn btn-secondary btn-sm">Try again</button>
      </div>
    );
  }

  const groupedLessons = groupByCategory(lessons);

  return (
    <div className="page-stack">
      {/* Header */}
      <div>
        <h1 className="page-title">Learning Hub</h1>
        <p className="page-subtitle">
          Short, practical lessons on crypto basics and how this simulator works.
        </p>
      </div>

      {/* ─── Category Accordion Groups ─── */}
      {groupedLessons.map(([category, categoryLessons]) => (
        <div key={category}>
          {/* Category Label */}
          <p
            className="section-label"
            style={{
              color: 'var(--color-primary)',
              marginBottom: 12,
              paddingLeft: 2,
            }}
          >
            {category}
          </p>

          {/* Accordion Card */}
          <div
            className="card"
            style={{ overflow: 'hidden' }}
          >
            {categoryLessons.map((lesson, idx) => {
              const isExpanded = expandedSlug === lesson.slug;
              const isLast = idx === categoryLessons.length - 1;

              return (
                <div
                  key={lesson.slug}
                  className="accordion-row"
                  style={{ borderBottom: isLast ? 'none' : undefined }}
                  id={`lesson-${lesson.slug}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSlug(isExpanded ? null : lesson.slug)}
                    className="accordion-btn"
                    style={{ padding: '16px 20px' }}
                    aria-expanded={isExpanded}
                    aria-controls={`lesson-body-${lesson.slug}`}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: isExpanded ? 'var(--color-primary)' : 'var(--color-ink)',
                          margin: '0 0 2px',
                          transition: 'color 150ms ease',
                        }}
                      >
                        {lesson.title}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
                        {lesson.summary}
                      </p>
                    </div>
                    <ChevronIcon isOpen={isExpanded} />
                  </button>

                  {isExpanded && (
                    <div
                      id={`lesson-body-${lesson.slug}`}
                      className="accordion-content"
                      style={{ padding: '0 20px 20px' }}
                    >
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: 'var(--color-surface)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--color-hairline)',
                          lineHeight: 1.7,
                        }}
                      >
                        {lesson.body}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {groupedLessons.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p className="text-muted">No lessons available yet.</p>
        </div>
      )}
    </div>
  );
}
