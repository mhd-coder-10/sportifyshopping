import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToProducts = () => {
    document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 h-full">
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-[70vh] md:min-h-[80vh] py-12">
          {/* Content */}
          <div className="relative z-10 text-center md:text-left">
            <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold mb-6">
              NEW COLLECTION 2026
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl text-white leading-none mb-6 tracking-tight">
              PUSH YOUR
              <span className="block text-gradient">LIMITS</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-md mx-auto md:mx-0 mb-8">
              Discover premium sports gear designed to elevate your performance and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-accent text-white border-0 text-lg px-8 py-6 hover:opacity-90 transition-opacity"
                onClick={() => navigate("/new-arrivals")}
              >
                SHOP NOW
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={scrollToProducts}
              >
                VIEW CATALOG
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden md:block">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
                alt="Featured Sports Shoe"
                className="w-full max-w-lg mx-auto drop-shadow-2xl transform rotate-[-15deg] hover:rotate-[-10deg] transition-transform duration-500"
              />
            </div>
            {/* Price Tag */}
            <div className="absolute top-10 right-10 bg-white rounded-2xl p-4 shadow-2xl">
              <span className="text-sm text-muted-foreground">Starting at</span>
              <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>₹4,999</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
