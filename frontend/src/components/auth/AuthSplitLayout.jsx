import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthSplitLayout({ children, aside }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <main className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center items-center p-4 sm:p-6 bg-card relative shrink-0">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      {aside && (
        <aside className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-primary min-h-[320px]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative z-10 max-w-md p-8 xl:p-10 text-primary-foreground">{aside}</div>
        </aside>
      )}
    </div>
  );
}
