export function ResponsiveTable({ children, className = "" }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto -mx-px">{children}</div>
    </div>
  );
}
