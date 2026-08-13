import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getCategory, type Book } from "@/data/catalog";
import { useCatalogBooks } from "@/lib/use-catalog-books";
import { useContent } from "@/lib/content";
import { BookCard } from "@/components/site/BookCard";
import { useCart } from "@/lib/cart";
import { BookCover } from "@/components/site/BookCover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SortKey = "newest" | "alpha";

const SORT_OPTIONS: { value: SortKey; ar: string; en: string }[] = [
  { value: "newest", ar: "الأحدث", en: "Newest" },
  { value: "alpha", ar: "أبجدياً", en: "A → Z" },
];

export const Route = createFileRoute("/books_backup")({
  head: () => ({
    meta: [
      { title: "الإصدارات | دار الراية للنشر والتوزيع" },
      {
        name: "description",
        content:
          "تصفّح إصدارات دار الراية: كتب تربوية وإدارية وأدبية وشعرية وإسلامية وكتب أطفال، مع البحث حسب المؤلف والتخصص.",
      },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { t, tx, lang } = useI18n();
  const { content } = useContent();
  const books = useCatalogBooks();
  const categories = content.categories;
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const { addItem } = useCart();
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let result = books;
    if (category) result = result.filter((b) => b.category === category);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.ar.includes(query) ||
          b.title.en?.toLowerCase().includes(q) ||
          b.authors.some((a) => a.ar.includes(query) || a.en?.toLowerCase().includes(q)),
      );
    }
    switch (sort) {
      case "alpha":
        result = [...result].sort((a, b) => a.title.ar.localeCompare(b.title.ar));
        break;
      default:
        result = [...result].sort((a, b) => b.year - a.year);
    }
    return result;
  }, [books, category, query, sort]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      {/* Header */}
      <p className="eyebrow">{t("nav.books")}</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">{t("books.hero")}</h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("books.lead")}</p>

      <div className="hairline my-10" />

      {/* Filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("books.search")}
            className="w-full border border-border bg-surface/50 py-3 text-sm outline-none focus:border-primary ltr:pl-10 rtl:pr-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={
                sort === s.value
                  ? "border border-brass px-3 py-2 text-xs text-brass whitespace-nowrap"
                  : "border border-border px-3 py-2 text-xs text-muted-foreground whitespace-nowrap hover:border-brass/40"
              }
            >
              {lang === "ar" ? s.ar : s.en}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={
            !category
              ? "border border-brass bg-brass/10 px-4 py-1.5 text-xs text-brass"
              : "border border-border px-4 py-1.5 text-xs text-muted-foreground hover:border-brass/40"
          }
        >
          {t("books.all")} ({books.length})
        </button>
        {categories.map((c) => {
          const count = books.filter((b) => b.category === c.slug).length;
          if (count === 0) return null;
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug === category ? undefined : c.slug)}
              className={
                category === c.slug
                  ? "border border-brass bg-brass/10 px-4 py-1.5 text-xs text-brass"
                  : "border border-border px-4 py-1.5 text-xs text-muted-foreground hover:border-brass/40"
              }
            >
              {tx(c.name)} ({count})
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {lang === "ar" ? `${filtered.length} كتاب` : `${filtered.length} books`}
      </p>

      {/* Book grid */}
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((book) => (
  <BookCard key={book.slug} book={book} onClick={() => setSelectedBook(book)} />
))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">{t("books.empty")}</p>
      )}
      {/* ── Book detail dialog ── */}
      <Dialog open={selectedBook !== null} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent className="sm:max-w-2xl overflow-hidden">
          {selectedBook ? (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{tx(selectedBook.title)}</DialogTitle>
                <DialogDescription>
                  {selectedBook.authors.map((a) => tx(a)).join(" · ")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-6 pt-2">
                <div className="w-full sm:w-44 shrink-0">
                  <BookCover book={selectedBook} />
                </div>

                <div className="flex-1 flex flex-col min-w-0 gap-3">
                  <span className="self-start text-[0.6rem] tracking-[0.18em] uppercase border border-brass/40 px-3 py-1 text-brass">
                    {tx(
                      getCategory(selectedBook.category)?.name ?? {
                        ar: selectedBook.category,
                        en: selectedBook.category,
                      },
                    )}
                  </span>

                  <h2 className="font-display text-xl leading-snug sm:text-2xl">
                    {tx(selectedBook.title)}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {selectedBook.authors.map((a) => tx(a)).join(" · ")}
                  </p>

                  {selectedBook.summary.ar || selectedBook.summary.en ? (
                    <p className="text-sm leading-relaxed text-muted-foreground border-t border-border pt-3 line-clamp-5">
                      {selectedBook.summary[lang] ||
                        selectedBook.summary.ar ||
                        selectedBook.summary.en}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground border-t border-border pt-3 italic">
                      {lang === "ar" ? "لا يوجد وصف متاح." : "No description available."}
                    </p>
                  )}

                  {books.filter((book) => book.category === selectedBook.category && book.slug !== selectedBook.slug).slice(0, 3).length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="mb-3 text-xs font-semibold text-muted-foreground">{lang === "ar" ? "كتب ذات صلة" : "Related books"}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {books.filter((book) => book.category === selectedBook.category && book.slug !== selectedBook.slug).slice(0, 3).map((book) => (
                          <button key={book.slug} type="button" onClick={() => setSelectedBook(book)} className="text-start">
                            <BookCover book={book} className="aspect-[3/4] object-cover" />
                            <span className="mt-2 block line-clamp-2 text-xs">{tx(book.title)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                    <span className="font-display text-2xl text-brass">
                      ${selectedBook.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(selectedBook)}
                      className="inline-flex items-center gap-2 bg-brass px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-brass/90"
                    >
                      {lang === "ar" ? "أضف إلى السلة" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
