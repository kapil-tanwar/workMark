import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = {
  Present: "#16a34a",
  Absent: "#dc2626",
  Leave: "#2563eb",
};

export function AttendanceChart({ data }) {
  return (
    <div className="h-56 sm:h-64 lg:h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 11 }} interval={0} />
          <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="square"
            formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
          />
          <Bar dataKey="Present" name="Present" fill={COLORS.Present} radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="Absent" name="Absent" fill={COLORS.Absent} radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="Leave" name="Leave" fill={COLORS.Leave} radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
