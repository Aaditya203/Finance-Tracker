"use client";

import React, { useState, useRef, useMemo } from "react";
import { Calendar, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ScriptableContext,
  ActiveElement,
} from "chart.js";
import { Line, getElementAtEvent } from "react-chartjs-2";
import { useTheme } from "@/components/providers/theme-provider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const fullMonthNames: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

const defaultMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatAmount = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const formatShortCurrency = (val: number) => {
  if (val === 0) return "0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val}`;
};

const formatAxisCurrency = (val: number) => {
  if (val === 0) return "0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    const thousands = val / 1000;
    return `₹${Number(thousands.toFixed(thousands < 10 ? 1 : 0))}k`;
  }
  return `₹${val}`;
};

const getChartToken = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

export function SpendingChart({
  monthlyData,
}: {
  monthlyData?: { month: string; amount: number; count?: number }[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartAccent = getChartToken("--chart-accent", isDark ? "#ff2f6b" : "#fa5d00");
  const chartAxis = getChartToken("--chart-axis", isDark ? "#85858f" : "#8e8b87");
  const chartGrid = getChartToken("--chart-grid", isDark ? "rgba(255,255,255,0.08)" : "rgba(117,109,100,0.22)");
  const chartFillStart = getChartToken("--chart-fill-start", isDark ? "rgba(255,47,107,0.26)" : "rgba(250,93,0,0.2)");
  const chartFillMid = getChartToken("--chart-fill-mid", isDark ? "rgba(255,47,107,0.07)" : "rgba(250,93,0,0.06)");
  const chartTooltipSurface = getChartToken("--chart-tooltip-surface", isDark ? "#1c1c22" : "#ffffff");
  const chartTooltipText = getChartToken("--chart-tooltip-text", isDark ? "#f5f5f7" : "#1d1e1c");
  const chartTooltipBorder = getChartToken("--chart-tooltip-border", isDark ? "#383840" : "#e3d6c5");
  const chartFontFamily = typeof window === "undefined"
    ? "Arial, sans-serif"
    : getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
  // Use real data from DB; fall back to empty months only if nothing is passed
  const data = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return defaultMonths.map((month) => ({ month, amount: 0, count: 0 }));
    }
    // If fewer than 12 months provided, ensure full 12-month calendar mapping
    if (monthlyData.length < 12) {
      const map = new Map(monthlyData.map((d) => [d.month, d]));
      return defaultMonths.map((m) => map.get(m) || { month: m, amount: 0, count: 0 });
    }
    return monthlyData;
  }, [monthlyData]);

  // Compute stats dynamically from REAL data
  const totalAnnualSpent = useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [data]);

  const peakItem = useMemo(() => {
    return data.reduce(
      (max, item) => (item.amount > max.amount ? item : max),
      data[0] || { month: "Jan", amount: 0, count: 0 }
    );
  }, [data]);

  // Determine initial active index: latest month with actual spending > 0 or current month
  const initialIndex = useMemo(() => {
    const reversedIndex = [...data].reverse().findIndex((d) => d.amount > 0);
    if (reversedIndex !== -1) {
      return data.length - 1 - reversedIndex;
    }
    const currentMonthIdx = new Date().getMonth();
    return Math.min(currentMonthIdx, data.length - 1);
  }, [data]);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const active = selectedMonth !== null ? selectedMonth : initialIndex;
  const setActive = setSelectedMonth;

  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const activeItem = data[active] ?? data[0];
  const activeMonthFull = fullMonthNames[activeItem.month] ?? activeItem.month;

  // Real month-over-month percentage change calculation
  const prevMonthItem = active > 0 ? data[active - 1] : null;
  const percentageChange = useMemo(() => {
    if (!prevMonthItem || prevMonthItem.amount === 0) {
      return activeItem.amount > 0 ? 100 : 0;
    }
    const diff = activeItem.amount - prevMonthItem.amount;
    return Math.round((diff / prevMonthItem.amount) * 100);
  }, [activeItem.amount, prevMonthItem]);

  const activePercentOfTotal = useMemo(() => {
    if (totalAnnualSpent === 0) return 0;
    return Math.round((activeItem.amount / totalAnnualSpent) * 100);
  }, [activeItem.amount, totalAnnualSpent]);

  // Prepare Chart.js dataset with Harvest Orange theme matching app design
  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          data: data.map((d) => d.amount),
          borderColor: chartAccent,
          borderWidth: 2.5,
          tension: 0.38, // Smooth spline curve from reference image
          fill: true,
          backgroundColor: (context: ScriptableContext<"line">) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return chartFillStart;
            }
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, chartFillStart);
            gradient.addColorStop(0.55, chartFillMid);
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            return gradient;
          },
          // Highlight active/selected month dot (prominent dot from reference image)
          pointRadius: (ctx: ScriptableContext<"line">) => {
            return ctx.dataIndex === active ? 6 : 0;
          },
          pointHoverRadius: 7,
          pointBackgroundColor: chartAccent,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2.5,
          pointHoverBackgroundColor: chartAccent,
          pointHoverBorderColor: "#ffffff",
          pointHoverBorderWidth: 3,
        },
      ],
    };
  }, [data, active, chartAccent, chartFillStart, chartFillMid]);

  const maxVal = Math.max(...data.map((d) => d.amount), 0);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 240,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: chartTooltipSurface,
        titleColor: chartTooltipText,
        titleFont: {
          family: chartFontFamily,
          size: 13,
          weight: "bold",
        },
        bodyColor: chartTooltipText,
        bodyFont: {
          family: chartFontFamily,
          size: 12,
          weight: "normal",
        },
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        padding: {
          top: 10,
          bottom: 10,
          left: 12,
          right: 14,
        },
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 9,
        boxHeight: 9,
        boxPadding: 6,
        usePointStyle: false,
        callbacks: {
          title: (tooltipItems) => {
            const label = tooltipItems[0]?.label ?? "";
            return `${fullMonthNames[label] ?? label} 2026`;
          },
          labelColor: () => ({
            borderColor: chartAccent,
            backgroundColor: chartAccent,
            borderRadius: 2,
          }),
          label: (context) => {
            const val = context.raw as number;
            return ` monthly_expenses    ${formatAmount(val)}`;
          },
          afterLabel: (context) => {
            const idx = context.dataIndex;
            const count = data[idx]?.count;
            if (count && count > 0) {
              return ` ${count} transaction${count > 1 ? "s" : ""} recorded`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: (context) => (context.index === active ? chartAccent : chartAxis),
          font: (context) => ({
            family: chartFontFamily,
            size: 11,
            weight: context.index === active ? 700 : 500,
          }),
          padding: 8,
        },
      },
      y: {
        position: "right", // Right-aligned Y-axis matching reference image
        beginAtZero: true,
        suggestedMax: maxVal > 0 ? maxVal * 1.15 : 30000,
        grid: {
          color: chartGrid,
        },
        border: {
          display: false,
        },
        ticks: {
          color: chartAxis,
          font: {
            family: chartFontFamily,
            size: 11,
            weight: 500,
          },
          padding: 10,
          callback: (value) => formatAxisCurrency(Number(value)),
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        setActive(elements[0].index);
      }
    },
  };

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartRef.current) return;
    const elements: ActiveElement[] = getElementAtEvent(
      chartRef.current,
      event
    );
    if (elements.length > 0) {
      setActive(elements[0].index);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-xl bg-[var(--chart-surface)] border border-[var(--color-parchment-shadow)] p-5 sm:p-7 shadow-sm space-y-5 text-[var(--color-ink-black)]">
      {/* Background ambient warm glow */}
      <div className="absolute -top-24 right-0 w-80 h-80 bg-[var(--chart-accent)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-0 w-64 h-64 bg-[var(--color-marigold-glow)]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--chart-accent)] shadow-[0_0_8px_var(--chart-glow)]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink-black)]">
              Spending Trends
            </h2>
            {peakItem.amount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chart-accent)]/10 border border-[var(--chart-accent)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--chart-accent)]">
                <Sparkles className="h-3 w-3 text-[var(--chart-accent)]" /> Peak: {peakItem.month} ({formatShortCurrency(peakItem.amount)})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-warm-stone)]">
            Monthly shared spending trajectory across 2026
          </p>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-warm-stone)]">
            <span>Total YTD:</span>
            <span className="font-bold text-[var(--color-ink-black)]">
              {formatAmount(totalAnnualSpent)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--color-warm-stone)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--chart-accent)]" />
            <span className="font-semibold text-[var(--color-ink-black)]">2026</span>
          </div>
        </div>
      </div>

      {/* Dynamic Contextual Selected Info Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--chart-panel)] border border-[var(--color-parchment-shadow)] rounded-xl px-4 py-3 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--chart-accent)] shadow-[0_0_6px_var(--chart-glow)]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-black)]">
                {activeMonthFull} 2026
              </span>
              {activeItem.count !== undefined && activeItem.count > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--chart-surface)] border border-[var(--color-parchment-shadow)] text-[var(--color-warm-stone)] font-medium">
                  {activeItem.count} {activeItem.count === 1 ? "txn" : "txns"}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[var(--color-driftwood)]">
              Click any month below to inspect details
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {percentageChange !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                percentageChange >= 0
                  ? "bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)] border border-[var(--color-harvest-flame)]/20"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-[var(--color-success)] dark:border-emerald-900"
              }`}
            >
              {percentageChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`}
              {prevMonthItem && <span className="text-[10px] opacity-75 font-normal">vs {prevMonthItem.month}</span>}
            </span>
          )}

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink-black)] font-sans tabular-nums">
              {formatAmount(activeItem.amount)}
            </div>
            {totalAnnualSpent > 0 && (
              <span className="text-[10px] text-[var(--color-driftwood)]">
                {activePercentOfTotal}% of 2026 spend
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Responsive Chart Container */}
      <div className="relative z-10 w-full h-64 sm:h-72 pt-1">
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
          onClick={handleChartClick}
        />
      </div>
    </div>
  );
}
