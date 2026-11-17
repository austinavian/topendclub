import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every Top End Club event. One entry per Saturday night at zMAX.
const events = defineCollection({
  loader: file('src/data/events.json'),
  schema: z.object({
    year: z.number(),
    season: z.enum(['Spring', 'Fall']),
    date: z.coerce.date(),
    name: z.string(),
    notes: z.string().default(''),
    raised: z.number().optional(),          // D.R.A.W. donation that night, USD
    raisedIsEstimate: z.boolean().optional(),
    totalAfter: z.number().optional(),      // all-time D.R.A.W. total after this event
    flyer: z.string().optional(),
    private: z.boolean().optional(),
    video: z.string().optional(),           // YouTube video id
  }),
});

// News posts: after-event stories and club news, one Markdown file each.
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().default('The Top End Club'),
    kind: z.enum(['after-event', 'club']).default('club'),
    event: z.string().optional(),           // id from events.json
    summary: z.string().optional(),
    cover: z.string().optional(),
  }),
});

export const collections = { events, news };
