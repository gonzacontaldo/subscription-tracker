import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "../theme/colors";

export type DonutChartSegment = {
  label: string;
  value: number;
  color: string;
};

interface DonutChartProps {
  data: DonutChartSegment[];
  total: number;
  size?: number;
  innerLabel?: string;
  innerValue?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  total,
  size = 220,
  innerLabel,
  innerValue,
}) => {
  const svgMarkup = React.useMemo(() => {
    if (!total || total <= 0 || !data.length) {
      const radius = size / 2;
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${colors.card}" stroke="${colors.muted}" stroke-width="2" />
          <circle cx="${radius}" cy="${radius}" r="${radius * 0.6}" fill="${colors.background}" />
        </svg>
      `;
    }

    const center = size / 2;
    const radius = center - 1;
    const innerRadius = radius * 0.6;

    let cursor = 0;
    const paths = data
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const startAngle = (cursor / total) * 360;
        const endAngle = ((cursor + segment.value) / total) * 360;
        cursor += segment.value;

        if (endAngle - startAngle <= 0) return "";

        const path = describeArc(center, center, radius, startAngle, endAngle);
        return `<path d="${path}" fill="${segment.color}" stroke="${colors.background}" stroke-width="1.5" />`;
      })
      .join("\n");

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${colors.card}" />
        ${paths}
        <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${colors.background}" />
      </svg>
    `;
  }, [data, total, size]);

  const source = React.useMemo(
    () => ({
      uri: `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`,
    }),
    [svgMarkup]
  );

  return (
    <View style={{ width: size, height: size }}>
      <Image style={{ width: size, height: size }} source={source} cachePolicy="none" />
      {(innerLabel || innerValue) && (
        <View style={styles.centerLabel} pointerEvents="none">
          {innerLabel ? <Text style={styles.centerLabelText}>{innerLabel}</Text> : null}
          {innerValue ? <Text style={styles.centerValueText}>{innerValue}</Text> : null}
        </View>
      )}
    </View>
  );
};

export default DonutChart;

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep <= 180 ? "0" : "1";

  return [
    `M ${x} ${y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

const styles = StyleSheet.create({
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  centerLabelText: {
    fontFamily: "PoppinsRegular",
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 2,
  },
  centerValueText: {
    fontFamily: "PoppinsBold",
    color: colors.text,
    fontSize: 18,
  },
});

