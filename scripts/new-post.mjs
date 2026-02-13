import { createInterface } from 'node:readline'
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const title = await ask('Title: ')

if (!title.trim()) {
  console.error('Error: Title is required.')
  rl.close()
  process.exit(1)
}

const slug = slugify(title)
const date = new Date().toISOString().split('T')[0]
const dir = join(process.cwd(), 'content', 'blog')
const filePath = join(dir, `${slug}.md`)

if (existsSync(filePath)) {
  console.error(`Error: ${filePath} already exists.`)
  rl.close()
  process.exit(1)
}

const content = `---
title: "${title}"
description: ""
date: "${date}"
author: "LunaCradle Team"
tags: []
image: ""
imageAlt: ""
imageCredit: ""
imageCreditUrl: ""
---

##
`

writeFileSync(filePath, content, 'utf8')

console.log()
console.log(`Created: ${filePath}`)
console.log()
console.log('Next steps:')
console.log('  1. Write your post content')
console.log('  2. Add an Unsplash image URL to the "image" field')
console.log('  3. Fill in imageCredit and imageCreditUrl with the photographer\'s info')
console.log('  4. Add a description (120-155 chars) and tags')
console.log('  5. Run "npm run dev" to preview')

rl.close()
