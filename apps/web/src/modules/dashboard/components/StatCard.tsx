import React from "react";
import { Card } from "@open-urbis/map-ui";
import { IconType } from "react-icons";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: IconType;
  color?: "primary" | "success" | "warning" | "destructive" | "muted";
}

const colorMap: Record<string, string> = {
  primary: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  destructive: "text-red-500",
  muted: "text-muted-foreground",
};

const bgMap: Record<string, string> = {
  primary: "bg-primary/10",
  success: "bg-emerald-500/10",
  warning: "bg-amber-500/10",
  destructive: "bg-red-500/10",
  muted: "bg-muted",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = "primary",
}: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-4 border border-border bg-card">
      {Icon && (
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${bgMap[color]}`}
        >
          <Icon className={`w-5 h-5 ${colorMap[color]}`} />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </span>
        <span className="text-2xl font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>
    </Card>
  );
}
