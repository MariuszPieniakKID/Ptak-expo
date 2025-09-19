import {memo} from "react";
import {Gauge, gaugeClasses} from "@mui/x-charts/Gauge";
import styles from "./Chart.module.css";

type T_Chart = {
  value: number;
  valueMax: number;
};

const Chart = ({value, valueMax}: T_Chart) => {
  return (
    <div className={styles.cardDarkChart}>
      <div className={styles.cardDarkChartValueContent}>
        <div
          className={styles.cardDarkChartValue}
          dangerouslySetInnerHTML={{
            __html: `15<span> / 50</span>`,
          }}
        ></div>
        <div className={styles.cardDarkChartDescription}>Zaproszeń</div>
      </div>
      <Gauge
        width={120}
        height={120}
        value={value}
        valueMax={valueMax}
        cornerRadius="50%"
        sx={(theme) => ({
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 16,
            display: "none",
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: "#6F87F6",
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: theme.palette.text.disabled,
          },
        })}
      />
    </div>
  );
};

export default memo(Chart);
