export function getTodayDate() {
  return new Date().toLocaleDateString("en-CA");
}

export function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toKilograms(weight, unit = "kg") {
  if (!weight) return 0;
  return unit === "lb" ? weight * 0.45359237 : weight;
}

export function formatWeight(weightKg) {
  return `${weightKg.toFixed(1)} kg`;
}

export function normalizeWeightEntry(entry) {
  return {
    ...entry,
    id: entry.id || createEntryId(),
    date: entry.date || getTodayDate(),
    weight: Number(entry.weight),
    unit: entry.unit || "kg",
    notes: entry.notes?.trim() ?? ""
  };
}

export function normalizeEntries(entries = []) {
  return entries.map((entry) => normalizeWeightEntry(entry));
}

export function sortEntriesNewestFirst(entries) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestEntry(entries) {
  return sortEntriesNewestFirst(entries)[0] ?? null;
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function calculateIdealWeightRange(heightCm) {
  if (!heightCm) {
    return {
      min: 0,
      max: 0,
      minLabel: "--",
      maxLabel: "--",
      label: "--"
    };
  }

  const heightM = heightCm / 100;
  const min = 18.5 * heightM * heightM;
  const max = 24.9 * heightM * heightM;

  return {
    min,
    max,
    minLabel: `${min.toFixed(1)} kg`,
    maxLabel: `${max.toFixed(1)} kg`,
    label: `${min.toFixed(1)}-${max.toFixed(1)} kg`
  };
}

export function formatChangeLabel(delta) {
  if (delta === null || delta === undefined) return "--";
  if (delta === 0) return "0.0 kg";
  return `${delta.toFixed(1)} kg`;
}
