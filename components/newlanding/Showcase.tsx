import Image from 'next/image';

export default function Showcase() {
  return (
    <section id="showcase" className="w-full flex flex-col items-center">
      <div className="text-center mb-16 px-6">
        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[#111] mb-2">
          From catalog to lifestyle.
        </h2>
        <p className="text-[1.1rem] text-[#555] font-normal tracking-tight">
          Instantly place your products in context. High-end photography, without the photographer.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 border-y border-[rgba(55,50,47,0.12)] bg-[#FAFAFA]">
        {/* Before */}
        <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-[rgba(55,50,47,0.12)] min-h-[500px] md:min-h-[700px]">
          <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
            <Image
              src="/product.webp"
              alt="Raw Product"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-6 left-6 z-20">
              <span className="font-mono text-[10px] text-[#111] bg-white/90 backdrop-blur-md px-3 py-1.5 border border-[rgba(55,50,47,0.06)] uppercase tracking-widest">Input / Raw Product Photo</span>
            </div>
          </div>
        </div>

        {/* After */}
        <div className="relative flex flex-col min-h-[500px] md:min-h-[700px]">
          <div className="relative flex-1 w-full h-full bg-white overflow-hidden group grid grid-cols-2 grid-rows-2">
            <div className="relative w-full h-full aspect-[2/3]">
              <Image
                src="/basket1.webp"
                alt="Basket Life Style Scene variations"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative w-full h-full aspect-[2/3]">
              <Image
                src="/basket2.webp"
                alt="Basket Life Style Scene variations"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative w-full h-full aspect-[2/3]">
              <Image
                src="/basket3.webp"
                alt="Basket Life Style Scene variations"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative w-full h-full aspect-[2/3]">
              <Image
                src="/basket4.webp"
                alt="Basket Life Style Scene variations"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Pinterest Overlay Elements to show it's a Pin */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-10 w-full h-full col-span-2 row-span-2"></div>

            <div className="absolute top-6 left-6 z-20 flex gap-2">
              <span className="font-mono text-[10px] text-[#111] bg-white/90 backdrop-blur-md px-3 py-1.5 border border-[rgba(55,50,47,0.06)] uppercase tracking-widest">Output / Generated Scene</span>

            </div>

            <div className="absolute bottom-6 right-6 flex items-end z-20 pointer-events-none">
              <div className="w-10 h-10 bg-[#E60023] text-white flex items-center justify-center shadow-lg rounded-full">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.366 18.604 0 12.017 0z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
