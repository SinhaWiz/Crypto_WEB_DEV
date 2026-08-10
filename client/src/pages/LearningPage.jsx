import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLearningLessons } from '../services/gamificationService';

export function LearningPage() {
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getLearningLessons()
      .then(setLessons)
      .catch(() => setError('Could not load lessons'));
  }, []);

  return (
    <div className="portfolio-page">
      <header className="dashboard-header">
        <h1>Learning</h1>
        <Link to="/">Back to dashboard</Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="lesson-list">
        {lessons.map((lesson) => (
          <article key={lesson.slug}>
            <span>{lesson.level}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <ul>
              {lesson.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
