import { CinematicHero } from "@/components/hero/cinematic-hero";
import { RecordCarousel } from "@/components/records/record-carousel";
import { listCarouselNovels } from "@/lib/data/records";
export default async function HomePage() {
  const novels = await listCarouselNovels();

  return (
    <>
      <CinematicHero />
      <RecordCarousel novels={novels} />
    </>
  );
}
