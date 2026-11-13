export function ResponsiveTable({ children, className = "" }) {
  return (
    <div className={`surface overflow-hidden ${className}`}>
      <div className="overflow-x-auto table-scroll -mx-px">{children}</div>
    </div>
  );
}
