import Image from "next/image";
import { cn } from "@/lib/utils";

interface CharacterPortraitProps {
  name?: string;
  imageUrl?: string | null;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

export function CharacterPortrait({
  name,
  imageUrl,
  priority = false,
  className,
  imageClassName,
}: CharacterPortraitProps) {
  const alt = name ? `Retrato de ${name}` : "Retrato del personaje";

  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-abyss via-smoke to-carbon",
        className,
      )}
    >
      {imageUrl ? (
        imageUrl.startsWith("blob:") ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local en admin
          <img
            src={imageUrl}
            alt={alt}
            className={cn("absolute inset-0 h-full w-full object-cover object-top", imageClassName)}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 80vw, 240px"
            className={cn("object-cover object-top", imageClassName)}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(92,26,46,0.35),transparent_55%)]" />
      )}
      {imageUrl ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
