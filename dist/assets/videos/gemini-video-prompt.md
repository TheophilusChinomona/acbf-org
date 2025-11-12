# Quick Video Prompt for Gemini/AI Video Generator

## Single Hero Video (Recommended)

**File Name**: `hero-background.mp4`  
**Location**: `/public/assets/videos/hero-background.mp4`

### Prompt:
```
Create a professional, seamless looped background video for a Christian business fellowship organization website hero section.

Style: Modern, professional, inspiring. Smooth, subtle motion (not distracting).

Colors: Deep navy blue (#1e3a5f), royal blue (#2d4a7c), rich purple (#6b46c1), warm gold accents (#f59e0b). Elegant gradient transitions.

Visual Elements:
- Abstract geometric shapes gently moving or morphing
- Subtle network lines or connection patterns slowly animating
- Soft light rays or glow effects slowly moving or pulsing
- Very subtle abstract shapes representing community and business (blurred, low opacity)
- Smooth, slow motion (nothing jarring or fast)
- Seamless loop (starts and ends at the same visual state)

Motion: Slow, gentle movements (2-5 seconds per cycle). Smooth transitions and morphing. Subtle zoom or pan (very slow, if any). Particles or light effects gently floating. Abstract shapes slowly connecting or forming patterns.

Technical:
- Duration: 15-20 seconds (seamless loop)
- Aspect ratio: 16:9 (2560x1440px ideal)
- Frame rate: 24-30fps
- Format: MP4, H.264 codec
- File size: Under 5MB
- Seamless loop: Video must start and end at the same visual point
- No audio: Muted background video

Avoid: Fast movements, busy motion, high contrast, photorealistic elements, text, logos, abrupt changes.

Theme: Professional, inspiring, community-focused, business-oriented, welcoming.
```

---

## Alternative: Shorter Version

```
Professional seamless looped background video. Abstract geometric patterns slowly rotating and morphing. Network lines connecting in slow motion. Light rays gently sweeping. Color gradient shifting between deep blues (#1e3a5f), purples (#6b46c1), and gold (#f59e0b). Smooth, elegant motion. 15-20 seconds, seamless loop, 16:9 aspect ratio, under 5MB, muted, for Christian business fellowship website hero section.
```

---

## After Generation

1. **Save as**: `hero-background.mp4`
2. **Place in**: `/public/assets/videos/`
3. **Optimize** using FFmpeg or HandBrake (target: under 5MB)
4. **Test** the seamless loop (should start and end at same point)
5. **Update** `src/components/home/Hero.jsx` to use the video

---

## Quick Setup

In `src/components/home/Hero.jsx`, update slides:
```javascript
const heroVideo = "/assets/videos/hero-background.mp4";

const slides = [
  {
    id: 1,
    // ... other properties
    video: heroVideo,
    image: "/assets/images/hero-1.jpg", // Fallback
  },
  // ... repeat for other slides
];
```

