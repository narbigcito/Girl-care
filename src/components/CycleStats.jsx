import { formatDate, daysBetween, todayStr } from '../utils/cycleCalculations';

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {sub && <span className="stat-card__sub">{sub}</span>}
    </div>
  );
}

export default function CycleStats({ cycles, avgCycleLength, avgPeriodLength, prediction }) {
  const today = todayStr();
  const hasEnoughData = cycles.length >= 2;

  let predictionText = 'Sin datos suficientes';
  let countdownText = null;

  if (prediction) {
    predictionText = `${formatDate(prediction.start)} – ${formatDate(prediction.end)}`;
    const daysUntil = daysBetween(today, prediction.start);
    if (daysUntil > 0) {
      countdownText = `en ${daysUntil} día${daysUntil === 1 ? '' : 's'}`;
    } else if (daysUntil === 0) {
      countdownText = '¡hoy!';
    } else {
      const overdue = Math.abs(daysUntil);
      countdownText = `hace ${overdue} día${overdue === 1 ? '' : 's'}`;
    }
  }

  return (
    <section className="cycle-stats" aria-label="Estadísticas del ciclo">
      <h3 className="cycle-stats__title">Estadísticas</h3>

      {!hasEnoughData && (
        <p className="cycle-stats__hint">
          Registra al menos 2 ciclos completos para ver predicciones y promedios precisos.
        </p>
      )}

      <div className="cycle-stats__grid">
        <StatCard
          label="Duración del ciclo"
          value={`${avgCycleLength} días`}
          sub={hasEnoughData ? `Promedio de ${cycles.length - 1} ciclo${cycles.length > 2 ? 's' : ''}` : 'Valor por defecto'}
        />
        <StatCard
          label="Duración del período"
          value={`${avgPeriodLength} días`}
          sub={cycles.length > 0 ? `De ${cycles.length} registro${cycles.length > 1 ? 's' : ''}` : 'Valor por defecto'}
        />
        <StatCard
          label="Próximo período"
          value={predictionText}
          sub={countdownText}
        />
        <StatCard
          label="Ciclos registrados"
          value={cycles.length}
          sub={cycles.length === 0 ? 'Empieza marcando días de período' : null}
        />
      </div>
    </section>
  );
}
