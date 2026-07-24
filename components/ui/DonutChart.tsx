// DonutChart: a lightweight ring chart built on react-native-svg.
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  track = 'rgba(120,120,120,0.15)',
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  track?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const center = size / 2;

  let offset = 0;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const dash = `${len} ${circ - len}`;
          const el = (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              fill="none"
              rotation={-90}
              origin={`${center}, ${center}`}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      {children}
    </View>
  );
}
