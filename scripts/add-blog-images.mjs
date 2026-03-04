#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')
const EXCLUDED_FILES = new Set(['AI-POST-PROMPT.md', 'BLOG-GUIDE.md'])

function parseDotenv(source) {
  const env = {}
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    env[key] = value
  }
  return env
}

async function getAccessKey() {
  if (process.env.UNSPLASH_ACCESS_KEY) return process.env.UNSPLASH_ACCESS_KEY

  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envText = await fs.readFile(envPath, 'utf8')
    const env = parseDotenv(envText)
    return env.UNSPLASH_ACCESS_KEY || ''
  } catch {
    return ''
  }
}

function escapeYamlDoubleQuotedValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function extractQuotedField(markdown, fieldName) {
  const match = markdown.match(new RegExp(`^${fieldName}:\\s*"([^"]*)"\\s*$`, 'm'))
  return match ? match[1] : ''
}

function extractTags(markdown) {
  const match = markdown.match(/^tags:\s*\[(.*)\]\s*$/m)
  if (!match) return []

  return match[1]
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^"(.*)"$/, '$1'))
}

function getUnsplashTokenFromImageUrl(imageUrl) {
  if (!imageUrl) return null
  try {
    const url = new URL(imageUrl)
    const token = url.pathname.replace(/^\//, '')
    return token.startsWith('photo-') ? token : null
  } catch {
    return null
  }
}

function getAllUnsplashTokens(markdown) {
  const tokens = new Set()
  const regex = /^image:\s*"([^"]+)"\s*$/gm
  for (const match of markdown.matchAll(regex)) {
    const token = getUnsplashTokenFromImageUrl(match[1])
    if (token) tokens.add(token)
  }
  return tokens
}

function buildQueryCandidates({ title, imageAlt, tags }) {
  const titleBeforeColon = title.includes(':') ? title.split(':')[0].trim() : ''
  const tagPhrase = tags.length ? `${tags.slice(0, 2).join(' ')} baby sleep` : ''
  const genericBaby = title.toLowerCase().includes('toddler') ? 'toddler sleeping at night' : 'baby sleeping in crib'

  return [imageAlt, titleBeforeColon, title, tagPhrase, genericBaby].filter(Boolean)
}

function isSuitableResult(result) {
  if (!result || result.asset_type !== 'photo') return false
  if (!result.urls?.raw || !result.user?.name || !result.user?.username) return false

  const text =
    `${result.description || ''} ${result.alt_description || ''} ${result.slug || ''}`.toLowerCase()

  // Skip illustrations/adult portraits and unrelated animal photos.
  const blocked = ['illustration', 'vector', 'drawing', 'dog', 'cat', 'car', 'mountain', 'cityscape']
  return !blocked.some((word) => text.includes(word))
}

async function searchUnsplash({ accessKey, query }) {
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('content_filter', 'high')
  url.searchParams.set('per_page', '30')

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Unsplash search failed (${response.status}): ${body}`)
  }

  return response.json()
}

async function triggerUnsplashDownload({ accessKey, downloadLocation }) {
  if (!downloadLocation) return

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })
  } catch {
    // Non-fatal for content update flow.
  }
}

function applyImageFields({ markdown, imageUrl, imageCredit, imageCreditUrl }) {
  let updated = markdown

  updated = updated.replace(/^image:\s*".*"$/m, `image: "${escapeYamlDoubleQuotedValue(imageUrl)}"`)
  updated = updated.replace(
    /^imageCredit:\s*".*"$/m,
    `imageCredit: "${escapeYamlDoubleQuotedValue(imageCredit)}"`
  )
  updated = updated.replace(
    /^imageCreditUrl:\s*".*"$/m,
    `imageCreditUrl: "${escapeYamlDoubleQuotedValue(imageCreditUrl)}"`
  )

  // Remove unresolved image TODO comment once fields are populated.
  updated = updated.replace(/\n?<!-- IMAGE TODO:[\s\S]*?-->\s*\n?/g, '\n')
  return updated
}

async function main() {
  const accessKey = await getAccessKey()
  if (!accessKey) {
    throw new Error('Missing UNSPLASH_ACCESS_KEY (env or .env.local)')
  }

  const allFiles = (await fs.readdir(BLOG_DIR))
    .filter((name) => name.endsWith('.md'))
    .filter((name) => !EXCLUDED_FILES.has(name))
    .sort()

  const allContents = await Promise.all(
    allFiles.map(async (name) => {
      const filePath = path.join(BLOG_DIR, name)
      const markdown = await fs.readFile(filePath, 'utf8')
      return { name, filePath, markdown }
    })
  )

  const usedUnsplashTokens = new Set()
  for (const file of allContents) {
    for (const token of getAllUnsplashTokens(file.markdown)) {
      usedUnsplashTokens.add(token)
    }
  }

  const targets = allContents.filter((file) => /^image:\s*""\s*$/m.test(file.markdown))
  if (targets.length === 0) {
    console.log('No blog posts with empty image field found.')
    return
  }

  const summary = []

  for (const post of targets) {
    const title = extractQuotedField(post.markdown, 'title')
    const imageAlt = extractQuotedField(post.markdown, 'imageAlt')
    const tags = extractTags(post.markdown)
    const queries = buildQueryCandidates({ title, imageAlt, tags })

    let selected = null

    for (const query of queries) {
      const data = await searchUnsplash({ accessKey, query })
      for (const result of data.results || []) {
        if (!isSuitableResult(result)) continue

        const token = getUnsplashTokenFromImageUrl(result.urls.raw)
        if (!token) continue
        if (usedUnsplashTokens.has(token)) continue

        selected = result
        break
      }
      if (selected) break
    }

    if (!selected) {
      throw new Error(`No suitable unique Unsplash image found for ${post.name}`)
    }

    const token = getUnsplashTokenFromImageUrl(selected.urls.raw)
    if (!token) {
      throw new Error(`Failed to parse Unsplash token for ${post.name}`)
    }

    const imageUrl = `https://images.unsplash.com/${token}?w=1200&h=630&fit=crop`
    const imageCredit = selected.user.name
    const imageCreditUrl = `https://unsplash.com/@${selected.user.username}`

    const updatedMarkdown = applyImageFields({
      markdown: post.markdown,
      imageUrl,
      imageCredit,
      imageCreditUrl,
    })

    await fs.writeFile(post.filePath, updatedMarkdown, 'utf8')
    usedUnsplashTokens.add(token)
    await triggerUnsplashDownload({
      accessKey,
      downloadLocation: selected.links?.download_location,
    })

    summary.push({
      post: post.name,
      token,
      photographer: imageCredit,
      queryUsed: queries.find((q) => q),
    })
    console.log(`Updated ${post.name} -> ${token} (${imageCredit})`)
  }

  console.log(`\nUpdated ${summary.length} post(s).`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
