import { useEffect, useState } from "react";
import { books as baseBooks, type Book } from "@/data/catalog";
import {
  getCatalogOverrides,
  saveCatalogOverrides,
  type CatalogOverrides,
} from "@/lib/catalog-overrides-server";

export function mergeCatalogBooks(overrides: CatalogOverrides): Book[] {
  const edited = overrides.edited as Record<string, Partial<Book>>;
  const added = overrides.added as Book[];
  const merged = baseBooks.map((book) => ({ ...book, ...(edited[book.slug] ?? {}) }));
  const existingSlugs = new Set(merged.map((book) => book.slug));
  const mergedAdded = added
    .filter((book) => !existingSlugs.has(book.slug))
    .map((book) => ({ ...book, ...(edited[book.slug] ?? {}) }));
  return [...merged, ...mergedAdded];
}

export async function persistBookOverride(slug: string, patch: Partial<Book>): Promise<Book | undefined> {
  const current = await getCatalogOverrides();
  const edited = current.edited as Record<string, Partial<Book>>;
  const added = current.added as Book[];
  const next: CatalogOverrides = {
    edited: {
      ...edited,
      [slug]: {
        ...(edited[slug] ?? {}),
        ...patch,
      },
    },
    added,
  };

  await saveCatalogOverrides({ data: next });
  return mergeCatalogBooks(next).find((book) => book.slug === slug);
}

export async function persistAddedBook(book: Book): Promise<Book> {
  const current = await getCatalogOverrides();
  const added = current.added as Book[];
  const next: CatalogOverrides = {
    edited: current.edited,
    added: [...added.filter((candidate) => candidate.slug !== book.slug), book],
  };
  await saveCatalogOverrides({ data: next });
  return book;
}

export function useCatalogBooks(): Book[] {
  const [books, setBooks] = useState<Book[]>(baseBooks);

  useEffect(() => {
    let cancelled = false;
    getCatalogOverrides()
      .then((overrides) => {
        if (!cancelled) setBooks(mergeCatalogBooks(overrides));
      })
      .catch((error) => console.error("Could not load catalog overrides", error));

    return () => {
      cancelled = true;
    };
  }, []);

  return books;
}
