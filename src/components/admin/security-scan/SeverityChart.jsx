"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SEVERITY_COLORS = {
  ERROR: "#f87171", // red-400
  WARNING: "#fbbf24", // amber-400
  INFO: "#60a5fa", // blue-400
};

const IMPACT_COLORS = {
  HIGH: "#f43f5e", // rose-500
  MEDIUM: "#f97316", // orange-500
  LOW: "#06b6d4", // cyan-500
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
        <div className="font-semibold text-slate-200">{data.name}</div>
        <div className="text-slate-400 mt-0.5">
          Count: <strong className="text-white">{data.value}</strong> ({((data.value / (data.payload.total || 1)) * 100).toFixed(1)}%)
        </div>
      </div>
    );
  }
  return null;
};

export default function SeverityChart({ severityData = [], impactData = [], onSelectFilter }) {
  const totalSeverity = severityData.reduce((acc, curr) => acc + curr.value, 0);
  const totalImpact = impactData.reduce((acc, curr) => acc + curr.value, 0);

  const enrichedSeverity = severityData.map((d) => ({ ...d, total: totalSeverity }));
  const enrichedImpact = impactData.map((d) => ({ ...d, total: totalImpact }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Findings by Severity Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-100">Findings by Severity</h3>
            <p className="text-xs text-slate-400">Semgrep rule severity classifications</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {totalSeverity} Total
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enrichedSeverity}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                onClick={(entry) => onSelectFilter && onSelectFilter({ type: "severity", value: entry.name })}
                className="cursor-pointer focus:outline-none"
              >
                {enrichedSeverity.map((entry, index) => (
                  <Cell
                    key={`sev-cell-${index}`}
                    fill={SEVERITY_COLORS[entry.name] || "#94a3b8"}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings by Impact Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-100">Findings by Security Impact</h3>
            <p className="text-xs text-slate-400">Potential damage level if exploited</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {totalImpact} Total
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enrichedImpact}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                onClick={(entry) => onSelectFilter && onSelectFilter({ type: "impact", value: entry.name })}
                className="cursor-pointer focus:outline-none"
              >
                {enrichedImpact.map((entry, index) => (
                  <Cell
                    key={`imp-cell-${index}`}
                    fill={IMPACT_COLORS[entry.name] || "#94a3b8"}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
