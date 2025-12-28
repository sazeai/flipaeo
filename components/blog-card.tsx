import Link from "next/link"
import { cn } from "@/lib/utils"
import { Calendar, Clock, ArrowRight } from "lucide-react"

interface BlogCardProps {
  title: string
  excerpt: string
  slug: string
  publishedAt: string
  readTime: string
  category: string
  image: string
  featured?: boolean
}

export default function BlogCard({
  title,
  excerpt,
  slug,
  publishedAt,
  readTime,
  category,
  image,
  featured = false,
}: BlogCardProps) {
  return (
    <article className="group h-full">
      <Link href={`/blog/${slug}`} className="block h-full">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 h-full flex flex-col">
          {/* Image */}
          <div className="relative h-56 border-b-2 border-black overflow-hidden bg-gray-100">
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-brand-yellow text-black border-2 border-black px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider gap-4">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1.5" />
                <span>{publishedAt}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1.5" />
                <span>{readTime}</span>
              </div>
            </div>

            <h2 className="font-display font-black text-2xl text-black mb-3 uppercase leading-none group-hover:text-gray-700 transition-colors">
              {title}
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3 text-sm font-medium flex-grow">
              {excerpt}
            </p>

            <div className="pt-4 border-t-2 border-black/5 mt-auto">
              <div className="flex items-center text-black font-bold uppercase text-sm tracking-widest group-hover:text-brand-orange transition-colors">
                <span>Read Article</span>
                <ArrowRight className="w-4 h-4 ml-2 stroke-[3px] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}