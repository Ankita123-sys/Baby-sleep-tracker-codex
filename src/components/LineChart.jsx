function createChartGeometry(values) {
  const width = 340;
  const height = 260;
  const padding = { top: 20, right: 14, bottom: 40, left: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...values, 1);
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : innerWidth;

  const points = values.map((value, index) => {
    const x = padding.left + index * stepX;
    const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${
    points[0].x
  } ${height - padding.bottom} Z`;

  return { width, height, padding, innerHeight, maxValue, points, linePath, areaPath };
}

export function LineChart({ title, subtitle, values, dates, color }) {
  if (!values.length) {
    return (
      <article className="chart-card">
        <div className="chart-header">
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
        <div className="empty-state">No data for this chart yet.</div>
      </article>
    );
  }

  const { width, height, padding, innerHeight, maxValue, points, linePath, areaPath } =
    createChartGeometry(values);
  const gridLines = 4;

  return (
    <article className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="chart">
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          {Array.from({ length: gridLines + 1 }, (_, index) => {
            const y = padding.top + (innerHeight / gridLines) * index;
            const value = (maxValue - (maxValue / gridLines) * index)
              .toFixed(1)
              .replace(/\.0$/, "");

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
                  y={y - 6}
                  textAnchor="end"
                  className="chart-value-label"
                >
                  {value}
                </text>
              </g>
            );
          })}
          <path d={areaPath} className="chart-area" fill={color} />
          <path d={linePath} className="chart-line" stroke={color} />
          {points.map((point, index) => (
            <circle
              key={`point-${dates[index]}`}
              cx={point.x}
              cy={point.y}
              r="6"
              className="chart-dot"
              fill={color}
            />
          ))}
          {dates.map((date, index) => (
            <text
              key={`label-${date}`}
              x={points[index].x}
              y={height - 16}
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
