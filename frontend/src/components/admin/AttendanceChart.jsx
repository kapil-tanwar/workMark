import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AttendanceChart({ data }) {
  return (
    <div className="h-56 sm:h-64 lg:h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          <Bar dataKey="Present" fill="oklch(0.62 0.16 155)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Absent" fill="oklch(0.58 0.22 27)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Leave" fill="oklch(0.65 0.14 230)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
