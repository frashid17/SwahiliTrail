import Link from "next/link";
import { Card } from "@/components/ui/card";
import { COAST_IMAGES } from "@/lib/data/coast-images";

const tiles = [
  {
    href: "/explore?region=mara",
    title: "Safari country",
    line: "Mara · Tsavo · Amboseli",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=75",
    span: "large" as const,
  },
  {
    href: "/explore?region=nairobi",
    title: "Nairobi & highlands",
    line: "City base · parks · nights out",
    image:
      "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1400&q=75",
    span: "wide" as const,
  },
  {
    href: "/explore?region=mombasa",
    title: "Swahili coast",
    line: "Diani · Old Town · sunsets",
    image: COAST_IMAGES.nyaliBeach,
    span: "half" as const,
  },
  {
    href: "/explore?region=nakuru",
    title: "Rift Valley",
    line: "Lakes · Hell’s Gate",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=75",
    span: "half" as const,
  },
];

export function TrailGallery() {
  const [large, wide, halfA, halfB] = tiles;

  return (
    <section className="w-full py-8 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8 xl:px-16">
        <div className="mb-8 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            Destinations
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Where will the trail take you?
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link href={large.href} className="block h-full min-h-[22rem]">
            <Card className="group relative h-full overflow-hidden rounded-2xl border-none p-0 after:absolute after:h-full after:w-full after:bg-linear-to-b after:from-transparent after:from-60% after:to-gray-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={large.image}
                alt={large.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-0 z-10 flex flex-col gap-1 ps-8 pb-8">
                <h3 className="text-2xl font-semibold text-white">{large.title}</h3>
                <p className="text-sm text-white/80">{large.line}</p>
              </div>
            </Card>
          </Link>

          <div className="grid grid-rows-2 gap-6">
            <Link href={wide.href}>
              <Card className="group relative min-h-[10.5rem] overflow-hidden rounded-2xl border-none p-0 after:absolute after:h-full after:w-full after:bg-linear-to-b after:from-transparent after:from-40% after:to-gray-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wide.image}
                  alt={wide.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 z-10 flex flex-col gap-1 ps-8 pb-8">
                  <h3 className="text-xl font-semibold text-white">{wide.title}</h3>
                  <p className="text-white/80">{wide.line}</p>
                </div>
              </Card>
            </Link>

            <div className="grid grid-cols-2 gap-6">
              {[halfA, halfB].map((tile) => (
                <Link key={tile.href} href={tile.href}>
                  <Card className="group relative min-h-[10.5rem] overflow-hidden rounded-2xl border-none p-0 after:absolute after:h-full after:w-full after:bg-linear-to-b after:from-transparent after:from-40% after:to-gray-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.image}
                      alt={tile.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 z-10 flex flex-col gap-1 ps-6 pb-6">
                      <h3 className="text-lg font-semibold text-white">
                        {tile.title}
                      </h3>
                      <p className="text-sm text-white/80">{tile.line}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
