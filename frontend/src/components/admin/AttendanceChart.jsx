import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";

/* Colors match the MD3 reference:
   Present → tertiary  (#004f35 forest green)
   Absent  → error/destructive (#ba1a1a red)
   Leave   → primary (#0037b0 deep blue)
   These are hardcoded hex so they stay consistent regardless of CSS var resolution issues in SVG context.
*/
const LIGHT_COLORS = { Present: "#00513a", Absent: "#ba1a1a", Leave: "#0037b0" };
const DARK_COLORS  = { Present: "#4edea3", Absent: "#ef4444", Leave: "#6d9fff" };

export function AttendanceChart({ data }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  const axisColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          barGap={3}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 4 }}
            contentStyle={{
              background: isDark ? "#1e2030" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: "10px 14px",
            }}
            labelStyle={{ fontWeight: 700, marginBottom: 4 }}
          />
          <Bar dataKey="Present" name="Present" fill={C.Present} radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="Absent"  name="Absent"  fill={C.Absent}  radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="Leave"   name="Leave"   fill={C.Leave}   radius={[4, 4, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
