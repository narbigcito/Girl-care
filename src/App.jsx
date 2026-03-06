import { useState } from 'react';
import { useCycleData } from './hooks/useCycleData';
import Calendar from './components/Calendar';
import DayModal from './components/DayModal';
import CycleStats from './components/CycleStats';
import './App.css';

function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const [selectedDate, setSelectedDate] = useState(null);

  const {
    cycles,
    avgCycleLength,
    avgPeriodLength,
    prediction,
    getDayEntry,
    upsertDayEntry,
    deleteDayEntry,
    getPhase,
    isPredicted,
  } = useCycleData();

  const goToPrevMonth = () => {
    setCurrentMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  };

  const selectedEntry = selectedDate ? getDayEntry(selectedDate) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">
          <span className="app-header__icon">🌸</span>
          Girl Care
        </h1>
        <p className="app-header__subtitle">Calendario del ciclo menstrual</p>
      </header>

      <main className="app-main">
        <Calendar
          currentMonth={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onDayClick={setSelectedDate}
          getDayEntry={getDayEntry}
          getPhase={getPhase}
          isPredicted={isPredicted}
        />

        <CycleStats
          cycles={cycles}
          avgCycleLength={avgCycleLength}
          avgPeriodLength={avgPeriodLength}
          prediction={prediction}
        />
      </main>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          entry={selectedEntry}
          onClose={() => setSelectedDate(null)}
          onSave={upsertDayEntry}
          onDelete={deleteDayEntry}
        />
      )}
    </div>
  );
}
