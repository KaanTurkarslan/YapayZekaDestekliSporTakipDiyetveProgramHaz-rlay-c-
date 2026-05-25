import React, { useState, useRef, useEffect } from 'react';
import { Activity, Dumbbell, Send, Zap, ChevronLeft, CheckCircle, Play, Target, Layers, Lightbulb, X } from 'lucide-react';
import { getFitnessAdvice } from './services/ai.js';
import { findExercise } from './data/exercises.js';

/* ─── Inline ExerciseCard (no separate file needed in new layout) ────────── */
function ExerciseCard({ rawText, onSelect, isSelected, completed, onToggleComplete }) {
  // Strip markdown bold markers (**) and clean the raw text
  const cleaned = rawText.replace(/\*\*/g, '').trim();

  // Skip lines without exercise format — day headers (Pazartesi, Salı...) or rest days won't have "(3x12)" style
  if (!/\(.*\d.*\)/.test(cleaned)) return null;

  const match = cleaned.match(/^(.+?)\s*[\(\[](.+?)[\)\]](.*)$/);
  const name = match ? match[1].trim() : cleaned;
  const setsReps = match ? match[2].trim() : '';
  const exercise = findExercise(name);

  return (
    <div
      className={`ex-card ${isSelected ? 'ex-card--active' : ''} ${completed ? 'ex-card--done' : ''} ${exercise ? 'ex-card--clickable' : ''}`}
      onClick={() => exercise && onSelect(exercise, setsReps)}
    >
      <div className="ex-card__icon">
        {exercise ? <Play size={13} /> : <Dumbbell size={13} />}
      </div>
      <div className="ex-card__info">
        <div className="ex-card__name">{name}</div>
        {setsReps && <div className="ex-card__sets">{setsReps}</div>}
        {exercise && <div className="ex-card__muscle">{exercise.muscleGroup}</div>}
      </div>
      <button
        className={`ex-card__check ${completed ? 'ex-card__check--done' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleComplete(); }}
        title={completed ? 'Tamamlandı' : 'Tamamlandı olarak işaretle'}
      >
        <CheckCircle size={18} />
      </button>
    </div>
  );
}

/* ─── Right Panel: Exercise Detail ──────────────────────────────────────── */
function ExerciseDetail({ exercise, setsReps, onClose }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [exercise]);

  if (!exercise) return (
    <div className="detail-empty">
      <Dumbbell size={48} color="#374151" />
      <p>Bir harekete tıklayarak detaylarını burada görebilirsin</p>
    </div>
  );

  return (
    <div className="detail-content animate-slide-up">
      <div className="detail-header">
        <h3 className="detail-title">{exercise.displayName}</h3>
        <button className="detail-close" onClick={onClose}><X size={18} /></button>
      </div>

      {/* GIF */}
      <div className="detail-gif-wrap">
        {!imgLoaded && !imgError && (
          <div className="detail-gif-skeleton">
            <div className="skeleton-pulse" />
          </div>
        )}
        {!imgError ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.displayName}
            className="detail-gif"
            style={{ display: imgLoaded ? 'block' : 'none' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="detail-gif-error">
            <Dumbbell size={40} color="#6366f1" />
            <span>Animasyon yüklenemedi</span>
          </div>
        )}
      </div>

      {/* Pills */}
      <div className="detail-pills">
        <span className="detail-pill detail-pill--purple"><Target size={12} />{exercise.muscleGroup}</span>
        <span className="detail-pill detail-pill--blue"><Dumbbell size={12} />{exercise.equipment}</span>
        {setsReps && <span className="detail-pill detail-pill--green"><Layers size={12} />{setsReps}</span>}
      </div>

      {/* Tips */}
      {exercise.tips?.length > 0 && (
        <div className="detail-tips">
          <div className="detail-tips__title"><Lightbulb size={14} /> Teknik İpuçları</div>
          <ul className="detail-tips__list">
            {exercise.tips.map((tip, i) => (
              <li key={i} className="detail-tips__item">
                <span className="detail-tips__num">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
function App() {
  const [appState, setAppState] = useState('onboarding');
  const [userInfo, setUserInfo] = useState({ age: '', weight: '', height: '', gender: 'Erkek', experience: '0-3' });
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [foodInput, setFoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  // Right panel state
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState([]); // latest workout plan items
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedSetsReps, setSelectedSetsReps] = useState('');
  const [completedExercises, setCompletedExercises] = useState({});

  const handleUserInfoChange = e => setUserInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOnboardingSubmit = e => {
    e.preventDefault();
    if (!userInfo.age || !userInfo.weight || !userInfo.height) { alert('Lütfen tüm bilgileri eksiksiz doldurun.'); return; }
    setAppState('selection');
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, loading]);

  const muscleGroups = [
    { id: 'auto', name: 'Bana Program Öner (Otomatik)', icon: <Zap size={18} color="#fbbf24" /> },
    { id: 'chest', name: 'Göğüs', icon: <Dumbbell size={18} /> },
    { id: 'back', name: 'Sırt', icon: <Dumbbell size={18} /> },
    { id: 'legs', name: 'Bacak', icon: <Dumbbell size={18} /> },
    { id: 'shoulders', name: 'Omuz', icon: <Dumbbell size={18} /> },
    { id: 'biceps', name: 'Ön Kol (Biceps)', icon: <Dumbbell size={18} /> },
    { id: 'triceps', name: 'Arka Kol (Triceps)', icon: <Dumbbell size={18} /> },
    { id: 'abs', name: 'Karın', icon: <Dumbbell size={18} /> },
    { id: 'cardio', name: 'Kardiyo', icon: <Activity size={18} /> },
    { id: 'hiit', name: 'HIIT', icon: <Activity size={18} /> },
  ];

  const toggleArea = name => {
    if (name === 'Bana Program Öner (Otomatik)') {
      setSelectedAreas(prev => prev.includes(name) ? [] : [name]);
      return;
    }
    setSelectedAreas(prev => {
      const curr = prev.filter(a => a !== 'Bana Program Öner (Otomatik)');
      return curr.includes(name) ? curr.filter(a => a !== name) : [...curr, name];
    });
  };

  const handleStartChat = async () => {
    setAppState('chat');
    let userText = foodInput.trim() || (selectedAreas.length > 0
      ? `Merhaba, bugün ${selectedAreas.join(', ')} çalışmak istiyorum. Başlayalım mı?`
      : 'Merhaba, bugün spor yapmak istiyorum. Nereden başlayalım?');
    const initialUserMsg = { role: 'user', text: userText, data: null };
    setChatHistory([initialUserMsg]);
    setLoading(true);
    try {
      const result = await getFitnessAdvice([], selectedAreas.join(', '), foodInput, userInfo);
      setChatHistory([initialUserMsg, { role: 'model', text: result.coachMessage, data: result }]);
      if (result.workoutPlan?.length > 0) {
        setActiveWorkoutPlan(result.workoutPlan);
        setCompletedExercises({});
        setSelectedExercise(null);
      }
    } catch (err) { console.error(err); alert('Tavsiye alınırken bir hata oluştu.'); }
    finally { setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput, data: null };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setLoading(true);
    try {
      const result = await getFitnessAdvice(newHistory, selectedAreas.join(', '), foodInput, userInfo);
      setChatHistory([...newHistory, { role: 'model', text: result.coachMessage, data: result }]);
      if (result.workoutPlan?.length > 0) {
        setActiveWorkoutPlan(result.workoutPlan);
        setCompletedExercises({});
        setSelectedExercise(null);
      }
    } catch (err) { console.error(err); alert('Cevap alınırken hata oluştu.'); }
    finally { setLoading(false); }
  };

  // Only count items that pass the exercise format check (have parentheses with numbers)
  const validExerciseCount = activeWorkoutPlan.filter(item => /\(.*\d.*\)/.test(item.replace(/\*\*/g, ''))).length;
  const completedCount = Object.values(completedExercises).filter(Boolean).length;

  return (
    <div className="app-shell">
      {/* ── ONBOARDING & SELECTION ── */}
      {appState !== 'chat' && (
        <div className="page-center animate-slide-up">
          <header className="page-header">
            <h1>AI Fitness Koçu</h1>
            <p>Hedeflerinize ulaşmak için yapay zeka destekli kişisel koçunuz.</p>
          </header>

          {appState === 'onboarding' && (
            <div className="card" style={{ maxWidth: 560, width: '100%' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Kişisel Bilgileriniz</h2>
              <form onSubmit={handleOnboardingSubmit}>
                <div className="grid-2">
                  <div>
                    <label className="form-label">Yaş</label>
                    <input type="number" name="age" value={userInfo.age} onChange={handleUserInfoChange} placeholder="Örn: 25" required min="10" max="100" />
                  </div>
                  <div>
                    <label className="form-label">Boy (cm)</label>
                    <input type="number" name="height" value={userInfo.height} onChange={handleUserInfoChange} placeholder="Örn: 180" required min="100" max="250" />
                  </div>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label">Kilo (kg)</label>
                    <input type="number" name="weight" value={userInfo.weight} onChange={handleUserInfoChange} placeholder="Örn: 75" required min="30" max="200" />
                  </div>
                  <div>
                    <label className="form-label">Cinsiyet</label>
                    <select name="gender" value={userInfo.gender} onChange={handleUserInfoChange}>
                      <option value="Erkek">Erkek</option>
                      <option value="Kadın">Kadın</option>
                      <option value="Belirtmek İstemiyorum">Belirtmek İstemiyorum</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Spor Geçmişiniz</label>
                  <select name="experience" value={userInfo.experience} onChange={handleUserInfoChange}>
                    <option value="0-3">Yeni Başlayan (0-3 Ay)</option>
                    <option value="3-6">Yeni Başlayan (3-6 Ay)</option>
                    <option value="orta">Orta Seviye (6 Ay - 2 Yıl)</option>
                    <option value="ileri">İleri Seviye (2 Yıl+)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.05rem' }}>
                  Kaydet ve Devam Et
                </button>
              </form>
            </div>
          )}

          {appState === 'selection' && (
            <div className="animate-slide-up" style={{ maxWidth: 640, width: '100%' }}>
              <button className="btn" style={{ marginBottom: '1.5rem', gap: '0.4rem' }} onClick={() => setAppState('onboarding')}>
                <ChevronLeft size={16} /> Geri
              </button>
              <section style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>1. Bugün Hangi Bölgeleri Çalışacaksınız?</h2>
                <div className="grid-2">
                  {muscleGroups.map(group => (
                    <button
                      key={group.id}
                      className={`btn ${selectedAreas.includes(group.name) ? 'btn-primary' : ''}`}
                      onClick={() => toggleArea(group.name)}
                      style={{ justifyContent: 'flex-start', padding: '1rem 1.25rem' }}
                    >
                      {group.icon}{group.name}
                    </button>
                  ))}
                </div>
              </section>

              <div className="card">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Activity size={22} color="var(--primary-color)" /> 2. Bugünkü Hedefiniz Nedir? (Opsiyonel)
                </h2>
                <p style={{ marginBottom: '1rem' }}>Bugün nasıl hissediyorsunuz veya amacınız nedir?</p>
                <textarea rows="3" placeholder="Örn: Bugün enerjim çok düşük, hızlıca antrenmanı bitirmek istiyorum..."
                  value={foodInput} onChange={e => setFoodInput(e.target.value)} />
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '1.25rem' }}
                  onClick={handleStartChat} disabled={loading}>
                  {loading ? 'AI Koç Bağlanıyor...' : 'Koç İle Görüşmeye Başla'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT + RIGHT PANEL ── */}
      {appState === 'chat' && (
        <div className="chat-shell">

          {/* LEFT: Chat */}
          <div className="chat-panel">
            {/* Topbar */}
            <div className="chat-topbar">
              <div className="chat-topbar__dot" />
              <span className="chat-topbar__title">AI Koç Aktif</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {userInfo.age} yaş · {userInfo.weight} kg · {userInfo.height} cm
              </span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-msg ${msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--model'}`}>
                  {msg.role === 'user' ? (
                    <div className="bubble bubble--user">{msg.text}</div>
                  ) : (
                    <div className="bubble bubble--model">
                      {msg.text && (
                        <div className="coach-text">
                          <span className="coach-label">🤖 Koç</span>
                          <p>{msg.text}</p>
                        </div>
                      )}
                      {msg.data?.planningAdvice && (
                        <div className="info-block info-block--purple">
                          <strong>🎯 Günlük Planlama</strong>
                          <p>{msg.data.planningAdvice}</p>
                        </div>
                      )}
                      {msg.data?.workoutWarning && (
                        <div className="info-block info-block--blue">
                          <strong>💡 Önemli Uyarı</strong>
                          <p>{msg.data.workoutWarning}</p>
                        </div>
                      )}
                      {msg.data?.workoutPlan?.length > 0 && (
                        <div className="info-block info-block--violet">
                          <strong>📝 Antrenman Planı</strong>
                          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 0 }}>
                            Sağ panelde interaktif program görüntüleniyor →
                          </p>
                        </div>
                      )}
                      {msg.data?.mustEat?.length > 0 && (
                        <div className="info-block info-block--green">
                          <strong>✅ Tüketilmesi Gerekenler</strong>
                          <ul>{msg.data.mustEat.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      )}
                      {msg.data?.mustAvoid?.length > 0 && (
                        <div className="info-block info-block--red">
                          <strong>❌ Uzak Durulması Gerekenler</strong>
                          <ul>{msg.data.mustAvoid.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chat-msg chat-msg--model">
                  <div className="bubble bubble--model">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Koça yanıt verin..."
                disabled={loading}
                autoFocus
              />
              <button className="btn btn-primary send-btn"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || loading}>
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* RIGHT: Workout Panel */}
          <div className="workout-panel">
            <div className="workout-panel__header">
              <div>
                <div className="workout-panel__title">📝 Antrenman Programı</div>
                {validExerciseCount > 0 && (
                  <div className="workout-panel__sub">
                    {completedCount}/{validExerciseCount} hareket tamamlandı
                  </div>
                )}
              </div>
              {validExerciseCount > 0 && (
                <div className="progress-ring-wrap">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#6366f1" strokeWidth="4"
                      strokeDasharray={`${validExerciseCount > 0 ? (completedCount / validExerciseCount) * 113 : 0} 113`}
                      strokeDashoffset="28.25"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                    <text x="22" y="26" textAnchor="middle" fontSize="10" fill="#a78bfa" fontWeight="700">
                      {validExerciseCount > 0 ? Math.round((completedCount / validExerciseCount) * 100) : 0}%
                    </text>
                  </svg>
                </div>
              )}
            </div>

            {/* Exercise list */}
            <div className="workout-panel__list">
              {activeWorkoutPlan.length === 0 ? (
                <div className="workout-panel__empty">
                  <Dumbbell size={36} color="#334155" />
                  <p>AI koç bir program önerdiğinde burada görünecek</p>
                </div>
              ) : (
                activeWorkoutPlan.map((item, i) => (
                  <ExerciseCard
                    key={i}
                    rawText={item}
                    isSelected={selectedExercise && findExercise(item.match(/^(.+?)\s*[\(\[]/)?.[1]?.trim() || item)?.id === selectedExercise.id}
                    onSelect={(ex, sr) => { setSelectedExercise(ex); setSelectedSetsReps(sr); }}
                    completed={!!completedExercises[i]}
                    onToggleComplete={() => setCompletedExercises(prev => ({ ...prev, [i]: !prev[i] }))}
                  />
                ))
              )}
            </div>

            {/* Detail area */}
            <div className="workout-panel__detail">
              <ExerciseDetail
                exercise={selectedExercise}
                setsReps={selectedSetsReps}
                onClose={() => setSelectedExercise(null)}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;
