import fs from 'fs'
import path from 'path'

type Metadata = {
  title: string
  publishedAt: string
  summary?: string
  image?: string
  [key: string]: any
}

export type Post = {
  metadata: Metadata
  slug: string
  content: string
}

function parseFrontmatter(fileContent: string) {
  // frontmatter block at top between --- ... ---
  let frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*/
  let match = frontmatterRegex.exec(fileContent)

  // defaults when no frontmatter present
  let metadata: Partial<Metadata> = {
    title: 'Untitled',
    publishedAt: new Date().toISOString(),
    summary: '',
  }
  let content = fileContent.trim()

  if (match) {
    let frontMatterBlock = match[1]
    content = fileContent.slice(match[0].length).trim()

    let frontMatterLines = frontMatterBlock.split(/\r?\n/).map((l) => l.trim())

    frontMatterLines.forEach((line) => {
      if (!line || !line.includes(':')) return
      // split only at first colon to allow ":" in values
      let idx = line.indexOf(':')
      let key = line.slice(0, idx).trim()
      let value = line.slice(idx + 1).trim()
      // remove surrounding single/double quotes
      value = value.replace(/^['"]|['"]$/g, '')
      if (key) {
        metadata[key as keyof Metadata] = value
      }
    })
  }

  return { metadata: metadata as Metadata, content }
}

function getMDXFiles(dir: string) {
  try {
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return ext === '.mdx' || ext === '.md'
      })
  } catch (err) {
    console.error('getMDXFiles error', err)
    return []
  }
}

function readMDXFile(filePath: string) {
  try {
    let rawContent = fs.readFileSync(filePath, 'utf-8')
    return parseFrontmatter(rawContent)
  } catch (err) {
    console.error('readMDXFile error', filePath, err)
    // return a minimal fallback so calling code doesn't crash
    return {
      metadata: {
        title: path.basename(filePath),
        publishedAt: new Date().toISOString(),
        summary: '',
      } as Metadata,
      content: '',
    }
  }
}

function getMDXData(dir: string) {
  let mdxFiles = getMDXFiles(dir)
  return mdxFiles.map((file) => {
    let { metadata, content } = readMDXFile(path.join(dir, file))
    let slug = path.basename(file, path.extname(file))

    return {
      metadata,
      slug,
      content,
    } as Post
  })
}

let cachedPosts: Post[] | null = null

export function getBlogPosts() {
  if (cachedPosts) return cachedPosts
  const posts = getMDXData(path.join(process.cwd(), 'app', 'blog', 'posts')).filter(Boolean)
  // sort descending by publishedAt safely
  posts.sort((a, b) => {
    const ta = new Date(a.metadata.publishedAt).getTime() || 0
    const tb = new Date(b.metadata.publishedAt).getTime() || 0
    return tb - ta
  })
  cachedPosts = posts
  return cachedPosts
}

export function formatDate(date: string, includeRelative = false) {
  if (!date) return ''
  // ensure ISO-ish string for Date parsing
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  let targetDate = new Date(date)
  if (isNaN(targetDate.getTime())) {
    return date
  }

  let now = Date.now()
  let diffMs = now - targetDate.getTime()
  let diffSeconds = Math.round(Math.abs(diffMs) / 1000)
  let diffMinutes = Math.round(diffSeconds / 60)
  let diffHours = Math.round(diffMinutes / 60)
  let diffDays = Math.round(diffHours / 24)
  let diffMonths = Math.round(diffDays / 30)
  let diffYears = Math.round(diffDays / 365)

  let relative = ''
  if (diffYears > 0) {
    relative = `${diffYears}y ago`
  } else if (diffMonths > 0) {
    relative = `${diffMonths}mo ago`
  } else if (diffDays > 0) {
    relative = `${diffDays}d ago`
  } else if (diffHours > 0) {
    relative = `${diffHours}h ago`
  } else if (diffMinutes > 0) {
    relative = `${diffMinutes}m ago`
  } else {
    relative = 'Just now'
  }

  let fullDate = targetDate.toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${relative})`
}
