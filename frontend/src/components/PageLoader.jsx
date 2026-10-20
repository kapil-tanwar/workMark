import { BrandMark } from "@/components/BrandMark";

export function PageLoader({ text = "Loading your workspace…", subtitle = "Please wait a moment" }) {
  return (
    <div className="app-loader-container" role="status" aria-live="polite">
      <div className="app-loader-content">
        <div className="app-loader-mark"><BrandMark className="size-7" /></div>
        <h2 className="app-loader-title">WorkMark</h2>
        <p className="app-loader-status">{text}</p>
        <div className="app-loader-bar"><div className="app-loader-bar-fill" /></div>
        {subtitle && <span className="app-loader-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

export default PageLoader;
