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

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <button onClick={loadLessons} className="mt-4 text-purple-600 hover:underline text-sm">
          Try again
        </button>
      </div>
    );
  }

  const groupedLessons = groupByCategory(lessons);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Learning</h2>
        <p className="text-gray-500 text-sm mt-1">
          Short lessons on how this simulator works and the basics of crypto trading.
        </p>
      </div>

      {groupedLessons.map(([category, categoryLessons]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
          <div className="space-y-3">
            {categoryLessons.map((lesson) => {
              const isExpanded = expandedSlug === lesson.slug;
              return (
                <div
                  key={lesson.slug}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSlug(isExpanded ? null : lesson.slug)}
                    className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{lesson.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{lesson.summary}</p>
                    </div>
                    <span className="text-gray-400 text-sm shrink-0">{isExpanded ? '−' : '+'}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {lesson.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
