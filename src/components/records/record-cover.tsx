import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecordCoverProps {
  title?: string;
  label?: string;
  coverUrl?: string | null;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  showOverlay?: boolean;
}

export function RecordCover({
  title,
  label,
  coverUrl,
  priority = false,
  className,
  imageClassName,
  showOverlay = true,
}: RecordCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-abyss via-smoke to-carbon",
        className,
      )}
    >
      {coverUrl ? (
        coverUrl.startsWith("blob:") ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local en admin
          <img
            src={coverUrl}
            alt={title ? `Portada de ${title}` : "Portada del relato"}
            className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
          />
        ) : (
          <Image
            src={coverUrl}
            alt={title ? `Portada de ${title}` : "Portada del relato"}
            fill
            priority={priority}
            sizes="(max-width: 640px) 84vw, 320px"
            className={cn("object-cover", imageClassName)}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(92,26,46,0.45),transparent_55%)]" />
      )}
      {coverUrl ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      ) : null}
      {showOverlay && (label || title) ? (
        <div className="absolute inset-x-0 bottom-0 p-5">
          {label ? (
            <Badge variant="outline" className="border-white/10 bg-black/30 capitalize">
              {label}
            </Badge>
          ) : null}
          {title ? (
            <h3 className="mt-3 font-heading text-2xl font-medium text-bone sm:text-3xl">{title}</h3>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
