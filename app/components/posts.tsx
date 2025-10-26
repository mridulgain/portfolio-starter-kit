import Link from 'next/link'
import { formatDate, getBlogPosts } from 'app/blog/utils'

export function BlogPosts() {
  // sort once up-front
  let allBlogs = getBlogPosts().sort((a, b) =>
    new Date(b.metadata.publishedAt).getTime() -
    new Date(a.metadata.publishedAt).getTime()
  )

  return (
    <div>
      {allBlogs.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="block p-3 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          aria-label={`Read ${post.metadata.title}`}
        >
          <article className="w-full flex flex-col md:flex-row md:items-center">
            <time
              dateTime={post.metadata.publishedAt}
              className="text-neutral-600 dark:text-neutral-400 w-[100px] tabular-nums flex-shrink-0"
            >
              {formatDate(post.metadata.publishedAt, false)}
            </time>

            <div className="flex-1 ml-0 md:ml-4">
              <h3 className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post.metadata.title}
              </h3>

              {post.metadata.summary && (
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                  {post.metadata.summary}
                </p>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}
