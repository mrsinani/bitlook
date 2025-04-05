declare module "react-gauge-chart" {
  import { ComponentType } from "react";

  export interface GaugeChartProps {
    id: string;
    className?: string;
    style?: React.CSSProperties;
    nrOfLevels?: number;
    percent?: number;
    needleColor?: string;
    needleBaseColor?: string;
    colors?: string[];
    arcWidth?: number;
    arcPadding?: number;
    cornerRadius?: number;
    arcLabels?: string[];
    hideText?: boolean;
    textColor?: string;
    formatTextValue?: (value: number) => string;
    fontSize?: string;
    animate?: boolean;
    animDelay?: number;
    animateDuration?: number;
  }

  const GaugeChart: ComponentType<GaugeChartProps>;
  export default GaugeChart;
}
