import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Target, Layers, Lightbulb } from 'lucide-react';

/**
 * exercise: obje (exercises.js'den)
 * setsReps: string, örn. "3x12"
 * onClose: () => void
 */
export default function ExerciseModal({ exercise, setsReps, onClose }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ESC ile kapatma
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!exercise) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box animate-modal-in">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{exercise.displayName}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">
            <X size={22} />
          </button>
        </div>

        {/* GIF */}
        <div className="modal-gif-wrap">
          {!imgLoaded && !imgError && (
            <div className="modal-gif-skeleton">
              <div className="skeleton-pulse" />
              <span>Animasyon yükleniyor...</span>
            </div>
          )}
          {!imgError ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.displayName}
              className="modal-gif"
              style={{ display: imgLoaded ? 'block' : 'none' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="modal-gif-error">
              <Dumbbell size={48} color="#6366f1" />
              <p>Animasyon yüklenemedi</p>
            </div>
          )}
        </div>

        {/* Info Pills */}
        <div className="modal-pills">
          <div className="modal-pill modal-pill--purple">
            <Target size={14} />
            {exercise.muscleGroup}
          </div>
          <div className="modal-pill modal-pill--blue">
            <Dumbbell size={14} />
            {exercise.equipment}
          </div>
          {setsReps && (
            <div className="modal-pill modal-pill--green">
              <Layers size={14} />
              {setsReps}
            </div>
          )}
        </div>

        {/* Tips */}
        {exercise.tips?.length > 0 && (
          <div className="modal-tips">
            <h4 className="modal-tips__title">
              <Lightbulb size={16} />
              Teknik İpuçları
            </h4>
            <ul className="modal-tips__list">
              {exercise.tips.map((tip, i) => (
                <li key={i} className="modal-tips__item">
                  <span className="modal-tips__num">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
