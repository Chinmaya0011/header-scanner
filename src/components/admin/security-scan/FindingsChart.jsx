"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const BAR_COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs max-w-xs">
        <div className="font-semibold text-slate-200 truncate">{label}</div>
        <div className="text-indigo-400 mt-1">
          Findings Count: <strong className="text-white">{payload[0].value}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function FindingsChart({ categoryData = [], fileData = [], owaspData = [], onSelectFilter }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Findings by Vulnerability Class */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Findings by Vulnerability Class</h3>
            <p className="text-xs text-slate-400">Distribution of security flaw types</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                width={140}
                tickFormatter={(val) => (val.length > 20 ? `${val.slice(0, 18)}...` : val)}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(entry) => onSelectFilter && onSelectFilter({ type: "category", value: entry.name })}
                className="cursor-pointer"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cat-bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Files with Findings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Most Affected Files</h3>
            <p className="text-xs text-slate-400">Files with highest concentration of findings</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fileData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="shortName"
                stroke="#94a3b8"
                fontSize={11}
                width={150}
                tickFormatter={(val) => (val.length > 22 ? `...${val.slice(-20)}` : val)}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(entry) => onSelectFilter && onSelectFilter({ type: "file", value: entry.fullName })}
                className="cursor-pointer"
              >
                {fileData.map((entry, index) => (
                  <Cell key={`file-bar-${index}`} fill={BAR_COLORS[(index + 3) % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
