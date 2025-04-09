import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickSeries,
} from "lightweight-charts";
import type { Klines } from "@/lib/types/trade";
type Bar = {
  high: number;
  low: number;
  open: number;
  close: number;
};

export class ChartManager {
  private candle_series: ISeriesApi<"Candlestick">;
  private last_update_time: number = 0;
  private chart: IChartApi;
  private current_bar: Partial<Bar> = {
    high: undefined,
    close: undefined,
    open: undefined,
    low: undefined,
  };

  constructor(
    ref: HTMLElement,
    initial_data: Klines,
    layout: { bg_color: string; color: string },
  ) {
    const chart = createChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      grid: {
        horzLines: {
          visible: true,
        },
        vertLines: {
          visible: true,
        },
      },
      layout: {
        background: {
          color: layout.bg_color,
          type: ColorType.Solid,
        },
        textColor: "white",
      },
    });
    this.chart = chart;
    this.candle_series = chart.addSeries(CandlestickSeries, {
      upColor: "#475569",
      downColor: "#94a3b8",
      borderVisible: false,
      wickUpColor: "#475569",
      wickDownColor: "#94a3b8",
    });

    let candle_series_data = initial_data.map((d) => {
      return {
        high: d.high,
        low: d.low,
        open: d.open,
        close: d.close,
        time: (new Date(d.bucket).getTime() / 1000) as UTCTimestamp,
      };
    });

    candle_series_data = candle_series_data.sort((a, b) => a.time - b.time);

    this.candle_series.setData(candle_series_data);
  }

  public update(
    updated_data: { new_candle_initiated: boolean; time: number } & Bar,
  ) {
    if (!this.last_update_time) {
      this.last_update_time = new Date().getTime();
    }

    this.candle_series.update({
      time: (this.last_update_time / 1000) as UTCTimestamp,
      close: updated_data.close,
      low: updated_data.low,
      high: updated_data.high,
      open: updated_data.open,
    });

    if (updated_data.new_candle_initiated)
      this.last_update_time = updated_data.time;
  }

  public destroy() {
    this.chart.remove();
  }
}
