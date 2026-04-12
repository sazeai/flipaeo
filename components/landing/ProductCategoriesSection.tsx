import React from 'react';
import { 
  Lamp, 
  Monitor, 
  Gift, 
  PenTool, 
  Image as ImageIcon, 
  Shirt, 
  Coffee, 
  Gem, 
  Baby, 
  Dog 
} from 'lucide-react';

const CATEGORIES = [
  {
    title: "Home Decor & Furniture",
    icon: Lamp,
    examples: "Mid-century chairs, vintage rugs, planters.",
  },
  {
    title: "Tech & Desk Setup",
    icon: Monitor,
    examples: "Keycaps, leather sleeves, mousepads.",
  },
  {
    title: "Wedding & Event",
    icon: Gift,
    examples: "Velvet ring boxes, wax seals, acrylic signs.",
  },
  {
    title: "Stationery",
    icon: PenTool,
    examples: "Leather journals, planners, fountain pens.",
  },
  {
    title: "Wall Art & Prints",
    icon: ImageIcon,
    examples: "Typography posters, watercolor art, framed pieces.",
  },
  {
    title: "Apparel & POD",
    icon: Shirt,
    examples: "Streetwear hoodies, tote bags, sneakers.",
  },
  {
    title: "Handmade Ceramics",
    icon: Coffee,
    examples: "Artisan mugs, wabi-sabi plates, matcha bowls.",
  },
  {
    title: "Jewelry & Accessories",
    icon: Gem,
    examples: "Signet rings, nameplate necklaces, watches.",
  },
  {
    title: "Kids & Nursery",
    icon: Baby,
    examples: "Montessori blocks, baby clothes, pacifiers.",
  },
  {
    title: "Premium Pet Gear",
    icon: Dog,
    examples: "Leather collars, ceramic bowls, cat beds.",
  }
];

export default function ProductCategoriesSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden z-20 bg-stone-50/50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand-600 font-semibold mb-6">
            Your Niche, Understood
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight leading-[1.1] mb-6">
            Built for brands that sell <span className="text-brand-600 italic">physical</span> products.
          </h2>
          <p className="font-sans text-lg text-stone-500 leading-relaxed max-w-2xl mx-auto">
            From handmade ceramics to premium pet gear, PinLoop understands the unique visual language and scale of your niche.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={index}
                className="group relative flex flex-col bg-stone-50/40 p-6 rounded-[24px] shadow-[inset_0_0_0_1px_#e7e5e4] hover:shadow-[inset_0_0_0_1px_#c4b5fd] hover:bg-white transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-50/0 to-brand-50/0 group-hover:from-brand-50/50 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 text-stone-600 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors duration-300 mb-6">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="font-serif text-xl tracking-tight text-stone-900 group-hover:text-brand-600 transition-colors mb-3">
                    {category.title}
                  </h3>
                  
                  {/* Animated hairline divider */}
                  <div className="h-px w-8 bg-stone-200 group-hover:bg-brand-200 group-hover:w-full transition-all duration-500 mb-4" />
                  
                  <p className="font-sans text-sm text-stone-500 leading-relaxed">
                    {category.examples}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
