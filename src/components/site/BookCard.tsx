import { useI18n } from "@/lib/i18n";
import { BookCover } from "./BookCover";
import { type Book } from "@/data/catalog";
import { useContent } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function BookCard({
  book,
  className,
  onClick,
  showNewBadge,
}: {
  book: Book;
  className?: string;
  onClick?: () => void;
  /** Force-show the red "جديد" badge (e.g. in the new-releases carousel). */
  showNewBadge?: boolean;
}) {
  const { tx, lang } = useI18n();
  const { content } = useContent();
  const cat = content.categories.find((c) => c.slug === book.category);
  const { items, addItem, incrementQty, decrementQty } = useCart();
  const cartItem = items.find((i) => i.slug === book.slug);
  const quantity = cartItem?.quantity ?? 0;
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addItem(book);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <article
      className={cn("group relative flex flex-col", onClick ? "cursor-pointer" : "", className)}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
    >
      <div className="relative block">
        <BookCover
          book={book}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {/* "جديد" badge — shown for new-release carousel or year ≥ 2026 books */}
        {(showNewBadge || book.year >= 2026) && (
          <span
            className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[0.6rem] px-2 py-1 font-semibold z-10"
            style={{ direction: "rtl" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
            جديد
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {cat && <span className="text-[0.95rem] tracking-wide text-brass">{tx(cat.name)}</span>}
        <h3 className="mt-1 font-display text-base leading-snug line-clamp-2">{tx(book.title)}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {book.authors.map((a) => tx(a)).join(" · ")}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-brass">${book.price.toFixed(2)}</span>
          {quantity > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-brass/30 bg-background/95 px-1 shadow-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  decrementQty(book.slug);
                }}
                className="relative z-20 flex h-9 w-9 items-center justify-center rounded-full text-brass/80 transition hover:text-brass"
                aria-label={lang === "ar" ? "نقص العدد" : "Decrease quantity"}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-brass">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  incrementQty(book.slug);
                }}
                className="relative z-20 flex h-9 w-9 items-center justify-center rounded-full text-brass/80 transition hover:text-brass"
                aria-label={lang === "ar" ? "زيادة العدد" : "Increase quantity"}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={lang === "ar" ? "أضف" : "Add"}
              className="relative z-20 inline-flex h-9 items-center justify-center rounded-full border border-brass/40 bg-brass/95 px-4 text-brass transition duration-300 hover:bg-brass"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
