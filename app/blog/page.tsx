import type { Metadata } from "next"
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from "@/components/landing/Footer"
import BlogCard from "@/components/blog-card"
import { OfflineBanner } from "@/components/network-status"
import { getAllPosts, formatDate, calculateReadingTime, extractExcerpt, type WordPressPost } from "@/lib/wordpress"
import { Suspense } from "react"
import { defaultSEO } from "@/config/seo"

export const dynamic = 'force-static'
export const revalidate = 600 // 10 minutes

export const metadata: Metadata = {
  title: "Blog - FlipAEO | GEO & AI Content Strategy Insights",
  description:
    "Expert insights on Generative Engine Optimization (GEO), AI search visibility, content strategy, and how to get cited by AI search engines like ChatGPT and Perplexity.",
  robots: "index, follow",
  openGraph: {
    title: "Blog - FlipAEO | GEO & AI Content Strategy Insights",
    description: "Expert insights on Generative Engine Optimization, AI search visibility, and content strategy. Learn how to get cited by AI search engines.",
    type: "website",
    url: `${defaultSEO.siteUrl}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - FlipAEO | GEO & AI Content Strategy Insights",
    description: "Expert insights on Generative Engine Optimization, AI search visibility, and content strategy. Learn how to get cited by AI search engines.",
  },
}

// Transform WordPress post to blog card format
function transformWordPressPost(post: WordPressPost, index: number) {
  return {
    title: post.title,
    excerpt: post.excerpt ? extractExcerpt(post.excerpt, 160) : extractExcerpt(post.content, 160),
    slug: post.slug,
    publishedAt: formatDate(post.date),
    readTime: calculateReadingTime(post.content),
    category: post.categories.nodes[0]?.name || "General",
    image: post.featuredImage?.node?.sourceUrl || "/placeholder.svg?height=400&width=600&text=Blog+Post",
    featured: index === 0, // First post is featured
    author: post.author.node.name,
  }
}



async function BlogContent() {
  try {
    const { posts } = await getAllPosts(20) // Fetch 20 posts
    const blogPosts = posts.map(transformWordPressPost)

    return (
      <BlogPageContent blogPosts={blogPosts} />
    )
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    // Fallback to empty state
    return (
      <BlogPageContent blogPosts={[]} />
    )
  }
}

function BlogPageContent({ blogPosts }: { blogPosts: any[] }) {
  return (
    <div className="landing-page min-h-screen w-full flex flex-col overflow-x-hidden font-sans">
      <Navbar />

      <main className="flex-grow flex flex-col items-center w-full pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-brand-orange text-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-6 transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-bold text-xs uppercase tracking-widest">Blog</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">
              GEO & Content Strategy Insights
            </h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Expert insights on Generative Engine Optimization, AI search visibility, and how to create authority-building content that AI search engines cite.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-20 w-full">
          {/* Offline Banner */}
          <OfflineBanner />

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <BlogCard
                  key={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  slug={post.slug}
                  publishedAt={post.publishedAt}
                  readTime={post.readTime}
                  category={post.category}
                  image={post.image}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No blog posts available at the moment.</p>
                <p className="text-gray-400 text-sm mt-2">Please check your internet connection and try again.</p>
              </div>
            )}
          </div>

          {/* Load More Button - Only show if more than 8 posts */}
          {blogPosts.length > 8 && (
            <div className="text-center mt-12">
              <button className="cursor-pointer h-14 px-8 text-lg font-bold bg-brand-yellow text-black border-2 border-black hover:bg-brand-orange rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase">
                Load More Posts
              </button>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="landing-page min-h-screen w-full flex flex-col overflow-x-hidden font-sans">
        <Navbar />
        <main className="flex-grow flex flex-col items-center w-full pt-20 md:pt-24">
          <section className="w-full py-16 px-4">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-block bg-brand-orange text-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-6 transform -rotate-2">
                <span className="font-display font-bold text-xs uppercase tracking-widest">Blog</span>
              </div>
              <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">
                GEO & Content Strategy Insights
              </h1>
              <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                Loading latest articles...
              </p>
            </div>
          </section>
          <div className="max-w-7xl mx-auto px-4 pb-20 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <BlogContent />
    </Suspense>
  )
}