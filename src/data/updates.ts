/**
 * TESTIMONIALS & EVENTS / UPDATES
 * ------------------------------------------------------------------
 * Edit the arrays below to change what appears on the homepage.
 * Currently empty — add real testimonials and events when available.
 */

import type { Bilingual } from "./catalog";

export type Testimonial = {
  id: string;
  /** Bilingual quote text. */
  quote: Bilingual;
  /** Author name. */
  name: Bilingual;
  /** Author role / book title. */
  role: Bilingual;
};

export type UpdateItem = {
  id: string;
  /** ISO date — used for ordering and for the printed day/month. */
  date: string;
  kind: "fair" | "release" | "news";
  title: Bilingual;
  place: Bilingual;
  blurb: Bilingual;
};

/* Add real testimonials below when available. */
export const testimonials: Testimonial[] = [];

/* Add real events / news items below when available. */
export const updates: UpdateItem[] = [];
