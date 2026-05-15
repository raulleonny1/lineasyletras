import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  variant?: "icon" | "hero" | "footer";
  priority?: boolean;
}

export function BrandMark({
  className,
  variant = "icon",
  priority = false,
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        variant === "icon" &&
          "h-11 w-11 rounded-full border border-white/10 bg-black/30 shadow-[0_0_28px_rgba(92,26,46,0.22)]",
        variant === "hero" &&
          "w-full max-w-[19rem] rounded-[1.75rem] border border-white/10 bg-black/25 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:max-w-[22rem]",
        variant === "footer" &&
          "h-14 w-14 rounded-xl border border-white/10 bg-black/25",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="Archivum Noctis"
        width={512}
        height={384}
        priority={priority || variant === "hero"}
        className={cn(
          "h-full w-full",
          variant === "icon" &&
            "scale-[1.35] object-cover object-[center_44%]",
          variant === "hero" && "rounded-[1.35rem] object-cover",
          variant === "footer" &&
            "scale-[1.35] object-cover object-[center_44%]",
        )}
      />
    </div>
  );
}
