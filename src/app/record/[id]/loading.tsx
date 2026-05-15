export default function RecordHubLoading() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-4 h-4 w-56 animate-pulse rounded-full bg-white/10" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/5] animate-pulse bg-white/5" />
              <div className="space-y-3 p-6">
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="h-8 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="h-16 w-full animate-pulse rounded-2xl bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
