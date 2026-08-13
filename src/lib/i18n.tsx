import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  // Nav
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.books": { ar: "الإصدارات", en: "Catalogue" },
  "nav.about": { ar: "عن الدار", en: "About" },
  "nav.contact": { ar: "تواصل", en: "Contact" },
  "nav.downloads": { ar: "تحميل القوائم", en: "Download Lists" },

  // Downloads
  "downloads.title": { ar: "تحميل القوائم", en: "Download Lists" },
  "downloads.lead": {
    ar: "يمكنك الحصول على قائمة إصداراتنا كاملة عبر تحميل الملف على جهازك.",
    en: "Get our full catalogue by downloading the file to your device.",
  },
  "downloads.file1": { ar: "قائمة دار الراية للنشر والتوزيع", en: "Dar Al-Raya Publishing Catalogue" },
  "downloads.download": { ar: "تحميل", en: "Download" },

  // Hero
  "hero.cta": { ar: "تصفّح الإصدارات", en: "Browse the catalogue" },

  // Stats
  "stat.titles": { ar: "عنوان منشور", en: "Published titles" },
  "stat.since": { ar: "منذ", en: "Since" },

  // Sections
  "section.categories": { ar: "التخصصات الرئيسية", en: "Main Specialisations" },
  "section.categories.sub": {
    ar: "من المرجع الأكاديمي إلى كافة الحقول المعرفية.",
    en: "From academic reference to all fields of knowledge.",
  },
  "section.featured": { ar: "مختارات الدار", en: "Selected by the house" },
  "section.new": { ar: "أحدث الإصدارات", en: "New releases" },
  "section.viewAll": { ar: "عرض الجميع", en: "View all" },

  // Books page
  "books.title": { ar: "الإصدارات", en: "Catalogue" },
  "books.hero": { ar: "إصداراتنا", en: "Our Publications" },
  "books.lead": {
    ar: "تصفّح مكتبتنا الكاملة ",
    en: "Browse our full library ",
  },
  "books.search": { ar: "ابحث باسم الكتاب أو المؤلف…", en: "Search by title or author…" },
  "books.all": { ar: "كل التخصصات", en: "All specialisations" },
  "books.sort": { ar: "الترتيب", en: "Sort" },
  "books.sort.new": { ar: "الأحدث", en: "Newest" },
  "books.sort.title": { ar: "أبجدياً", en: "Alphabetical" },

  // Book Detail
  "book.pages": { ar: "عدد الصفحات", en: "Pages" },
  "book.year": { ar: "سنة النشر", en: "Year" },
  "book.isbn": { ar: "رقم ISBN", en: "ISBN" },
  "book.add_to_cart": { ar: "أضف إلى السلة", en: "Add to cart" },
  "book.added": { ar: "تمت الإضافة", en: "Added" },
  "book.related": { ar: "كتب ذات صلة", en: "Related Books" },

  // Cart
  "cart.title": { ar: "قائمة الطلبات", en: "Your Orders" },
  "cart.empty": { ar: "لم تقم بإضافة أي كتب بعد.", en: "No books added yet." },

  // About
  "about.title": { ar: "عن الدار", en: "About the house" },
  "about.hero": {
    ar: "نحن الراية ومنا تبدأ الرواية",
    en: "We are the banner, and from us the story begins",
  },
  "about.heroSub": {
    ar: "دار نشر وتوزيع أردنية متخصصة في نشر وتوزيع الكتب في شتى التخصصات",
    en: "A Jordanian publishing house specialising in publishing and distributing books across all fields",
  },
  "about.p1": {
    ar: "تأسست دار الراية للنشر والتوزيع عام 2004 على يد الأستاذ  حسان العدوان لتكون بيتاً للمؤلف العربي؛ نرافق الكتاب من المخطوطة الأولى حتى يبلغ رفّ المكتبة ويد القارئ، بمعايير مهنية في التحرير والإخراج والطباعة.",
    en: "Dar Al-Raya Publishing & Distribution was founded in 2004 by the writer Hassan Al-Adwan to be a home for Arab authors. We accompany a book from first manuscript to the shelf and the reader's hand, with professional standards in editing, design and print.",
  },
  "about.p2": {
    ar: "نعمل مع الأكاديميين والباحثين والروائيين والشعراء وكتّاب الأطفال، ونتعامل مع كل مخطوطة بوصفها مشروعاً مستقلاً له هويته الخاصة. العديد من كتبنا معتمدة كمراجع في الجامعات الأردنية والعربية.",
    en: "We work with academics, researchers, novelists, poets and children's writers, treating each manuscript as an independent project with its own identity. Many of our titles are adopted as references in Jordanian and Arab universities.",
  },
  "about.references": { ar: "مراجع معتمدة", en: "Adopted References" },
  "about.p3": {
    ar: " دار الراية عضو في اتحاد الناشرين الأردنيين واتحاد الناشرين العرب، ونلتزم بمعايير النشر المهني والترقيم الدولي (ISBN) لكل إصدار.",
    en: "Dar Al-Raya is a member of the Jordanian Publishers Union and the Arab Publishers Union, and we adhere to professional publishing standards and international numbering (ISBN) for every title.",
  },
  "about.values": { ar: "ما نلتزم به", en: "What we commit to" },
  "about.v1.t": { ar: "أمانة النص", en: "Fidelity to the text" },
  "about.v1.d": { ar: "لا نمسّ صوت المؤلف؛ نصقل اللغة ونحمي المعنى.", en: "We never alter the author's voice; we polish the language and protect the meaning." },
  "about.v2.t": { ar: "جودة الصناعة", en: "Craft quality" },
  "about.v2.d": { ar: "ورق وطباعة وتجليد نختارها بعناية لكل عنوان على حدة.", en: "Paper, print and binding chosen carefully for each individual title." },
  "about.v3.t": { ar: "وصول حقيقي", en: "Real reach" },
  "about.v3.d": { ar: "شبكة توزيع في المكتبات والجامعات ومعارض الكتاب.", en: "A distribution network across bookshops, universities and book fairs." },

  // Contact
  "contact.title": { ar: "تواصل معنا", en: "Contact Us" },
  "contact.lead": { ar: "يسعدنا تواصلكم معنا للاستفسار عن الإصدارات أو النشر والتوزيع.", en: "We are pleased to hear from you about our publications, publishing, and distribution." },
  "contact.phone": { ar: "هاتف", en: "Phone" },
  "contact.mobile": { ar: "محمول", en: "Mobile" },
  "contact.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "contact.social": { ar: "تواصل معنا", en: "Find Us Online" },
  "contact.facebook": { ar: "فيسبوك", en: "Facebook" },
  "contact.email": { ar: "البريد الإلكتروني", en: "Email" },

  // Footer
  "footer.rights": {
    ar: "جميع الحقوق محفوظة لدار الراية للنشر والتوزيع © 2026",
    en: "All rights reserved to Dar Al-Raya Publishing © 2026",
  },
};

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  tx: (obj: { ar: string; en?: string } | undefined) => string;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("alraya.lang") as Lang;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("alraya.lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  const toggle = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang]);

  const t = useCallback(
    (key: string) => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang] || entry.ar;
    },
    [lang]
  );

  const tx = useCallback(
    (obj: { ar: string; en?: string } | undefined) => {
      if (!obj) return "";
      if (lang === "en" && obj.en) return obj.en;
      return obj.ar;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, tx, dir: (lang === "ar" ? "rtl" : "ltr") as "rtl" | "ltr" }),
    [lang, toggle, t, tx]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    // Remove diacritics / harakat
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Alef variants (أ, إ, آ, ا -> ا)
    .replace(/[أإآا]/g, "ا")
    // Normalize Teh Marbuta and Heh (ة -> ه)
    .replace(/ة/g, "ه")
    // Normalize Yeh and Alef Maksura (ى, ي -> ي)
    .replace(/[ىي]/g, "ي")
    .toLowerCase()
    .trim();
}
