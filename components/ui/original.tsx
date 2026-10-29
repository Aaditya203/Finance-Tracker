"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface SwitchModeProps {
  width?: number;
  height?: number;
  darkColor?: string;
  lightColor?: string;
  knobDarkColor?: string;
  knobLightColor?: string;
  borderDarkColor?: string;
  borderLightColor?: string;
  className?: string;
}

export function SwitchMode({
  width = 64,
  height = 32,
  darkColor = "#111111",
  lightColor = "#FFFFFF",
  knobDarkColor = "#1C1C1C",
  knobLightColor = "#F3F3F7",
  borderDarkColor = "#333333",
  borderLightColor = "#E3D6C5",
  className,
}: SwitchModeProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const inset = 3;
  const knobSize = Math.max(18, height - inset * 2);
  const travel = Math.max(0, width - knobSize - inset * 2);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-harvest-flame)] transition-all",
        className
      )}
      style={{
        width,
        height,
        padding: inset,
        backgroundColor: isDark ? darkColor : lightColor,
        border: `1px solid ${isDark ? borderDarkColor : borderLightColor}`,
        borderRadius: height / 2,
        transition: "background-color 180ms ease, border-color 180ms ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          width: knobSize,
          height: knobSize,
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${isDark ? travel : 0}px)`,
          borderRadius: "50%",
          backgroundColor: isDark ? knobDarkColor : knobLightColor,
          color: isDark ? "#F9F9F9" : "#444444",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
          transition: "transform 180ms ease, background-color 180ms ease",
        }}
      >
        {isDark ? <Moon size={Math.max(14, Math.round(knobSize * 0.58))} /> : <Sun size={Math.max(14, Math.round(knobSize * 0.58))} />}
      </span>
    </button>
  );
}
