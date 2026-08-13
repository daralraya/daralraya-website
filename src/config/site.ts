/**
 * Central place for all contact / brand details.
 * Edit these values — they propagate across the whole site.
 */
export const site = {
  domain: "alraya-jo.com",
  url: "https://alraya-jo.com",
  email: "ceo@alraya-jo.com",
  emailAlt: "dar_alraya@yahoo.com",
  /** Set to a full international number, e.g. "962790000000" (no + / spaces). */
  whatsapp: "962775231313",
  phoneDisplay: "+962 6 523 1313",
  facebook: "https://www.facebook.com/dar.alraya.2013",
  instagram: "",
  address: {
    ar: "عمّان، المملكة الأردنية الهاشمية",
    en: "Amman, Hashemite Kingdom of Jordan",
  },
  founded: 2004,
} as const;

export const orderChannel = (message: string) =>
  site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
    : `mailto:${site.email}?subject=${encodeURIComponent(
        "طلب كتب / Book order",
      )}&body=${encodeURIComponent(message)}`;
