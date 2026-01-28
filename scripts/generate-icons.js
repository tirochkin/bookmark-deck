#!/usr/bin/env node
/**
 * Generate PNG icons for Chrome extension from SVG
 * Run: node scripts/generate-icons.js
 *
 * Requires: npm install sharp
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const sizes = [16, 32, 48, 128]
const svgPath = join(rootDir, 'extension/icons/icon.svg')
const outputDir = join(rootDir, 'extension/icons')

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true })

const svgBuffer = readFileSync(svgPath)

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = join(outputDir, `icon${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`Generated: icon${size}.png`)
  }
  console.log('All icons generated!')
}

generateIcons().catch(console.error)
