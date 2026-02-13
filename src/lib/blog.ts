import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  dateModified: string
  author: string
  tags: string[]
  image: string
  imageAlt: string
  imageCredit: string
  imageCreditUrl: string
  content: string
  readingTime: number
  wordCount: number
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return []
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md') && file === file.toLowerCase())
    .map((file) => file.replace(/\.md$/, ''))
}

export function getPostBySlug(slug: string): BlogPost {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const wordCount = content.split(/\s+/g).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    dateModified: data.dateModified ?? '',
    author: data.author ?? '',
    tags: data.tags ?? [],
    image: data.image ?? '',
    imageAlt: data.imageAlt ?? '',
    imageCredit: data.imageCredit ?? '',
    imageCreditUrl: data.imageCreditUrl ?? '',
    content,
    readingTime,
    wordCount,
  }
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs()
  return slugs
    .map((slug) => getPostBySlug(slug))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}
