import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Book } from "@/data/catalog";

/**
 * Typographic cover: renders a designed spine/cover from the book's own
 * metadata when no artwork file is supplied.
 */
export function BookCover({
  book,
  className,
}: {
  book: Book;
  className?: string;
}) {
  const { tx } = useI18n();

  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={tx(book.title)}
        loading="lazy"
        className={cn(
          "aspect-[2/3] w-full object-cover shadow-[var(--shadow-lift)]",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grain relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden border border-border p-5",
        "shadow-[var(--shadow-lift)]",
        className,
      )}
      style={{ background: "var(--gradient-spine)" }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 w-[6px] opacity-70 ltr:left-0 rtl:right-0"
        style={{ background: "var(--gradient-brass)" }}
      />
      <div className="relative">
        <div className="hairline mb-4 w-10" />
        <p className="font-display text-[1.05rem] leading-snug text-cream">
          {tx(book.title)}
        </p>
      </div>
      <div className="relative">
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          {book.authors.map((a) => tx(a)).join(" · ")}
        </p>
        <p className="mt-3 text-[0.6rem] tracking-[0.25em] text-brass uppercase">
          Dar Al-Raya
        </p>
      </div>
    </div>
  );
}
