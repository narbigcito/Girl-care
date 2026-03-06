import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  syncCyclesToEntries,
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  predictNextPeriod,
  getPhaseForDate,
  isInPredictedWindow,
} from '../utils/cycleCalculations';

const STORAGE_KEY = 'girl-care-data';

function getInitialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { dayEntries: parsed.dayEntries || {} };
    }
  } catch {
    // ignore corrupt data
  }
  return { dayEntries: {} };
}

const EMPTY_ENTRY = {
  periodStatus: null,
  symptoms: {
    cramps: 0,
    headache: 0,
    bloating: 0,
    fatigue: 0,
    mood: null,
    spotting: false,
  },
  notes: '',
};

export function useCycleData() {
  const [dayEntries, setDayEntries] = useState(() => getInitialData().dayEntries);

  // Persist to localStorage whenever dayEntries changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dayEntries }));
    } catch {
      // storage full or unavailable — silent fail
    }
  }, [dayEntries]);

  // Derive cycles from entries
  const cycles = useMemo(() => syncCyclesToEntries(dayEntries), [dayEntries]);

  // Compute averages
  const avgCycleLength = useMemo(() => calculateAverageCycleLength(cycles), [cycles]);
  const avgPeriodLength = useMemo(() => calculateAveragePeriodLength(cycles), [cycles]);

  // Predict next period
  const prediction = useMemo(
    () => predictNextPeriod(cycles, avgCycleLength, avgPeriodLength),
    [cycles, avgCycleLength, avgPeriodLength]
  );

  const getDayEntry = useCallback(
    (dateStr) => {
      const entry = dayEntries[dateStr];
      if (!entry) return { date: dateStr, ...EMPTY_ENTRY };
      return {
        date: dateStr,
        ...EMPTY_ENTRY,
        ...entry,
        symptoms: { ...EMPTY_ENTRY.symptoms, ...(entry.symptoms || {}) },
      };
    },
    [dayEntries]
  );

  const upsertDayEntry = useCallback((dateStr, partial) => {
    setDayEntries((prev) => {
      const existing = prev[dateStr] || { date: dateStr, ...EMPTY_ENTRY };
      const updated = {
        ...existing,
        ...partial,
        symptoms: {
          ...(existing.symptoms || EMPTY_ENTRY.symptoms),
          ...(partial.symptoms || {}),
        },
      };
      // If entry is completely empty, remove it
      const isEmpty =
        updated.periodStatus === null &&
        updated.notes === '' &&
        !updated.symptoms.spotting &&
        updated.symptoms.cramps === 0 &&
        updated.symptoms.headache === 0 &&
        updated.symptoms.bloating === 0 &&
        updated.symptoms.fatigue === 0 &&
        updated.symptoms.mood === null;

      if (isEmpty) {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      }

      return { ...prev, [dateStr]: updated };
    });
  }, []);

  const deleteDayEntry = useCallback((dateStr) => {
    setDayEntries((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  }, []);

  const getPhase = useCallback(
    (dateStr) => {
      // User-logged period days always show menstrual
      const entry = dayEntries[dateStr];
      if (entry && entry.periodStatus) return 'menstrual';
      return getPhaseForDate(dateStr, cycles, avgCycleLength, avgPeriodLength);
    },
    [dayEntries, cycles, avgCycleLength, avgPeriodLength]
  );

  const isPredicted = useCallback(
    (dateStr) => {
      // Don't show as predicted if user already logged it
      const entry = dayEntries[dateStr];
      if (entry && entry.periodStatus) return false;
      return isInPredictedWindow(dateStr, prediction);
    },
    [dayEntries, prediction]
  );

  return {
    dayEntries,
    cycles,
    avgCycleLength,
    avgPeriodLength,
    prediction,
    getDayEntry,
    upsertDayEntry,
    deleteDayEntry,
    getPhase,
    isPredicted,
  };
}
