import { useEffect, useMemo, useState } from "react";
import { LineChart } from "./components/LineChart";
import { sampleEntries, sampleProfile } from "./data/sampleEntries";
import {
  calculateBMI,
  calculateIdealWeightRange,
  formatChangeLabel,
  formatWeight,
  getLatestEntry,
  getTodayDate,
  normalizeEntries,
  normalizeWeightEntry,
  sortEntriesNewestFirst,
  toKilograms
} from "./lib/tracker";

const PROFILE_STORAGE_KEY = "weight-curve-profile-v2";
const ENTRIES_STORAGE_KEY = "weight-curve-entries-v2";

const defaultProfileState = {
  name: "",
  heightCm: "",
  targetWeightKg: "",
  dailyGoal: "maintain"
};

const defaultEntryState = {
  date: getTodayDate(),
  weight: "",
  unit: "kg",
  notes: ""
};

function SummaryCard({ label, value, detail, accent = "sun" }) {
  return (
    <article className={`summary-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function formatGoalLabel(goal) {
  const labels = {
    lose: "Lose weight",
    gain: "Gain weight",
    maintain: "Maintain"
  };

  return labels[goal] ?? "Maintain";
}

export default function App() {
  const [profile, setProfile] = useState(() => {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return sampleProfile;
      }
    }

    return sampleProfile;
  });

  const [entries, setEntries] = useState(() => {
    const stored = window.localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (stored) {
      try {
        return normalizeEntries(JSON.parse(stored));
      } catch {
        return sampleEntries;
      }
    }

    return sampleEntries;
  });

  const [profileForm, setProfileForm] = useState(() => ({
    ...defaultProfileState,
    ...profile,
    heightCm: profile.heightCm ? String(profile.heightCm) : "",
    targetWeightKg: profile.targetWeightKg ? String(profile.targetWeightKg) : ""
  }));
  const [entryForm, setEntryForm] = useState(defaultEntryState);
  const [editingEntryId, setEditingEntryId] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const sortedEntries = useMemo(() => sortEntriesNewestFirst(entries), [entries]);
  const latestEntry = useMemo(() => getLatestEntry(entries), [entries]);
  const latestWeightKg = latestEntry ? toKilograms(latestEntry.weight, latestEntry.unit) : 0;
  const bmi = calculateBMI(latestWeightKg, profile.heightCm);
  const idealRange = calculateIdealWeightRange(profile.heightCm);
  const isProfileComplete = Number(profile.heightCm) > 0;

  const targetDelta = profile.targetWeightKg
    ? latestWeightKg - Number(profile.targetWeightKg)
    : null;

  const idealDelta = latestWeightKg
    ? latestWeightKg < idealRange.min
      ? idealRange.min - latestWeightKg
      : latestWeightKg > idealRange.max
        ? latestWeightKg - idealRange.max
        : 0
    : null;

  const chartData = useMemo(() => {
    const chronological = [...entries]
      .map((entry) => ({
        ...entry,
        weightKg: toKilograms(entry.weight, entry.unit)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      dates: chronological.map((entry) => entry.date),
      values: chronological.map((entry) => entry.weightKg)
    };
  }, [entries]);

  const startWeight = chartData.values[0] ?? 0;
  const progressDelta = latestWeightKg && startWeight ? latestWeightKg - startWeight : 0;
  const averageWeight = chartData.values.length
    ? chartData.values.reduce((sum, value) => sum + value, 0) / chartData.values.length
    : 0;

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function handleEntryChange(event) {
    const { name, value } = event.target;
    setEntryForm((current) => ({ ...current, [name]: value }));
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    setProfile({
      name: profileForm.name.trim(),
      heightCm: Number(profileForm.heightCm),
      targetWeightKg: profileForm.targetWeightKg ? Number(profileForm.targetWeightKg) : "",
      dailyGoal: profileForm.dailyGoal
    });
  }

  function handleEntrySubmit(event) {
    event.preventDefault();

    const nextEntry = normalizeWeightEntry({
      id: editingEntryId,
      ...entryForm,
      weight: Number(entryForm.weight)
    });

    setEntries((current) =>
      editingEntryId
        ? current.map((entry) => (entry.id === editingEntryId ? nextEntry : entry))
        : [...current, nextEntry]
    );
    resetEntryForm();
  }

  function handleEditEntry(entry) {
    setEditingEntryId(entry.id);
    setEntryForm({
      date: entry.date,
      weight: String(entry.weight),
      unit: entry.unit,
      notes: entry.notes || ""
    });
  }

  function handleDeleteEntry(entryId) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (editingEntryId === entryId) {
      resetEntryForm();
    }
  }

  function resetEntryForm() {
    setEditingEntryId(null);
    setEntryForm({
      ...defaultEntryState,
      date: getTodayDate()
    });
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Weight curve companion</p>
          <h1>Track daily weight, understand BMI, and see the road to your ideal range.</h1>
          <p className="hero-text">
            Built for mobile and web, this app asks for the key inputs it needs:
            your height, your target weight, and your daily weight entries.
          </p>
          <div className="hero-pills" aria-label="App highlights">
            <span>Daily logging</span>
            <span>BMI insights</span>
            <span>Healthy weight range</span>
            <span>Responsive charts</span>
          </div>
        </div>

        <div className="hero-spotlight">
          <span className="highlight-label">Current snapshot</span>
          <div className="spotlight-value">
            <strong>{latestWeightKg ? formatWeight(latestWeightKg) : "--"}</strong>
            <span>latest recorded weight</span>
          </div>
          <div className="spotlight-grid">
            <div>
              <strong>{bmi ? bmi.toFixed(1) : "--"}</strong>
              <span>Current BMI</span>
            </div>
            <div>
              <strong>{idealRange.label}</strong>
              <span>Ideal range</span>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel dual-panel">
          <div>
            <div className="section-heading">
              <div>
                <p className="section-kicker">User inputs</p>
                <h2>Personal profile</h2>
              </div>
              <p className="section-copy">
                Enter the values the app needs to calculate BMI, healthy weight band,
                and how much to gain or reduce.
              </p>
            </div>

            <form className="entry-form" onSubmit={handleProfileSubmit}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  placeholder="Example: Ankita"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                />
              </label>
              <label>
                Height (cm)
                <input
                  type="number"
                  name="heightCm"
                  min="50"
                  step="0.1"
                  placeholder="Example: 165"
                  value={profileForm.heightCm}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Target weight (kg)
                <input
                  type="number"
                  name="targetWeightKg"
                  min="20"
                  step="0.1"
                  placeholder="Example: 62"
                  value={profileForm.targetWeightKg}
                  onChange={handleProfileChange}
                />
              </label>
              <label>
                Goal
                <select
                  name="dailyGoal"
                  value={profileForm.dailyGoal}
                  onChange={handleProfileChange}
                >
                  <option value="lose">Lose weight</option>
                  <option value="maintain">Maintain</option>
                  <option value="gain">Gain weight</option>
                </select>
              </label>
              <button type="submit" className="primary-button">
                Save profile
              </button>
            </form>
          </div>

          <div>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Daily entry</p>
                <h2>Log today&apos;s weight</h2>
              </div>
              <p className="section-copy">
                Add a new reading in kilograms or pounds and the app updates the curve
                instantly.
              </p>
            </div>

            <form className="entry-form" onSubmit={handleEntrySubmit}>
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  value={entryForm.date}
                  onChange={handleEntryChange}
                  required
                />
              </label>
              <label>
                Weight
                <input
                  type="number"
                  name="weight"
                  min="1"
                  step="0.1"
                  placeholder="Example: 72.4"
                  value={entryForm.weight}
                  onChange={handleEntryChange}
                  required
                />
              </label>
              <label>
                Unit
                <select name="unit" value={entryForm.unit} onChange={handleEntryChange}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </label>
              <label>
                Notes
                <input
                  type="text"
                  name="notes"
                  placeholder="Morning, post-workout, before dinner..."
                  value={entryForm.notes}
                  onChange={handleEntryChange}
                />
              </label>
              <button type="submit" className="primary-button">
                {editingEntryId ? "Save changes" : "Add weight entry"}
              </button>
              {editingEntryId ? (
                <button type="button" className="secondary-button" onClick={resetEntryForm}>
                  Cancel edit
                </button>
              ) : null}
            </form>
          </div>
        </section>

        <section className="summary-grid" aria-label="Summary cards">
          <SummaryCard
            label="Latest weight"
            value={latestWeightKg ? formatWeight(latestWeightKg) : "--"}
            detail={latestEntry ? `Logged on ${latestEntry.date}` : "Add your first entry"}
            accent="sun"
          />
          <SummaryCard
            label="Current BMI"
            value={bmi ? bmi.toFixed(1) : "--"}
            detail={
              isProfileComplete
                ? "Calculated from latest weight and saved height"
                : "Add height to unlock BMI"
            }
            accent="ocean"
          />
          <SummaryCard
            label="Ideal weight range"
            value={idealRange.label}
            detail="Healthy BMI range from 18.5 to 24.9"
            accent="leaf"
          />
          <SummaryCard
            label="Change needed"
            value={formatChangeLabel(idealDelta)}
            detail="Weight to lose or gain to reach the ideal range"
            accent="berry"
          />
        </section>

        <section className="panel insights-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Progress insights</p>
              <h2>Weight guidance at a glance</h2>
            </div>
            <p className="section-copy">
              These cards combine your saved profile with your latest entry so the app
              can explain where you are now and what comes next.
            </p>
          </div>

          <div className="insight-grid">
            <article className="insight-card">
              <span className="insight-label">Healthy band</span>
              <h3>{idealRange.label}</h3>
              <p>
                Based on your height of {profile.heightCm || "--"} cm, your recommended
                range is between {idealRange.minLabel} and {idealRange.maxLabel}.
              </p>
            </article>
            <article className="insight-card">
              <span className="insight-label">Target status</span>
              <h3>
                {targetDelta === null
                  ? "No target yet"
                  : targetDelta > 0
                    ? `${targetDelta.toFixed(1)} kg above target`
                    : targetDelta < 0
                      ? `${Math.abs(targetDelta).toFixed(1)} kg below target`
                      : "Target achieved"}
              </h3>
              <p>
                Goal mode: {formatGoalLabel(profile.dailyGoal)}. Save a target weight if
                you want a more specific milestone than the healthy BMI range.
              </p>
            </article>
            <article className="insight-card">
              <span className="insight-label">Trend</span>
              <h3>
                {chartData.values.length > 1
                  ? `${progressDelta > 0 ? "+" : ""}${progressDelta.toFixed(1)} kg`
                  : "--"}
              </h3>
              <p>
                Average logged weight is {averageWeight ? `${averageWeight.toFixed(1)} kg` : "--"}.
                The app compares your latest weight against your first saved entry.
              </p>
            </article>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Weight curve</p>
              <h2>Daily graph</h2>
            </div>
            <p className="section-copy">
              A smooth visual curve makes it easier to spot direction, plateaus, and
              changes over time on both phone and desktop.
            </p>
          </div>

          <LineChart
            title={`${profile.name ? `${profile.name}'s` : "Your"} weight curve`}
            subtitle="All values are normalized to kilograms for comparison"
            values={chartData.values}
            dates={chartData.dates}
            targetRange={idealRange}
          />
        </section>

        <section className="panel table-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Entry history</p>
              <h2>Recent logs</h2>
            </div>
            <p className="section-copy">
              Keep a clear record of daily entries, their original unit, and any quick
              notes added by the user.
            </p>
          </div>

          {sortedEntries.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Normalized</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => {
                    const normalized = toKilograms(entry.weight, entry.unit);

                    return (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>
                          {entry.weight} {entry.unit}
                        </td>
                        <td>{formatWeight(normalized)}</td>
                        <td>{entry.notes || "-"}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() => handleEditEntry(entry)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="table-action-button danger-button"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-panel">
              No weight logs yet. Add your first entry above and the history will appear here.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
