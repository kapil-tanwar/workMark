import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Scene3D } from "@/components/three/Scene3D";
import { BrandMark } from "@/components/BrandMark";

/** Always-dark cinematic panel used beside every auth form. Hosts the Three.js wave field. */
export function AuthStage({ className = "md:w-[52%]", eyebrow = "Workforce, simplified", headline, sub, stats = [] }) {
  return (
    <div className={`hidden md:flex ${className} relative overflow-hidden flex-col justify-between p-10 lg:p-14 bg-[#050807] text-white grain`}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-24 size-[34rem] rounded-full bg-[#0c8f6b]/30 blur-[130px]" />
        <div className="absolute -bottom-52 -right-20 size-[32rem] rounded-full bg-[#e9a23b]/14 blur-[140px]" />
      </div>
      <Scene3D variant="wave" stage className="opacity-90" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#050807] to-transparent pointer-events-none" />

      <Link to="/" className="relative z-10 inline-flex items-center gap-2.5 w-fit hover:opacity-90 transition-opacity">
        <span className="grid place-items-center size-9 rounded-[11px] bg-[#4fe0b0] text-[#04120d] shadow-[0_8px_28px_-8px_rgba(79,224,176,.6)]"><BrandMark className="size-[18px]" /></span>
        <span className="font-headline text-xl font-bold tracking-[-0.04em]">WorkMark</span>
      </Link>

      <div className="relative z-10 max-w-lg space-y-6">
        <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur text-[10.5px] font-mono uppercase tracking-[0.12em] text-white/70">
          <span className="live-dot size-1.5 rounded-full bg-[#4fe0b0]" />{eyebrow}
        </span>
        <h1 className="font-headline text-[2.4rem] xl:text-5xl font-bold leading-[1.04] tracking-[-0.045em]">{headline}</h1>
        {sub && <p className="text-[15px] leading-relaxed text-white/65 max-w-md">{sub}</p>}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
            {stats.map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#4fe0b0]">{label}</p>
                <p className="font-headline text-2xl font-bold tracking-[-0.04em] mt-1.5">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="relative z-10 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-white/40">
        <ShieldCheck className="size-3.5" /> Encrypted session · JWT secured
      </p>
    </div>
  );
}
