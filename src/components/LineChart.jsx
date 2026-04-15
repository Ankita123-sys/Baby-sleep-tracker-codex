function createChartGeometry(values, targetRange) {
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 52, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const rangeMin = targetRange?.min || Math.min(...values);
  const rangeMax = targetRange?.max || Math.max(...values);
  const minValue = Math.min(...values, rangeMin) - 1;
  const maxValue = Math.max(...values, rangeMax) + 1;
  const valueSpan = maxValue - minValue || 1;
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : innerWidth;

  const points = values.map((value, index) => {
    const x = padding.left + index * stepX;
    const y = padding.top + innerHeight - ((value - minValue) / valueSpan) * innerHeight;
    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${
    points[0].x
  } ${height - padding.bottom} Z`;

  const targetBand = targetRange?.min
    ? {
        y1:
          padding.top +
          innerHeight -
          ((targetRange.max - minValue) / valueSpan) * innerHeight,
        y2:
          padding.top +
          innerHeight -
          ((targetRange.min - minValue) / valueSpan) * innerHeight
      }
    : null;

  return {
    width,
    height,
    padding,
    innerHeight,
    minValue,
    maxValue,
    points,
    linePath,
    areaPath,
    targetBand
  };
}

export function LineChart({ title, subtitle, values, dates, targetRange }) {
  if (!values.length) {
    return (
      <article className="chart-card">
        <div className="chart-header">
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
        <div className="empty-state">Add a few entries to see your weight curve.</div>
      </article>
    );
  }

  const {
    width,
    height,
    padding,
    innerHeight,
    minValue,
    maxValue,
    points,
    linePath,
    areaPath,
    targetBand
  } = createChartGeometry(values, targetRange);
  const gridLines = 4;

  return (
    <article className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="chart">
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          {targetBand ? (
            <rect
              x={padding.left}
              y={targetBand.y1}
              width={width - padding.left - padding.right}
              height={targetBand.y2 - targetBand.y1}
              className="chart-target-band"
            />
          ) : null}
          {Array.from({ length: gridLines + 1 }, (_, index) => {
            const y = padding.top + (innerHeight / gridLines) * index;
            const value = (maxValue - ((maxValue - minValue) / gridLines) * index).toFixed(1);

            return (
              <g key={`grid-${index}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  className="chart-gridline"
                />
                <text
                  x={width - padding.right}
                  y={y - 8}
                  textAnchor="end"
                  className="chart-value-label"
                >
                  {value} kg
                </text>
              </g>
            );
          })}
          <path d={areaPath} className="chart-area" />
          <path d={linePath} className="chart-line" />
          {points.map((point, index) => (
            <circle key={`point-${dates[index]}`} cx={point.x} cy={point.y} r="6" className="chart-dot" />
          ))}
          {dates.map((date, index) => (
            <text
              key={`label-${date}`}
              x={points[index].x}
              y={height - 18}
              textAnchor="middle"
              className="chart-axis-label"
            >
              {date.slice(5)}
            </text>
          ))}
        </svg>
      </div>
    </article>
  );
}
