export default function RecordReadLoading() {
  return (
    <div className="reader-dark min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)]">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-48 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="h-1 bg-white/5" />
      </div>

      <article className="mx-auto max-w-3xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 sm:pb-32 sm:pt-28">
        <header className="mb-10 space-y-4 sm:mb-12">
          <div className="h-12 w-full max-w-xl animate-pulse rounded-2xl bg-white/10" />
          <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
        </header>

        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-4 animate-pulse rounded-full bg-white/5"
              style={{ width: `${88 - (index % 3) * 12}%` }}
            />
          ))}
        </div>
      </article>
    </div>
  );
}
