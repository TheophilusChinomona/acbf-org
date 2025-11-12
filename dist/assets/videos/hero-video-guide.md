# Hero Video Background Guide

## Overview
You can use a single looped video for the hero section instead of multiple static images. This creates a more dynamic and engaging experience.

## Video Specifications

### Technical Requirements
- **Format**: MP4 (H.264 codec recommended for best browser compatibility)
- **Aspect Ratio**: 16:9 (1920x1080px minimum, 2560x1440px ideal)
- **Duration**: 10-30 seconds (shorter is better for file size)
- **Loop**: Must be seamless (starts and ends at the same point)
- **File Size**: Under 5MB per video (optimize for web)
- **Frame Rate**: 24-30fps
- **Audio**: Muted (no audio needed for background videos)

### Quality Guidelines
- **Resolution**: 1920x1080px (Full HD) minimum
- **Bitrate**: 2-5 Mbps for good quality/size balance
- **Compression**: Use H.264 codec with optimized settings

---

## Creating the Video

### Option 1: Single Hero Video (Recommended)
Create **one seamless looped video** that works for all slides. The video will play continuously while the slides transition.

**File Name**: `hero-background.mp4`  
**Location**: `/public/assets/videos/hero-background.mp4`

### Option 2: Multiple Videos (One per Slide)
Create **three separate videos**, one for each slide.

**File Names**:
- `hero-1.mp4` - Welcome to ACBF RSA
- `hero-2.mp4` - Empowering Communities  
- `hero-3.mp4` - Stay Connected

**Location**: `/public/assets/videos/`

---

## Video Creation Prompts for AI Video Generators

### Single Hero Video Prompt (Recommended)
```
Create a professional, seamless looped background video for a Christian business fellowship organization website hero section.

Style & Mood:
- Modern, professional, and inspiring
- Smooth, subtle motion (not distracting)
- Color palette: Deep navy blue (#1e3a5f), royal blue (#2d4a7c), rich purple (#6b46c1), warm gold accents (#f59e0b)
- Elegant gradient transitions
- Abstract/symbolic elements in motion

Visual Elements:
- Abstract geometric shapes gently moving or morphing
- Subtle network lines or connection patterns slowly animating
- Soft light rays or glow effects slowly moving or pulsing
- Very subtle abstract shapes representing community and business (blurred, low opacity)
- Smooth, slow motion (nothing jarring or fast)
- Seamless loop (starts and ends at the same visual state)

Motion Details:
- Slow, gentle movements (2-5 seconds per movement cycle)
- Smooth transitions and morphing
- Subtle zoom or pan (very slow, if any)
- Particles or light effects gently floating
- Abstract shapes slowly connecting or forming patterns

Technical Specifications:
- Duration: 15-20 seconds (seamless loop)
- Aspect ratio: 16:9 (2560x1440px ideal)
- Frame rate: 24-30fps
- Format: MP4, H.264 codec
- File size: Under 5MB
- Seamless loop: Video must start and end at the same visual point
- No audio: Muted background video

Avoid:
- Fast movements or jarring transitions
- Busy or cluttered motion
- High contrast that would compete with text
- Photorealistic elements
- Text or logos
- Abrupt changes or cuts

Theme: Professional, inspiring, community-focused, business-oriented, welcoming
```

### Alternative: More Dynamic Version
```
Create a seamless looped background video with more dynamic but still professional motion. Abstract geometric patterns slowly rotating and morphing. Network lines connecting and disconnecting in slow motion. Light rays gently sweeping across. Color gradient slowly shifting between deep blues, purples, and gold. Smooth, elegant motion throughout. 15-20 seconds, seamless loop, 16:9 aspect ratio, under 5MB.
```

---

## Video Optimization Tools

After creating your video, optimize it for web:

### Online Tools
1. **CloudConvert** (https://cloudconvert.com) - Convert and compress videos
2. **HandBrake** (https://handbrake.fr) - Free desktop video compression
3. **FFmpeg** (command line) - Professional video processing

### FFmpeg Command (Recommended)
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart hero-background.mp4
```

**Parameters explained**:
- `-c:v libx264` - Use H.264 codec
- `-preset slow` - Better compression
- `-crf 28` - Quality setting (lower = better quality, higher = smaller file)
- `-vf "scale=1920:1080"` - Resize to 1920x1080
- `-an` - Remove audio
- `-movflags +faststart` - Enable fast start for web streaming

---

## Implementation

### Current Setup
The Hero component now supports video backgrounds. Simply:

1. **Place your video** in `/public/assets/videos/`
2. **Update the slide data** in `src/components/home/Hero.jsx`:
   - Add `video: "/assets/videos/hero-background.mp4"` to each slide
   - Keep the `image` property as a fallback

### Example Configuration
```javascript
const slides = [
  {
    id: 1,
    title: "Welcome to ACBF RSA",
    // ... other properties
    video: "/assets/videos/hero-background.mp4", // Video background
    image: "/assets/images/hero-1.jpg", // Fallback image
  },
  // ... other slides
];
```

### Single Video for All Slides
If using one video for all slides, you can set it once:
```javascript
const heroVideo = "/assets/videos/hero-background.mp4";

const slides = [
  {
    id: 1,
    // ...
    video: heroVideo,
    image: "/assets/images/hero-1.jpg",
  },
  {
    id: 2,
    // ...
    video: heroVideo,
    image: "/assets/images/hero-2.jpg",
  },
  // ...
];
```

---

## Testing Checklist

- [ ] Video plays automatically
- [ ] Video loops seamlessly (no visible jump)
- [ ] Video is muted
- [ ] Video doesn't pause on mobile
- [ ] Fallback image shows if video fails to load
- [ ] Overlay (dark 50% opacity) works well with video
- [ ] White text is readable over the video
- [ ] File size is under 5MB
- [ ] Video loads quickly (under 2 seconds on good connection)

---

## Browser Compatibility

The video implementation uses:
- `autoPlay` - Starts automatically
- `loop` - Loops continuously
- `muted` - Required for autoplay in most browsers
- `playsInline` - Prevents fullscreen on mobile iOS
- `poster` - Shows fallback image while loading

**Supported browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)

---

## Performance Tips

1. **Keep it short**: 10-20 seconds is ideal
2. **Optimize file size**: Use compression tools
3. **Use poster image**: Helps with initial load
4. **Consider mobile**: Test on mobile devices (may need lower quality)
5. **Lazy load**: Videos only load when slide is active (future enhancement)

---

## Alternative: Animated Background (CSS/JS)

If video file size is a concern, consider:
- CSS animations with gradients
- Canvas-based animations
- Lottie animations (JSON-based, very small file size)

But video backgrounds generally look more professional and are easier to create with AI tools.

---

## Resources

- **AI Video Generators**: RunwayML, Pika Labs, Stable Video Diffusion
- **Video Editing**: DaVinci Resolve (free), Adobe Premiere
- **Optimization**: HandBrake, FFmpeg
- **Stock Videos**: Pexels, Pixabay (if you want to use stock footage)

---

## Notes

- The video will play continuously while users view the hero section
- Slides still transition (fade effect) but video continues playing
- If video fails to load, it automatically falls back to the image
- Video is muted by default (required for autoplay in browsers)

