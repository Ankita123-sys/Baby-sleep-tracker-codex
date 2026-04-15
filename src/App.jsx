import { useEffect, useState } from "react";
import { LineChart } from "./components/LineChart";
import { sampleEntries } from "./data/sampleEntries";
import {
  EVENT_CONFIG,
  buildSummary,
  buildTrendSeries,
  formatEventName,
  getTodayDate,
  sortEntriesNewestFirst
} from "./lib/tracker";

const STORAGE_KEY = "baby-tracker-entries";

const defaultFormState = {
  date: getTodayDate(),
  time: "09:00",
  eventType: "feeding",
  quantity: "",
  unit: EVENT_CONFIG.feeding[0],
  notes: ""
};

function SummaryCard({ label, value, detail }) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function App() {
  const [entries, setEntries] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return sampleEntries;
      }
    }

    return sampleEntries;
  });
  const [formState, setFormState] = useState(defaultFormState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const today = getTodayDate();
  const summary = buildSummary(entries, today);
  const trends = buildTrendSeries(entries, today);
  const recentEntries = sortEntriesNewestFirst(entries).slice(0, 12);

  function handleEventTypeChange(nextType) {
    setFormState((current) => ({
      ...current,
      eventType: nextType,
      unit: EVENT_CONFIG[nextType][0]
    }));
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "eventType") {
      handleEventTypeChange(value);
      return;
    }

    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextEntry = {
      ...formState,
      quantity: Number(formState.quantity)
    };

    setEntries((current) => [...current, nextEntry]);
    setFormState({
      ...defaultFormState,
      date: getTodayDate()
    });
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Daily care dashboard</p>
          <h1>Baby tracker for feeds, sleep, diapers, solids, medicine, and growth.</h1>
          <p className="hero-text">
            Capture moments as they happen and keep a calm, visual view of the last 7
            days.
          </p>
        </div>
        <div className="hero-highlight">
          <span className="highlight-label">Today at a glance</span>
          <div className="highlight-stat">
            <strong>{summary.sleepHours.toFixed(1)}h</strong>
            <span>sleep tracked</span>
          </div>
          <div className="highlight-stat">
            <strong>{summary.feedsCount}</strong>
            <span>feeds logged</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel entry-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Core feature 1</p>
              <h2>Add daily entry</h2>
            </div>
            <p className="section-copy">
              Log breastfeeding, formula, sleep, diapers, solids, medicine, weight, and
              milestones in one place.
            </p>
          </div>

          <form className="entry-form" onSubmit={handleSubmit}>
            <label>
              Date
              <input type="date" name="date" value={formState.date} onChange={handleChange} required />
            </label>
            <label>
              Time
              <input type="time" name="time" value={formState.time} onChange={handleChange} required />
            </label>
            <label>
              Event type
              <select
                name="eventType"
                value={formState.eventType}
                onChange={handleChange}
                required
              >
                {Object.keys(EVENT_CONFIG).map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {formatEventName(eventType)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity / duration
              <input
                type="number"
                name="quantity"
                min="0"
                step="0.1"
                placeholder="Example: 120 or 1.5"
                value={formState.quantity}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Unit
              <select name="unit" value={formState.unit} onChange={handleChange} required>
                {EVENT_CONFIG[formState.eventType].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Notes
              <textarea
                name="notes"
                rows="3"
                placeholder="Breastfed on left side, strong latch, new puree, vitamin D drops, milestone note..."
                value={formState.notes}
                onChange={handleChange}
              />
            </label>
            <button type="submit" className="primary-button">
              Add entry
            </button>
          </form>
        </section>

        <section className="summary-grid" aria-label="Dashboard summary cards">
          <SummaryCard
            label="Total feeds today"
            value={summary.feedsCount}
            detail={`${summary.feedVolumeMl} ml tracked`}
          />
          <SummaryCard
            label="Total sleep hours"
            value={`${summary.sleepHours.toFixed(1)}h`}
            detail="Across all naps and overnight sleep"
          />
          <SummaryCard
            label="Diaper count"
            value={summary.diaperCount}
            detail={`${summary.poopCount} poop events`}
          />
          <SummaryCard
            label="Solids given"
            value={summary.solidsCount}
            detail={`${summary.medicineCount} medicine / vitamin events`}
          />
        </section>

        <section className="charts-panel panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Core features 2 and 3</p>
              <h2>Dashboard trends</h2>
            </div>
            <p className="section-copy">
              Visual summaries for the last seven days to spot patterns quickly.
            </p>
          </div>

          <div className="chart-grid">
            <LineChart
              title="Sleep trend"
              subtitle="Hours per day"
              values={trends.sleep}
              dates={trends.dates}
              color="#84b6a3"
            />
            <LineChart
              title="Feed frequency"
              subtitle="Feeding events per day"
              values={trends.feeds}
              dates={trends.dates}
              color="#d8734d"
            />
            <LineChart
              title="Poop count trend"
              subtitle="Poop diaper events per day"
              values={trends.poop}
              dates={trends.dates}
              color="#e4b85d"
            />
          </div>
        </section>

        <section className="panel table-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Recent history</p>
              <h2>Latest entries</h2>
            </div>
            <p className="section-copy">
              A simple rolling log of today&apos;s and recent care events.
            </p>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Quantity / Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry, index) => (
                  <tr key={`${entry.date}-${entry.time}-${entry.eventType}-${index}`}>
                    <td>{entry.date}</td>
                    <td>{entry.time}</td>
                    <td>
                      <span className="pill">{formatEventName(entry.eventType)}</span>
                    </td>
                    <td>
                      {entry.quantity} {entry.unit}
                    </td>
                    <td>{entry.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
