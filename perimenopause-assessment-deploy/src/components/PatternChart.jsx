import { patternDescriptions } from '../data/recommendations.js';
import PatternRing from './PatternRing.jsx';

const orderedPatterns = ['A', 'B', 'C', 'D'];

function PatternChart({ patterns, primaryPattern }) {
  const data = orderedPatterns.map((key) => ({
    key,
    label: patternDescriptions[key].name,
    value: patterns[key],
    color: patternDescriptions[key].color,
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((entry) => (
        <PatternRing
          key={entry.key}
          patternId={entry.key}
          label={entry.label}
          value={entry.value}
          color={entry.color}
          active={entry.key === primaryPattern}
        />
      ))}
    </div>
  );
}

export default PatternChart;
