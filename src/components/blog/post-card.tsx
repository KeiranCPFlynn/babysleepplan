import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blog'
import { formatUniversalDate } from '@/lib/date-format'

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden card-hover">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-5">
          <h2 className="font-semibold text-lg text-slate-900 line-clamp-2 mb-2 group-hover:text-sky-700 transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-slate-500 line-clamp-3 mb-3">
            {post.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <time dateTime={post.date}>
              {formatUniversalDate(post.date)}
            </time>
            <span>&middot;</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
