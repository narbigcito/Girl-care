import { useState, useEffect, useRef } from 'react';
import { formatDate } from '../utils/cycleCalculations';

const PERIOD_OPTIONS = [
  { value: null, label: 'Ninguno', emoji: '⬜' },
  { value: 'start', label: 'Inicio', emoji: '🔴' },
  { value: 'flow', label: 'Flujo', emoji: '💧' },
  { value: 'end', label: 'Fin', emoji: '🩸' },
];

const SYMPTOM_FIELDS = [
  { key: 'cramps', label: 'Cólicos' },
  { key: 'headache', label: 'Jaqueca' },
  { key: 'bloating', label: 'Hinchazón' },
  { key: 'fatigue', label: 'Fatiga' },
];

const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Feliz' },
  { value: 'neutral', emoji: '😐', label: 'Normal' },
  { value: 'sad', emoji: '😢', label: 'Triste' },
  { value: 'irritable', emoji: '😤', label: 'Irritable' },
  { value: 'anxious', emoji: '😰', label: 'Ansiosa' },
];

const SEVERITY_LABELS = ['Sin síntoma', 'Leve', 'Moderado', 'Intenso'];

function SeverityPicker({ value, onChange, label }) {
  return (
    <div className="symptom-row">
      <span className="symptom-row__label">{label}</span>
      <div className="severity-buttons" role="group" aria-label={`${label}, severidad`}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`severity-btn ${value === n ? 'severity-btn--active' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${label}: ${SEVERITY_LABELS[n]}`}
            style={
              value === n
                ? { background: `var(--severity-${n})`, color: n >= 3 ? '#fff' : 'inherit' }
                : {}
            }
          >
            {n === 0 ? '—' : '●'.repeat(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DayModal({ date, entry, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const overlayRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Reset form when date changes
  useEffect(() => {
    if (!date || !entry) return;
    setForm({
      periodStatus: entry.periodStatus ?? null,
      symptoms: { ...entry.symptoms },
      notes: entry.notes ?? '',
    });
  }, [date, entry]);

  // Focus first interactive element when modal opens
  useEffect(() => {
    if (date && firstFocusRef.current) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [date]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!date || !form) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const setSymptom = (key, value) => {
    setForm((f) => ({ ...f, symptoms: { ...f.symptoms, [key]: value } }));
  };

  const handleSave = () => {
    onSave(date, form);
    onClose();
  };

  const handleDelete = () => {
    onDelete(date);
    onClose();
  };

  const hasData =
    form.periodStatus !== null ||
    form.notes.trim().length > 0 ||
    form.symptoms.spotting ||
    form.symptoms.cramps > 0 ||
    form.symptoms.headache > 0 ||
    form.symptoms.bloating > 0 ||
    form.symptoms.fatigue > 0 ||
    form.symptoms.mood !== null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Registro del ${formatDate(date, 'long')}`}
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-header__title">{formatDate(date, 'long')}</h3>
          <button
            className="modal-header__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="modal-body">
          {/* Period status */}
          <section className="modal-section">
            <h4 className="modal-section__title">Estado del período</h4>
            <div className="period-options" role="group" aria-label="Estado del período">
              {PERIOD_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={String(value)}
                  ref={value === null ? firstFocusRef : undefined}
                  type="button"
                  className={`period-btn ${form.periodStatus === value ? 'period-btn--active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, periodStatus: value }))}
                  aria-pressed={form.periodStatus === value}
                >
                  <span className="period-btn__emoji">{emoji}</span>
                  <span className="period-btn__label">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Symptoms */}
          <section className="modal-section">
            <h4 className="modal-section__title">Síntomas</h4>
            {SYMPTOM_FIELDS.map(({ key, label }) => (
              <SeverityPicker
                key={key}
                label={label}
                value={form.symptoms[key]}
                onChange={(v) => setSymptom(key, v)}
              />
            ))}

            {/* Mood */}
            <div className="symptom-row">
              <span className="symptom-row__label">Estado de ánimo</span>
              <div className="mood-buttons" role="group" aria-label="Estado de ánimo">
                {MOODS.map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`mood-btn ${form.symptoms.mood === value ? 'mood-btn--active' : ''}`}
                    onClick={() =>
                      setSymptom('mood', form.symptoms.mood === value ? null : value)
                    }
                    aria-pressed={form.symptoms.mood === value}
                    aria-label={label}
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Spotting */}
            <label className="spotting-label">
              <input
                type="checkbox"
                checked={!!form.symptoms.spotting}
                onChange={(e) => setSymptom('spotting', e.target.checked)}
              />
              <span>Manchado</span>
            </label>
          </section>

          {/* Notes */}
          <section className="modal-section">
            <h4 className="modal-section__title">Notas</h4>
            <textarea
              className="notes-textarea"
              placeholder="Escribe algo aquí..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              maxLength={500}
            />
          </section>
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          {hasData && (
            <button type="button" className="btn btn--danger" onClick={handleDelete}>
              Borrar
            </button>
          )}
          <div className="modal-footer__right">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
