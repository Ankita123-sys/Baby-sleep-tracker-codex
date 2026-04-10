export const EVENT_CONFIG = {
  feeding: ["ml", "minutes", "oz"],
  sleep: ["hours", "minutes"],
  diaper: ["count"],
  solids: ["servings", "tbsp", "oz"],
  medicine: ["ml", "drops", "doses"],
  weight: ["kg", "lb", "milestone"]
};

export function getTodayDate() {
  return new Date().toLocaleDateString("en-CA");
}

export function formatEventName(eventType) {
  const labels = {
    feeding: "Feeding",
    sleep: "Sleep",
    diaper: "Diaper / Poop",
    solids: "Solids Introduced",
    medicine: "Medicine / Vitamin Drops",
    weight: "Weight / Growth Milestone"
  };

  return labels[eventType] ?? eventType;
}

export function parseSleepHours(entry) {
  if (entry.eventType !== "sleep") return 0;
  return entry.unit === "minutes" ? entry.quantity / 60 : entry.quantity;
}

export function isFeedEntry(entry) {
  return entry.eventType === "feeding";
}

export function getFeedVolumeMl(entry) {
  if (!isFeedEntry(entry)) return 0;
  if (entry.unit === "ml") return entry.quantity;
  if (entry.unit === "oz") return entry.quantity * 29.5735;
  return 0;
}

export function isPoopEntry(entry) {
  return entry.eventType === "diaper" && entry.notes.toLowerCase().includes("poop");
}

export function getLast7Days(today = getTodayDate()) {
  const base = new Date(`${today}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

export function sortEntriesNewestFirst(entries) {
  return [...entries].sort((a, b) => {
    const first = `${a.date}T${a.time}`;
    const second = `${b.date}T${b.time}`;
    return first < second ? 1 : -1;
  });
}

export function buildSummary(entries, today = getTodayDate()) {
  const todayEntries = entries.filter((entry) => entry.date === today);
  const feeds = todayEntries.filter(isFeedEntry);
  const sleepHours = todayEntries.reduce((sum, entry) => sum + parseSleepHours(entry), 0);
  const diapers = todayEntries.filter((entry) => entry.eventType === "diaper");
  const solids = todayEntries.filter((entry) => entry.eventType === "solids");
  const medicine = todayEntries.filter((entry) => entry.eventType === "medicine");
  const poopCount = todayEntries.filter(isPoopEntry).length;
  const totalFeedVolume = feeds.reduce((sum, entry) => sum + getFeedVolumeMl(entry), 0);

  return {
    feedsCount: feeds.length,
    feedVolumeMl: Math.round(totalFeedVolume),
    sleepHours,
    diaperCount: diapers.length,
    poopCount,
    solidsCount: solids.length,
    medicineCount: medicine.length
  };
}

export function buildTrendSeries(entries, today = getTodayDate()) {
  const dates = getLast7Days(today);
  const byDate = entries.reduce((map, entry) => {
    if (!map[entry.date]) map[entry.date] = [];
    map[entry.date].push(entry);
    return map;
  }, {});

  return {
    dates,
    sleep: dates.map((date) =>
      (byDate[date] || []).reduce((sum, entry) => sum + parseSleepHours(entry), 0)
    ),
    feeds: dates.map((date) => (byDate[date] || []).filter(isFeedEntry).length),
    poop: dates.map((date) => (byDate[date] || []).filter(isPoopEntry).length)
  };
}
