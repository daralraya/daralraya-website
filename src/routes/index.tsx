import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useContent, booksBySlugs } from "@/lib/content";
import { books, type Book } from "@/data/catalog";
import { useCatalogBooks } from "@/lib/use-catalog-books";
import { BookCard } from "@/components/site/BookCard";
import { BookCover } from "@/components/site/BookCover";
import { Reveal } from "@/components/site/Reveal";
import { site } from "@/config/site";
import heroImage from "@/assets/hero-books.jpg";
import { useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCart } from "@/lib/cart";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const OG_IMAGE = `${site.url}/og-cover.jpg`;
const TITLE = "دار الراية للنشر والتوزيع | Dar Al-Raya Publishing";
const DESCRIPTION =
  "دار نشر وتوزيع أردنية: إصدارات أكاديمية وأدبية، خدمات تحرير وتصميم وطباعة وترقيم دولي للمؤلفين.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "Publisher"],
              "@id": `${site.url}/#organization`,
              name: "دار الراية للنشر والتوزيع",
              alternateName: "Dar Al-Raya Publishing & Distribution",
              url: site.url,
              email: site.email,
              foundingDate: String(site.founded),
              logo: `${site.url}/alraya.png`,
              image: OG_IMAGE,
              sameAs: [site.facebook].filter(Boolean),
              address: {
                "@type": "PostalAddress",
                addressLocality: "Amman",
                addressCountry: "JO",
              },
            },
            {
              "@type": "WebSite",
              "@id": `${site.url}/#website`,
              url: site.url,
              name: TITLE,
              inLanguage: ["ar", "en"],
              publisher: { "@id": `${site.url}/#organization` },
            },
          ],
        }),
      },
    ],
  }),
  component: Home,
});

// ─────────────────────────────────────────────────────────────
// Shared book-detail dialog — used by both carousels
// ─────────────────────────────────────────────────────────────
function BookDialog({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const { tx, lang } = useI18n();
  const { items, addItem, incrementQty, decrementQty } = useCart();
  const quantity = book ? items.find((item) => item.slug === book.slug)?.quantity ?? 0 : 0;
  return (
    <Dialog open={book !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        {book ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{tx(book.title)}</DialogTitle>
              <DialogDescription>{book.authors.map((a) => tx(a)).join(" · ")}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <div className="w-full sm:w-44 shrink-0">
                <BookCover book={book} />
              </div>

              <div className="flex-1 flex flex-col min-w-0 gap-3">
                <h2 className="font-display text-xl leading-snug sm:text-2xl">
                  {tx(book.title)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {book.authors.map((a) => tx(a)).join(" · ")}
                </p>

                <div className="flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {book.isbn && <span><strong className="text-foreground">ISBN:</strong> {book.isbn}</span>}
                  {book.pages && <span><strong className="text-foreground">{lang === "ar" ? "عدد الصفحات:" : "Pages:"}</strong> {book.pages}</span>}
                  {book.year && <span><strong className="text-foreground">{lang === "ar" ? "سنة النشر:" : "Year:"}</strong> {book.year}</span>}
                </div>

                {(book.summary?.ar || book.summary?.en) && (
                  <p className="text-sm leading-relaxed text-muted-foreground border-t border-border pt-3 line-clamp-5">
                    {book.summary[lang] || book.summary.ar || book.summary.en}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                  <span className="font-display text-2xl text-brass">${book.price.toFixed(2)}</span>
                  {quantity > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded-full border border-brass/30 bg-background px-1 shadow-sm">
                      <button type="button" onClick={() => decrementQty(book.slug)} className="flex h-9 w-9 items-center justify-center rounded-full text-brass transition hover:bg-brass/10" aria-label={lang === "ar" ? "نقص العدد" : "Decrease quantity"}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold text-brass">{quantity}</span>
                      <button type="button" onClick={() => incrementQty(book.slug)} className="flex h-9 w-9 items-center justify-center rounded-full text-brass transition hover:bg-brass/10" aria-label={lang === "ar" ? "زيادة العدد" : "Increase quantity"}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => addItem(book)} className="inline-flex items-center gap-2 bg-brass px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-brass/90 rounded-xl">
                      <Plus className="h-4 w-4" />
                      {lang === "ar" ? "أضف إلى السلة" : "Add to cart"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Embla infinite-loop carousel — NO manual tripling.
// Embla's built-in loop:true handles seamless cloning so slides
// never jump or disappear.
// ─────────────────────────────────────────────────────────────
function BookCarousel({
  bookList,
  onSelect,
  showNewBadge,
}: {
  bookList: Book[];
  onSelect?: (book: Book) => void;
  showNewBadge?: boolean;
}) {
  const { lang } = useI18n();
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      dragFree: true,
      direction: lang === "ar" ? "rtl" : "ltr",
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const displayBooks = bookList.length > 0 ? bookList : books.slice(0, 8);

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {displayBooks.map((book, i) => (
          <div key={`${book.slug}-${i}`} className="flex-[0_0_224px] min-w-0 sm:flex-[0_0_244px] ltr:pr-6 rtl:pl-6">
            <BookCard
              book={book}
              showNewBadge={showNewBadge}
              onClick={onSelect ? () => onSelect(book) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CSS-keyframe marquee strip — draggable, pauses on hover/touch
// ─────────────────────────────────────────────────────────────
function BookMarquee({
  bookList,
  speed = 50,
  onSelect,
  showNewBadge,
}: {
  bookList: Book[];
  speed?: number;
  onSelect?: (book: Book) => void;
  showNewBadge?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startOffset.current = offset;
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setOffset(startOffset.current + (e.clientX - startX.current));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    setPaused(false);
    setOffset(0); // React 18 batches with setPaused — outer wrapper transitions smoothly to 0
  };

  if (bookList.length === 0) return null;

  const doubled = [...bookList, ...bookList];
  const dur = Math.max(bookList.length * 4, 20);

  return (
    <div
      className="overflow-hidden py-4 select-none"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => !isDragging.current && setPaused(true)}
      onMouseLeave={() => {
        if (!isDragging.current) setPaused(false);
      }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => {
        if (!isDragging.current) setPaused(false);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Outer div: handles drag offset only */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? "none" : "transform 0.4s ease-out",
        }}
      >
        {/* Inner div: runs the CSS marquee animation independently of drag offset */}
        <div
          ref={trackRef}
          className="flex gap-6"
          style={{
            animation: `marquee ${dur}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
            width: "max-content",
          }}
        >
        {doubled.map((b, i) => (
          <div key={`${b.slug}-${i}`} className="w-44 shrink-0" style={{ pointerEvents: "auto" }}>
            <BookCard
              book={b}
              showNewBadge={showNewBadge}
              onClick={onSelect ? () => onSelect(b) : undefined}
            />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────────────────────
function Home() {
  const { t, tx } = useI18n();
  const { content, hydrated } = useContent();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const allBooks = useCatalogBooks();
  const publishedBooks = allBooks.filter(
    (book) => Boolean(book.cover) && !content.archivedSlugs.includes(book.slug),
  );
  const selectedFeatured = booksBySlugs(content.featured, allBooks).filter(
    (book) => Boolean(book.cover) && !content.archivedSlugs.includes(book.slug),
  );
  const selectedNewReleases = booksBySlugs(content.newReleases, allBooks).filter(
    (book) => Boolean(book.cover) && !content.archivedSlugs.includes(book.slug),
  );
  const newestPublished = [...publishedBooks].sort((a, b) => b.year - a.year || a.title.ar.localeCompare(b.title.ar, "ar"));

  // Both public strips can only contain published books that have real cover artwork.
  const featuredBooks = hydrated && selectedFeatured.length > 0
    ? selectedFeatured.slice(0, 10)
    : newestPublished.slice(0, 10);
  const newReleasesBooks = hydrated && selectedNewReleases.length > 0
    ? selectedNewReleases.slice(0, 10)
    : newestPublished.slice(0, 10);

  const displayCategories = content.categories.filter((c) => publishedBooks.some((b) => b.category === c.slug));

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="إصدارات دار الراية للنشر والتوزيع"
          width={1600}
          height={1104}
          className="hero-drift absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="veil absolute inset-0" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-28 sm:px-8 lg:px-10">
          <p className="fade-up font-display text-lg tracking-[0.15em] text-brass-soft sm:text-xl">
            {tx(content.hero.title)} — {tx(content.hero.subtitle)}
          </p>
          <h1 className="fade-up mt-9 font-display text-5xl leading-[0.98] text-balance-title sm:text-6xl lg:text-7xl">
            <span className="gold-text">{tx(content.hero.tagline)}</span>
          </h1>
          <div
            className="hairline my-9 max-w-md origin-[inline-start] animate-[fadeUp_1.4s_var(--ease-silk)_both]"
            style={{ animationDelay: "200ms" }}
          />
          <div className="fade-up mt-11 flex flex-wrap gap-4">
            <Link
              to="/books"
              search={{ category: undefined, q: undefined }}
              className="sheen nudge inline-flex items-center gap-2.5 bg-primary px-8 py-4 text-sm font-medium tracking-wide text-primary-foreground shadow-[var(--shadow-brass)] transition-transform duration-500 hover:-translate-y-0.5"
            >
              {t("hero.cta")}
            </Link>
            <Link
              to="/downloads"
              className="nudge inline-flex items-center gap-2.5 border border-border px-8 py-4 text-sm tracking-wide transition-colors duration-500 hover:border-primary hover:text-brass-soft"
            >
              {t("nav.downloads")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border lg:px-10 rtl:divide-x-reverse">
          {[
            { v: "950+", k: "stat.titles" },
            { v: String(site.founded), k: "stat.since" },
          ].map((s, i) => (
            <Reveal
              key={s.k}
              delay={i * 90}
              className="px-6 py-12 text-center transition-colors duration-500 hover:bg-surface/40"
            >
              <p className="font-display text-4xl text-brass-soft sm:text-5xl">{s.v}</p>
              <p className="mt-2.5 text-sm tracking-wide text-muted-foreground">{t(s.k)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-display text-4xl text-balance-title sm:text-5xl lg:text-6xl">
              {t("section.categories")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("section.categories.sub")}
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {displayCategories.map((c, i) => {
            const n = books.filter((b) => b.category === c.slug).length;
            return (
              <Reveal key={c.slug} delay={(i % 3) * 110} variant="rise">
                <Link
                  to="/books"
                  search={{ category: c.slug, q: undefined }}
                  className="sheen group flex h-full flex-col bg-background p-9 transition-colors duration-500 hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-xl transition-colors duration-500 group-hover:text-brass-soft sm:text-2xl">
                      {tx(c.name)}
                    </h3>
                    <span className="text-sm text-muted-foreground">{n}</span>
                  </div>
                  <p className="prose-ar mt-4 text-sm text-muted-foreground">{tx(c.blurb)}</p>
                  <span className="mt-7 inline-flex translate-y-1 items-center gap-2 text-[0.65rem] tracking-[0.2em] text-brass uppercase opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {t("section.viewAll")}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Featured books carousel ── */}
      {featuredBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
          <Reveal>
            <p className="font-display text-2xl text-brass-soft sm:text-3xl">
              {t("section.featured")}
            </p>
          </Reveal>
          <div className="mt-6">
            <BookCarousel bookList={featuredBooks} onSelect={setSelectedBook} />
          </div>
        </section>
      )}

      {/* ── New releases carousel — every card gets the red "جديد" badge ── */}
      {newReleasesBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-28 sm:px-8 lg:px-10">
          <Reveal>
            <p className="font-display text-2xl text-brass-soft sm:text-3xl">{t("section.new")}</p>
          </Reveal>
          <div className="mt-6">
            <BookCarousel
              bookList={newReleasesBooks}
              onSelect={setSelectedBook}
              showNewBadge={true}
            />
          </div>
        </section>
      )}

      {/* ── Book detail dialog ── */}
      <BookDialog book={selectedBook} onClose={() => setSelectedBook(null)} />
    </>
  );
}
