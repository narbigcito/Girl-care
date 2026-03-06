import { todayStr } from '../utils/cycleCalculations';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PHASE_LABELS = {
  menstrual: { label: 'Menstrual', color: 'var(--phase-menstrual)' },
  follicular: { label: 'Folicular', color: 'var(--phase-follicular)' },
  ovulation: { label: 'Ovulación', color: 'var(--phase-ovulation)' },
  luteal: { label: 'Lútea', color: 'var(--phase-luteal)' },
};

const PERIOD_COLORS = {
  start: 'var(--period-start)',
  flow: 'var(--period-flow)',
  end: 'var(--period-end)',
};

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function DayCell({ dateStr, entry, phase, predicted, isToday, onClick }) {
  const periodStatus = entry?.periodStatus;

  let background = 'var(--color-surface)';
  if (periodStatus) background = 'var(--phase-menstrual)';
  else if (phase && PHASE_LABELS[phase]) background = PHASE_LABELS[phase].color;
  else if (predicted) background = 'var(--phase-predicted-bg)';

  const hasSymptoms =
    entry &&
    (entry.symptoms?.cramps > 0 ||
      entry.symptoms?.headache > 0 ||
      entry.symptoms?.bloating > 0 ||
      entry.symptoms?.fatigue > 0 ||
      entry.symptoms?.spotting ||
      entry.symptoms?.mood);

  const hasNotes = entry && entry.notes && entry.notes.trim().length > 0;

  return (
    <button
      className={[
        'day-cell',
        isToday ? 'day-cell--today' : '',
        predicted ? 'day-cell--predicted' : '',
        periodStatus ? `day-cell--period-${periodStatus}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick(dateStr)}
      aria-label={`${dateStr}${isToday ? ', hoy' : ''}${periodStatus ? `, período: ${periodStatus}` : ''}`}
      style={{ background }}
    >
      <span className="day-cell__number">{parseInt(dateStr.slice(8), 10)}</span>

      {periodStatus && (
        <span
          className="day-cell__period-dot"
          style={{ background: PERIOD_COLORS[periodStatus] }}
          title={periodStatus === 'start' ? 'Inicio' : periodStatus === 'flow' ? 'Flujo' : 'Fin'}
        />
      )}

      {predicted && !periodStatus && (
        <span className="day-cell__predicted-dot" title="Período predicho" />
      )}

      {(hasSymptoms || hasNotes) && (
        <span className="day-cell__note-dot" title="Tiene anotaciones" />
      )}
    </button>
  );
}

export default function Calendar({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  getDayEntry,
  getPhase,
  isPredicted,
}) {
  const { year, month } = currentMonth;
  const today = todayStr();

  // Build grid cells
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(year, month, d);
    cells.push({ empty: false, key: dateStr, dateStr });
  }

  return (
    <section className="calendar" aria-label="Calendario del ciclo">
      {/* Header */}
      <div className="calendar__header">
        <button
          className="calendar__nav-btn"
          onClick={onPrevMonth}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h2 className="calendar__title">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          className="calendar__nav-btn"
          onClick={onNextMonth}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="calendar__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar__weekday">
            {w}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="calendar__grid">
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="day-cell day-cell--empty" aria-hidden="true" />
          ) : (
            <DayCell
              key={cell.key}
              dateStr={cell.dateStr}
              entry={getDayEntry(cell.dateStr)}
              phase={getPhase(cell.dateStr)}
              predicted={isPredicted(cell.dateStr)}
              isToday={cell.dateStr === today}
              onClick={onDayClick}
            />
          )
        )}
      </div>

      {/* Legend */}
      <div className="calendar__legend">
        {Object.entries(PHASE_LABELS).map(([key, { label, color }]) => (
          <span key={key} className="legend-item">
            <span className="legend-item__dot" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="legend-item">
          <span
            className="legend-item__dot legend-item__dot--predicted"
            style={{ background: 'var(--phase-predicted-bg)' }}
          />
          Predicción
        </span>
      </div>
    </section>
  );
}
