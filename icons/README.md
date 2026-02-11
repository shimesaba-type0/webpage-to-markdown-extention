# Icons

This directory contains the extension icons.

## Required Icons

Chrome extensions require PNG icons in the following sizes:
- `icon16.png` - 16x16px (toolbar icon)
- `icon48.png` - 48x48px (extension management page)
- `icon128.png` - 128x128px (Chrome Web Store)

## Current Status

An SVG template (`icon.svg`) has been provided with a simple "M↓" design representing "Markdown".

## How to Generate PNG Icons

### Option 1: Using ImageMagick (command line)

```bash
# Install ImageMagick (if not already installed)
# Linux: sudo apt install imagemagick
# Mac: brew install imagemagick
# Windows: Download from https://imagemagick.org/

# Convert SVG to PNG in different sizes
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Option 2: Using Inkscape (GUI)

1. Open `icon.svg` in Inkscape
2. File > Export PNG Image
3. Set width/height to desired size (16, 48, or 128)
4. Export as `icon16.png`, `icon48.png`, `icon128.png`

### Option 3: Using Online Converter

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set output size (16x16, 48x48, 128x128)
4. Convert and download

### Option 4: Using Figma/Adobe Illustrator

1. Import `icon.svg`
2. Export as PNG with specified dimensions
3. Save as `icon16.png`, `icon48.png`, `icon128.png`

## Design Guidelines

- Use simple, recognizable symbols
- Ensure contrast for visibility
- Test on both light and dark backgrounds
- Follow Chrome Web Store icon guidelines: https://developer.chrome.com/docs/webstore/images/

## Temporary Workaround (Development)

For development purposes, you can create placeholder PNGs:
- Copy any small PNG as `icon16.png`, `icon48.png`, `icon128.png`
- The extension will load, but with generic icons
- Replace with proper icons before publishing
