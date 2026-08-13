import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useContent } from "@/lib/content";
import { useCatalogBooks } from "@/lib/use-catalog-books";
import { BookCover } from "@/components/site/BookCover";
import { BookCard } from "@/components/site/BookCard";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Plus, Minus, ArrowRight, ArrowLeft, BookOpen, Calendar, Tag, Barcode, Award, User, Layers } from "lucide-react";

export const Route = createFileRoute("/books/$slug")({
  component: BookDetailPage,
});

function BookDetailPage() {
  const { slug } = Route.useParams();
  const { lang, tx } = useI18n();
  const { content } = useContent();
  const { items, incrementQty, decrementQty, setQty } = useCart();
  const allBooks = useCatalogBooks();

  const book = allBooks.find((b) => b.slug === slug) || allBooks[0];
  const category = content.categories.find((c) => c.slug === book.category);
  const relatedBooks = allBooks
    .filter((b) => b.category === book.category && b.slug !== book.slug)
    .slice(0, 4);

  const cartItem = items.find((i) => i.slug === book.slug);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    setQty(book.slug, 1);
  };

  const isAr = lang === "ar";
  const backText = isAr ? "العودة إلى الكتب" : "Back to books";

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      {/* Back link */}
      <Link
        to="/books"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brass transition-colors mb-8"
      >
        {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        {backText}
      </Link>

      <div className="grid gap-12 lg:grid-cols-[400px_1fr]">
        {/* Cover & Order — appears on the RIGHT in RTL since it's first in source order */}
        <aside className="space-y-6 lg:order-first">
          <div className="rounded-[2.5rem] border border-border bg-surface/90 p-6 shadow-[var(--shadow-lift)] text-center">
            <div className="mx-auto w-full max-w-[320px] aspect-[2/3] overflow-hidden rounded-2xl border border-border shadow-md">
              <BookCover book={book} className="h-full w-full object-cover" />
            </div>
            <div className="mt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "سعر الكتاب المعتمد" : "Official Price"}</p>
              <p className="mt-1 text-4xl font-bold text-brass">${book.price.toFixed(2)}</p>
            </div>

            <div className="mt-8 space-y-4">
              {quantity > 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-brass/30 bg-background/90 p-3">
                  <button
                    type="button"
                    onClick={() => decrementQty(book.slug)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-brass transition hover:border-brass hover:bg-brass/10"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center text-lg font-bold text-foreground">{quantity}</div>
                  <button
                    type="button"
                    onClick={() => incrementQty(book.slug)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-brass transition hover:border-brass hover:bg-brass/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-brass)] transition hover:opacity-90"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isAr ? "أضف إلى السلة والطلب" : "Add to Order Cart"}
                </button>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? "توصيل سريع لكافة المدن العربية والدولية. طلبات مباشرة عبر الواتساب."
                  : "Fast delivery to all destinations. Direct WhatsApp checkout."}
              </p>
            </div>
          </div>
        </aside>

        {/* Details */}
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-border bg-surface/90 p-8 sm:p-12 shadow-[var(--shadow-lift)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-brass/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brass">
                {category ? tx(category.name) : (isAr ? "عام" : "General")}
              </span>
              {book.year && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground border border-border">
                  <Calendar className="h-3.5 w-3.5 text-brass" />
                  {book.year}
                </span>
              )}
              {book.isbn && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-1.5 text-xs font-mono font-medium text-muted-foreground border border-border">
                  <Barcode className="h-3.5 w-3.5 text-brass" />
                  ISBN: {book.isbn}
                </span>
              )}
            </div>

            <h1 className="mt-6 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {tx(book.title)}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-base text-muted-foreground border-t border-border/60 pt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-brass" />
                <span className="font-semibold text-foreground">
                  {isAr ? "المؤلف:" : "Author:"}
                </span>
                <span>{book.authors.map((a) => tx(a)).join("، ")}</span>
              </div>
              {book.edition && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-brass" />
                  <span className="font-semibold text-foreground">
                    {isAr ? "الطبعة:" : "Edition:"}
                  </span>
                  <span>{tx(book.edition)}</span>
                </div>
              )}
            </div>

            {/* Description / Summary */}
            <div className="mt-8 border-t border-border/60 pt-8">
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                {isAr ? "نبذة عن الكتاب" : "Book Overview"}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {book.summary && tx(book.summary)
                  ? tx(book.summary)
                  : (isAr
                      ? `كتاب قيّم بعنوان "${tx(book.title)}" تأليف ${book.authors.map((a) => tx(a)).join("، ")}، صادر عن دار الراية للنشر والتوزيع سنة ${book.year}، ويعد مرجعاً هاماً في تخصص ${category ? tx(category.name) : "الكتاب"}.`
                      : `A valuable publication titled "${tx(book.title)}" by ${book.authors.map((a) => tx(a)).join(", ")}, published by Dar Al-Raya in ${book.year}.`)}
              </p>
            </div>
          </div>

          {/* Additional info grid */}
          <div className="rounded-[2.5rem] border border-border bg-surface/80 p-8 shadow-[var(--shadow-lift)]">
            <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
              {isAr ? "المواصفات الفنية والتفاصيل" : "Technical Specifications & Details"}
            </h3>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/90 p-4">
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">{isAr ? "الناشر" : "Publisher"}</dt>
                <dd className="mt-1.5 font-semibold text-foreground">{isAr ? "دار الراية للنشر والتوزيع - عمان، الأردن" : "Dar Al-Raya Publishing - Amman, Jordan"}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-background/90 p-4">
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">{isAr ? "رقم الإيداع / ISBN" : "ISBN / Barcode"}</dt>
                <dd className="mt-1.5 font-mono font-semibold text-brass">{book.isbn || (isAr ? "متوفر ضمن الفهرس" : "Catalog ISBN")}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-background/90 p-4">
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">{isAr ? "سنة النشر" : "Publication Year"}</dt>
                <dd className="mt-1.5 font-semibold text-foreground">{book.year}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-background/90 p-4">
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">{isAr ? "التصنيف الرئيسي" : "Category"}</dt>
                <dd className="mt-1.5 font-semibold text-foreground">{category ? tx(category.name) : (isAr ? "عام" : "General")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Related books — same category, real data */}
      {relatedBooks.length > 0 && (
        <div className="mt-16 border-t border-border pt-12">
          <h3 className="font-display text-3xl font-semibold text-foreground mb-8">
            {isAr ? "كتب ذات صلة" : "Related Books"}
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedBooks.map((b) => (
              <Link key={b.slug} to="/books/$slug" params={{ slug: b.slug }}>
                <BookCard book={b} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
