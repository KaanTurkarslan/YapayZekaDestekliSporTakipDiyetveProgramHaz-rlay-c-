import React from 'react';
import { findExercise } from '../data/exercises.js';
import { CheckCircle, Play, Dumbbell } from 'lucide-react';

/**
 * rawText: AI'ın workoutPlan dizisindeki string, örn. "Bench Press (4x10)"
 * onOpen: modal açma callback'i → exercise objesini parametre alır
 * completed: bool
 * onToggleComplete: () => void
 */
export default function ExerciseCard({ rawText, onOpen, completed, onToggleComplete }) {
  // "Bench Press (4x10)" → name="Bench Press", setsReps="4x10"
  const match = rawText.match(/^(.+?)\s*[\(\[](.+?)[\)\]](.*)$/);
  const name = match ? match[1].trim() : rawText.trim();
  const setsReps = match ? match[2].trim() : '';
  const extra = match ? match[3].trim() : '';

  const exercise = findExercise(name);

  const handleCardClick = () => {
    if (exercise) onOpen(exercise, setsReps || `${exercise.defaultSets}x${exercise.defaultReps}`);
  };

  return (
    <div
      className={`exercise-card ${completed ? 'exercise-card--done' : ''} ${exercise ? 'exercise-card--clickable' : ''}`}
      onClick={exercise ? handleCardClick : undefined}
      title={exercise ? 'Detay ve animasyon için tıkla' : ''}
    >
      <div className="exercise-card__left">
        <div className="exercise-card__icon">
          {exercise ? <Play size={14} /> : <Dumbbell size={14} />}
        </div>
        <div>
          <div className="exercise-card__name">
            {name}
            {extra && <span className="exercise-card__extra"> {extra}</span>}
          </div>
          {setsReps && (
            <div className="exercise-card__sets">{setsReps}</div>
          )}
          {exercise && (
            <div className="exercise-card__muscle">{exercise.muscleGroup} · {exercise.equipment}</div>
          )}
        </div>
      </div>

      <button
        className={`exercise-card__check ${completed ? 'exercise-card__check--done' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
        title={completed ? 'Tamamlandı (geri al)' : 'Tamamlandı işaretle'}
        aria-label="Tamamlandı"
      >
        <CheckCircle size={22} />
      </button>
    </div>
  );
}
