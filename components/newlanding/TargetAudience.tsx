'use client';

const categories = [
  {
    title: "Home Decor & Furniture",
    desc: "Mid-century chairs, vintage rugs, planters.",
  },
  {
    title: "Tech & Desk Setup",
    desc: "Keycaps, leather sleeves, mousepads.",
  },
  {
    title: "Wedding & Event",
    desc: "Velvet ring boxes, wax seals, acrylic signs.",
  },
  {
    title: "Stationery",
    desc: "Leather journals, planners, fountain pens.",
  },
  {
    title: "Wall Art & Prints",
    desc: "Typography posters, watercolor art, framed pieces.",
  },
  {
    title: "Apparel & POD",
    desc: "Streetwear hoodies, tote bags, sneakers.",
  },
  {
    title: "Handmade Ceramics",
    desc: "Artisan mugs, wabi-sabi plates, matcha bowls.",
  },
  {
    title: "Jewelry & Accessories",
    desc: "Signet rings, nameplate necklaces, watches.",
  },
  {
    title: "Kids & Nursery",
    desc: "Montessori blocks, baby clothes, pacifiers.",
  },
  {
    title: "Premium Pet Gear",
    desc: "Leather collars, ceramic bowls, cat beds.",
  }
];

export default function TargetAudience() {
  return (
    <section className="w-full relative z-10 font-sans">
      <div className="w-full max-w-[1400px] mx-auto relative">

        {/* Header Section */}
        <div className="py-12 px-6 md:px-12 text-center">
          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[#111] mb-8 max-w-5xl mx-auto">
            Built for brands that sell physical products.
          </h2>
          <p className="text-[1.1rem] md:text-[1.2rem] text-[#555] font-normal tracking-tight max-w-2xl mx-auto leading-[1.6]">
            From handmade ceramics to premium pet gear, EcomPin understands the unique visual language and scale of your niche. No generic setups—just highly calibrated aesthetic formatting.
          </p>
        </div>

        {/* Grid Section - using gap for perfect 1px inner borders without duplicating outer edges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[1px] bg-[rgba(55,50,47,0.12)] border-t border-[rgba(55,50,47,0.12)]">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-[#F9F8F7] p-6 lg:p-8 hover:bg-[#FAFAFA] transition-colors duration-300 flex flex-col h-full min-h-[220px] group cursor-default"
            >
              <span className="font-mono text-[10px] text-[#A0A0A0] group-hover:text-[#111] transition-colors block mb-auto">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div className="mt-12">
                <h3 className="font-serif text-[1.25rem] md:text-[1.35rem] text-[#111] leading-[1.2] mb-2 tracking-tight">
                  {cat.title}
                </h3>
                <p className="text-[#666] text-[0.85rem] md:text-[0.9rem] leading-[1.4] tracking-tight">
                  {cat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
