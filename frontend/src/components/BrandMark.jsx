import { cn } from "@/lib/utils";

/** WorkMark glyph — a check-mark drawn as a rising "tick" on a stacked bar. */
export function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={cn("size-5", className)} aria-hidden="true">
      <path d="M4 12.5 9 17.5 20 6.5" />
      <path d="M4 20.5h10" opacity=".55" />
    </svg>
  );
}

export function BrandLockup({ className, markClass, textClass, sub }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className={cn("btn-glow grid place-items-center size-8 rounded-[10px] shrink-0", markClass)}>
        <BrandMark className="size-[17px]" />
      </span>
      <span className="leading-none">
        <span className={cn("block font-headline text-[17px] font-bold tracking-[-0.04em]", textClass)}>WorkMark</span>
        {sub && <span className="eyebrow !text-[9.5px] mt-1.5 block">{sub}</span>}
      </span>
    </span>
  );
}
