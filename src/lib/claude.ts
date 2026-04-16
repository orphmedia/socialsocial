import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ORPHMEDIA_CONTEXT = `You are the AI content strategist for OrphMedia, a cutting-edge brand at the intersection of AI and hospitality. OrphMedia's mission is to showcase how artificial intelligence is transforming the hospitality industry — from smart hotels and AI concierges to automated guest experiences and data-driven restaurant operations. The tone should be: innovative, authoritative, forward-thinking, and accessible. Content should position OrphMedia as a thought leader that makes complex AI concepts approachable for hospitality professionals.`;

export async function researchContent(topic: string): Promise<{
  trends: string[];
  contentAngles: string[];
  hashtags: string[];
  keyInsights: string[];
  competitorGaps: string[];
}> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `${ORPHMEDIA_CONTEXT}

Research this topic for Instagram content: "${topic}"

Return a JSON object with:
- "trends": array of 5 current trends related to this topic in AI + hospitality
- "contentAngles": array of 5 unique content angles we could take
- "hashtags": array of 15 relevant hashtags (mix of high-volume and niche)
- "keyInsights": array of 5 key data points or insights that would grab attention
- "competitorGaps": array of 3 content gaps competitors aren't covering

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

export async function generateCarousel(
  topic: string,
  angle: string,
  slideCount: number = 8
): Promise<{
  title: string;
  slides: Array<{
    slideNumber: number;
    headline: string;
    body: string;
    visualDirection: string;
    designNotes: string;
  }>;
  caption: string;
  hashtags: string[];
}> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `${ORPHMEDIA_CONTEXT}

Create an Instagram carousel post with ${slideCount} slides.
Topic: "${topic}"
Angle: "${angle}"

Return a JSON object with:
- "title": catchy carousel title
- "slides": array of ${slideCount} objects, each with:
  - "slideNumber": number
  - "headline": bold headline text (max 8 words)
  - "body": supporting text (max 30 words)
  - "visualDirection": description of what the slide visual should look like
  - "designNotes": color scheme, typography, and layout suggestions
- "caption": engaging caption with CTA (max 200 words)
- "hashtags": array of 20 relevant hashtags

Make slide 1 a hook/title slide. Make the last slide a CTA slide.
Design should feel premium, modern, tech-forward. Think dark themes with electric accent colors.

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

export async function generateReel(
  topic: string,
  angle: string,
  durationSeconds: number = 30
): Promise<{
  title: string;
  hook: string;
  script: Array<{
    timestamp: string;
    dialogue: string;
    visualDirection: string;
    textOverlay: string;
  }>;
  cta: string;
  caption: string;
  hashtags: string[];
  musicSuggestion: string;
  transitionNotes: string;
}> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: `${ORPHMEDIA_CONTEXT}

Create an Instagram Reel script (~${durationSeconds} seconds).
Topic: "${topic}"
Angle: "${angle}"

Return a JSON object with:
- "title": working title
- "hook": the opening hook line (first 3 seconds, must stop the scroll)
- "script": array of scene objects with:
  - "timestamp": time range (e.g., "0-3s")
  - "dialogue": what to say/narrate
  - "visualDirection": what to show on screen
  - "textOverlay": text to display on screen
- "cta": call to action at the end
- "caption": engaging caption (max 150 words)
- "hashtags": array of 20 hashtags
- "musicSuggestion": trending audio or music style recommendation
- "transitionNotes": editing style and transition suggestions

Make it punchy, fast-paced, and visually dynamic. Think: tech CEO meets hospitality innovator.

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

export async function generateContentCalendar(
  weeks: number = 2,
  themes: string[] = []
): Promise<{
  calendar: Array<{
    date: string;
    dayOfWeek: string;
    contentType: "carousel" | "reel" | "story" | "static";
    theme: string;
    topic: string;
    angle: string;
    caption_preview: string;
    optimal_time: string;
  }>;
}> {
  const themeList =
    themes.length > 0
      ? themes.join(", ")
      : "AI in Hotels, Smart Restaurants, Guest Experience Tech, Hospitality Data, AI Concierges, Revenue Management AI";

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `${ORPHMEDIA_CONTEXT}

Generate a ${weeks}-week Instagram content calendar starting from tomorrow.
Themes to rotate through: ${themeList}

Post frequency: 1-2 posts per day (mix of carousels, reels, and static posts).
Optimal posting times for business/tech audience.

Return a JSON object with:
- "calendar": array of daily content items, each with:
  - "date": YYYY-MM-DD format
  - "dayOfWeek": name of day
  - "contentType": "carousel" | "reel" | "story" | "static"
  - "theme": which theme this falls under
  - "topic": specific topic
  - "angle": unique angle/hook
  - "caption_preview": first line of caption (the hook)
  - "optimal_time": best time to post (HH:MM format, EST)

Mix content types strategically. Carousels for education, Reels for engagement, Stories for behind-the-scenes.
Weekdays = more professional content. Weekends = lighter, trend-driven content.

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

export async function generateAutopilotContent(
  calendarEntry: {
    contentType: string;
    theme: string;
    topic: string;
    angle: string;
  }
): Promise<{ carousel?: Awaited<ReturnType<typeof generateCarousel>>; reel?: Awaited<ReturnType<typeof generateReel>> }> {
  if (calendarEntry.contentType === "carousel") {
    const carousel = await generateCarousel(calendarEntry.topic, calendarEntry.angle);
    return { carousel };
  } else if (calendarEntry.contentType === "reel") {
    const reel = await generateReel(calendarEntry.topic, calendarEntry.angle);
    return { reel };
  }
  return {};
}
