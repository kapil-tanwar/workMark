export function PageLoader({
  text = "Loading your workspace...",
  subtitle = "Please wait a moment",
}) {
  return (
    <div className="app-loader-container">
      <div className="app-loader-content">
        {/* Brand Icon Enclosure */}
        <div className="app-loader-enclosure">
          <div className="app-loader-box">
            {/* Briefcase Icon */}
            <svg
              className="app-loader-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              <rect width="20" height="14" x="2" y="6" rx="2" />
            </svg>
            {/* Star Sparkle Badge */}
            <div className="app-loader-badge">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="rgba(255,255,255,0.2)"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Title */}
        <h2 className="app-loader-title">WorkFlow HR</h2>

        {/* Status */}
        <p className="app-loader-status">{text}</p>

        {/* Indeterminate Progress Bar */}
        <div className="app-loader-bar">
          <div className="app-loader-bar-fill" />
        </div>

        {/* Subtitle */}
        {subtitle && <span className="app-loader-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

export default PageLoader;
