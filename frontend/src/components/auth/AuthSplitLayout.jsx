import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthSplitLayout({ children, aside }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <main className="w-full lg:w-[500px] xl:w-[540px] flex flex-col justify-center items-center p-5 sm:p-8 bg-card relative shrink-0 lg:border-r lg:border-border">
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      {aside && (
        <aside className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden min-h-[320px] bg-[#0a0b12] text-white">
          {/* aurora */}
          <div aria-hidden="true" className="absolute -top-40 -right-24 size-[38rem] rounded-full bg-[#4b4df0]/45 blur-[120px]" />
          <div aria-hidden="true" className="absolute -bottom-48 -left-24 size-[34rem] rounded-full bg-[#7c5cff]/30 blur-[130px]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "radial-gradient(ellipse at center, #000 25%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, #000 25%, transparent 78%)",
            }}
          />
          <div className="relative z-10 max-w-md p-8 xl:p-10 text-white">{aside}</div>
        </aside>
      )}
    </div>
  );
}
