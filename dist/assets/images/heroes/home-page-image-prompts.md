# Home Page Image Generation Prompts for Gemini

This document contains all the prompts needed to generate images for the ACBF RSA home page using Gemini image generation.

## Image Specifications
- **Aspect Ratio**: 16:9 (1920x1080px minimum, ideally 2560x1440px for hero images)
- **Format**: High-resolution JPG
- **Style**: Professional, modern, business-oriented
- **Color Palette**: Deep blues, rich purples, warm gold accents (ACBF brand colors)
- **Overlay Compatibility**: All images should work well with a semi-transparent dark overlay (40-50% opacity) for white text readability

---

## 1. Hero Section Images

### Hero Image 1: "Welcome to ACBF RSA"
**File Name**: `hero-1.jpg`  
**Location**: `/public/assets/images/heroes/hero-1.jpg`  
**Usage**: First slide in hero carousel with title "Welcome to ACBF RSA" and subtitle "Building a Better Future Together"

**Prompt for Gemini**:
```
Create a professional, inspiring hero background image for a Christian business fellowship organization website.

Style & Mood:
- Modern, professional, and welcoming atmosphere
- Warm and inviting color palette with deep navy blue (#1e3a5f), royal blue (#2d4a7c), rich purple (#6b46c1), and warm gold accents (#f59e0b)
- Subtle gradient effect from darker to lighter tones
- Clean, minimalist aesthetic with depth and dimension
- Business-oriented but approachable and community-focused

Visual Elements:
- Abstract geometric shapes or patterns suggesting unity, community, and collaboration
- Subtle network or connection lines in the background (representing business networking and fellowship)
- Soft light rays or glow effects emanating from the center or top, suggesting hope and growth
- Very subtle silhouettes of diverse business professionals in the background (blurred, at low opacity, suggesting community)
- No text or logos - pure background image

Technical Specifications:
- Aspect ratio: 16:9 (2560x1440px ideal)
- High-resolution, professional quality
- Style: Abstract/symbolic, not photorealistic
- Multiple layers creating depth without being distracting
- Should work well with a semi-transparent dark overlay (40-50% opacity) for white text readability

Avoid:
- Busy or cluttered designs
- High contrast that would compete with text
- Overly bright or saturated colors
- Photorealistic people or objects (keep it abstract/symbolic)
- Text or specific branding elements

Theme: Building a Better Future Together - focus on unity, growth, and positive community impact
```

---

### Hero Image 2: "Empowering Communities"
**File Name**: `hero-2.jpg`  
**Location**: `/public/assets/images/heroes/hero-2.jpg`  
**Usage**: Second slide with title "Empowering Communities" and subtitle "Making a Difference"

**Prompt for Gemini**:
```
Create a professional, inspiring hero background image for a Christian business fellowship organization focused on community empowerment.

Style & Mood:
- Modern, professional, and empowering atmosphere
- Color palette: Deep teal (#0f766e) transitioning through purple (#7c3aed) to warm orange (#ea580c)
- Warm gradient with uplifting energy
- Clean, modern aesthetic with depth
- Community-focused and impact-oriented

Visual Elements:
- Abstract geometric patterns suggesting growth, empowerment, and positive change
- Upward-flowing lines or shapes suggesting progress and elevation
- Soft light rays coming from above, suggesting empowerment and enlightenment
- Subtle abstract shapes representing diverse communities coming together
- Very subtle abstract representations of hands reaching up or circles connecting (blurred, low opacity)
- No text or logos - pure background image

Technical Specifications:
- Aspect ratio: 16:9 (2560x1440px ideal)
- High-resolution, professional quality
- Style: Abstract/symbolic, not photorealistic
- Multiple layers creating depth
- Compatible with dark overlay for white text

Avoid:
- Busy or cluttered designs
- High contrast that would compete with text
- Overly bright or saturated colors
- Photorealistic elements
- Text or branding

Theme: Empowering Communities - Making a Difference - focus on positive impact, growth, and community empowerment
```

---

### Hero Image 3: "Stay Connected"
**File Name**: `hero-3.jpg`  
**Location**: `/public/assets/images/heroes/hero-3.jpg`  
**Usage**: Third slide with title "Stay Connected" and subtitle "Latest News & Updates"

**Prompt for Gemini**:
```
Create a professional, inspiring hero background image for a Christian business fellowship organization focused on communication and connection.

Style & Mood:
- Modern, professional, and connected atmosphere
- Color palette: Deep navy blue (#1e293b) transitioning to slate blue (#475569) with warm gold accents (#f59e0b)
- Sophisticated gradient with communication/connection theme
- Clean, modern aesthetic with technological elements
- Network and communication-focused

Visual Elements:
- Abstract network patterns or connection nodes suggesting communication and connectivity
- Subtle geometric shapes representing information flow and networking
- Soft light rays or digital network lines suggesting modern communication
- Abstract representations of connected nodes or communication pathways (blurred, low opacity)
- Very subtle abstract shapes suggesting news, updates, and information sharing
- No text or logos - pure background image

Technical Specifications:
- Aspect ratio: 16:9 (2560x1440px ideal)
- High-resolution, professional quality
- Style: Abstract/symbolic with subtle tech/network elements
- Multiple layers creating depth
- Compatible with dark overlay for white text

Avoid:
- Busy or cluttered designs
- High contrast that would compete with text
- Overly bright or saturated colors
- Photorealistic elements
- Text or branding
- Overly technical or digital-looking (keep it subtle and professional)

Theme: Stay Connected - Latest News & Updates - focus on communication, information sharing, and staying informed
```

---

## 2. About Preview Section Image

### About Preview Image
**File Name**: `about-preview.jpg`  
**Location**: `/public/assets/images/about-preview.jpg`  
**Usage**: Image in the About Preview section showing the organization's story

**Prompt for Gemini**:
```
Create a professional, inspiring image for an "About Us" section of a Christian business fellowship organization website.

Style & Mood:
- Professional, warm, and welcoming
- Color palette: Deep blues (#1e3a5f, #2d4a7c), rich purples (#6b46c1), and warm gold accents (#f59e0b)
- Subtle gradient or abstract background
- Clean, modern aesthetic
- Story-focused and narrative-driven

Visual Elements:
- Abstract or symbolic representation of a journey, story, or legacy
- Subtle geometric patterns suggesting growth over time (timeline, progression)
- Soft light rays suggesting hope and vision
- Very subtle abstract shapes representing community, fellowship, and business growth
- Optional: Very subtle abstract representation of a handshake or unity (blurred, low opacity)
- No text or logos - pure background image
- Should work well as a side-by-side image with text content

Technical Specifications:
- Aspect ratio: 4:3 or 16:9 (1920x1080px minimum)
- High-resolution, professional quality
- Style: Abstract/symbolic, not photorealistic
- Multiple layers creating depth
- Should work well without overlay (lighter than hero images)

Avoid:
- Busy or cluttered designs
- Overly dark (needs to work without heavy overlay)
- Photorealistic elements
- Text or branding
- Too abstract (should still feel meaningful and story-focused)

Theme: About ACBF RSA - representing the organization's history, mission, and journey since 1994
```

---

## 3. Blog Post Featured Images

### Blog Featured Image Template
**File Name**: `blog-{post-slug}.jpg` (e.g., `blog-annual-gala-dinner-awards-2025.jpg`)  
**Location**: `/public/assets/images/blog/`  
**Usage**: Featured images for blog posts in the Blog Preview section

**Note**: Currently, the blog post in `posts.json` has `featuredImage: null`. You'll need to generate images for each blog post.

### Example: Annual Gala Dinner & Awards 2025
**File Name**: `blog-annual-gala-dinner-awards-2025.jpg`

**Prompt for Gemini**:
```
Create a professional, elegant featured image for a blog post about an annual gala dinner and awards event.

Style & Mood:
- Elegant, sophisticated, and celebratory
- Color palette: Deep navy blue (#1e3a5f), rich purple (#6b46c1), warm gold (#f59e0b), and elegant black
- Luxurious and premium feel
- Event-focused and celebration-oriented

Visual Elements:
- Abstract geometric patterns suggesting elegance and celebration
- Subtle abstract representations of awards, stars, or celebration elements (very subtle, blurred)
- Soft light rays or glow effects suggesting a special event
- Abstract shapes suggesting a gala or formal event atmosphere
- Very subtle abstract patterns suggesting networking, fellowship, and recognition
- No text or logos - pure background image
- Should work well as a card thumbnail (will be cropped to square/rectangle)

Technical Specifications:
- Aspect ratio: 16:9 (1920x1080px minimum)
- High-resolution, professional quality
- Style: Abstract/symbolic, elegant
- Multiple layers creating depth
- Should work well as a featured image thumbnail

Avoid:
- Busy or cluttered designs
- Overly bright or saturated colors
- Photorealistic elements
- Text or branding
- Too dark (needs to work as a thumbnail)

Theme: Annual Gala Dinner & Awards 2025 - Building a Legacy that Lasts. Fruit that Remains - focus on celebration, recognition, and legacy building
```

---

## General Guidelines for All Images

### Color Palette (ACBF Brand Colors)
- **Primary Blue**: #1e3a5f (Deep navy)
- **Secondary Blue**: #2d4a7c (Royal blue)
- **Purple**: #6b46c1 (Rich purple)
- **Gold Accent**: #f59e0b (Warm gold)
- **Teal**: #0f766e (Deep teal)
- **Orange**: #ea580c (Warm orange)

### Style Consistency
- All images should maintain a consistent professional, modern aesthetic
- Abstract/symbolic rather than photorealistic
- Gradient-based with depth and dimension
- Suitable for overlay text (hero images) or standalone use (preview images)

### Technical Requirements
- **Hero Images**: 2560x1440px (16:9), optimized to under 500KB
- **Preview Images**: 1920x1080px (16:9) or 1920x1440px (4:3), optimized to under 400KB
- **Blog Images**: 1920x1080px (16:9), optimized to under 300KB

### Optimization Tips
After generating images:
1. Use tools like TinyPNG, ImageOptim, or Squoosh to compress
2. Ensure images are under the recommended file sizes
3. Test with dark overlay for hero images
4. Verify text readability when overlaid

---

## Usage Instructions

1. **Copy each prompt** and paste it into Gemini image generation
2. **Generate the image** with the specifications provided
3. **Save the image** with the exact file name specified
4. **Place it** in the correct directory as indicated
5. **Optimize** the image using compression tools
6. **Update the code** if needed to reference the correct image paths

---

## Current Image Status

### ✅ Already Exist (No generation needed)
- Member logos (in `/public/assets/images/members/logos/`)
- ACBF logo (in `/public/assets/images/logos/acbf logos/`)

### ❌ Need Generation
- `hero-1.jpg` - Welcome to ACBF RSA
- `hero-2.jpg` - Empowering Communities  
- `hero-3.jpg` - Stay Connected
- `about-preview.jpg` - About Preview section
- `blog-annual-gala-dinner-awards-2025.jpg` - Blog featured image (and any future blog posts)

---

## Notes

- All prompts are designed for Gemini image generation
- Adjust prompts slightly if needed based on Gemini's specific capabilities
- Test images in the actual website context before finalizing
- Consider creating variations of each image for A/B testing
- Keep brand consistency across all generated images

