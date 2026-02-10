import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  color: string;
  category: string;
}

const slides: SlideData[] = [
  {
    id: "2",
    title: "BASKETBALL",
    subtitle: "Court Ready Gear",
    description: "Elevate your game with premium basketballs and training equipment",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80",
    color: "from-orange-900/80 to-orange-600/60",
    category: "basketball"
  },
  {
    id: "3",
    title: "FOOTBALL",
    subtitle: "Match Day Ready",
    description: "Score big with top-quality footballs and training accessories",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80",
    color: "from-blue-900/80 to-blue-600/60",
    category: "football"
  },
  {
    id: "4",
    title: "FITNESS GEAR",
    subtitle: "Train Like a Pro",
    description: "Build strength with premium dumbbells, mats, and resistance equipment",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80",
    color: "from-purple-900/80 to-purple-600/60",
    category: "training"
  },
  {
    id: "5",
    title: "TENNIS ELITE",
    subtitle: "Championship Equipment",
    description: "Ace every match with professional rackets, balls, and accessories",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80",
    color: "from-yellow-900/80 to-yellow-600/60",
    category: "other"
  }
];

interface SportsSliderProps {
  onCategoryClick?: (category: string) => void;
}

const SportsSlider = ({ onCategoryClick }: SportsSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Auto-play
    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000);

    return () => {
      clearInterval(autoplay);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] min-w-0"
            >
              <div className="relative h-[50vh] md:h-[70vh] lg:h-[80vh] w-full">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}`} />
                
                {/* Content */}
                <div className="relative h-full container mx-auto px-4 flex items-center">
                  <div className="max-w-2xl text-white space-y-4 md:space-y-6">
                    <span className="inline-block text-sm md:text-base font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      {slide.subtitle}
                    </span>
                    <h2 
                      className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {slide.title}
                    </h2>
                    <p className="text-base md:text-xl text-white/90 max-w-lg">
                      {slide.description}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button 
                        size="lg"
                        className="bg-white text-foreground hover:bg-white/90 font-semibold px-8"
                        onClick={() => onCategoryClick?.(slide.category)}
                      >
                        Shop Now
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        className="border-white text-white hover:bg-white/20 font-semibold px-8"
                        onClick={() => onCategoryClick?.(slide.category)}
                      >
                        Explore Collection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hidden md:flex"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hidden md:flex"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? "w-8 bg-white" 
                : "w-2 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((selectedIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </section>
  );
};

export default SportsSlider;
