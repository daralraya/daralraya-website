/**
 * SITE CONTENT STORE
 * ------------------------------------------------------------------
 * Editable content (hero, featured books) lives here.
 * Defaults come from the code in src/data/*. The /admin page can override
 * them and the change is written to a REAL FILE on the server
 * (src/data/content-store.json) via a server function — so it's a genuine
 * change for every visitor, not just the editor's own browser.
 *
 * localStorage is still used, but only as an instant local cache so the
 * UI updates immediately without waiting on a round trip — it is never
 * the source of truth anymore.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Bilingual, Category } from "@/data/catalog";
import { books, featuredSlugs, newReleaseSlugs, categories as defaultCategories } from "@/data/catalog";
import { getContentStore, saveContentStore } from "./content-server";

const safeFeaturedSlugs = Array.isArray(featuredSlugs) ? featuredSlugs : [];
const safeNewReleaseSlugs = Array.isArray(newReleaseSlugs) ? newReleaseSlugs.slice(0, 12) : [];

export type Hero = {
  eyebrow: Bilingual;
  title: Bilingual;
  subtitle: Bilingual;
  tagline: Bilingual;
};

export type VisualOverride = {
  selector: string;
  text?: string;
  imageSrc?: string;
  styles: Record<string, string>;
};

export type AddedVisualImage = {
  id: string;
  parentSelector: string;
  src: string;
  alt: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualEditorState = {
  overrides: VisualOverride[];
  addedImages: AddedVisualImage[];
};

export type SiteContent = {
  hero: Hero;
  /** Book slugs shown in the "Selected by the house" grid. */
  featured: string[];
  /** Book slugs shown in the "New releases" grid. */
  newReleases: string[];
  /** Editable list of subject categories — admin can add/edit/delete here. */
  categories: Category[];
  /** Books deliberately hidden from the public catalogue and homepage strips. */
  archivedSlugs: string[];
  /** Styles and elements produced by the admin-only live visual editor. */
  visualEditor: VisualEditorState;
};

export const defaultContent: SiteContent = {
  hero: {
    eyebrow: { ar: "دار نشر أردنية", en: "A Jordanian publishing house" },
    title: { ar: "دار الراية", en: "Dar Al-Raya" },
    subtitle: { ar: "للنشر والتوزيع", en: "Publishing & Distribution" },
    tagline: {
      ar: "نرفع رايتكم بين رفوف القرّاء ",
      en: "We raise your banner on readers' shelves — turning an idea into a book, and a book into a journey that reaches every reader.",
    },
  },
  featured: safeFeaturedSlugs,
  newReleases: safeNewReleaseSlugs,
  categories: defaultCategories,
  archivedSlugs: [],
  visualEditor: { overrides: [], addedImages: [] },
};

const STORAGE_KEY = "alraya.content.v2";

function merge(raw: unknown): SiteContent {
  if (!raw || typeof raw !== "object") return defaultContent;
  const p = raw as Partial<SiteContent>;
  return {
    hero: { ...defaultContent.hero, ...(p.hero ?? {}) },
    featured: Array.isArray(p.featured) ? p.featured : defaultContent.featured,
    newReleases: Array.isArray(p.newReleases)
      ? p.newReleases
      : defaultContent.newReleases,
    categories:
      Array.isArray(p.categories) && p.categories.length > 0
        ? p.categories
        : defaultContent.categories,
    archivedSlugs: Array.isArray(p.archivedSlugs) ? p.archivedSlugs : defaultContent.archivedSlugs,
    visualEditor: {
      overrides: Array.isArray(p.visualEditor?.overrides) ? p.visualEditor.overrides : defaultContent.visualEditor.overrides,
      addedImages: Array.isArray(p.visualEditor?.addedImages) ? p.visualEditor.addedImages : defaultContent.visualEditor.addedImages,
    },
  };
}

type Ctx = {
  content: SiteContent;
  hydrated: boolean;
  saving: boolean;
  saveError: string | null;
  save: (next: SiteContent) => Promise<void>;
  reset: () => void;
};

const ContentContext = createContext<Ctx | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached) setContent(merge(JSON.parse(cached)));
      } catch {
        /* ignore malformed local cache */
      }

      try {
        const serverData = await getContentStore();
        if (!cancelled && serverData) {
          const merged = merge(serverData);
          setContent(merged);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (e) {
        console.warn("Could not load content-store.json from server:", e);
      }

      if (!cancelled) setHydrated(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: SiteContent) => {
    setContent(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaving(true);
    setSaveError(null);
    try {
      await saveContentStore({ data: next });
    } catch (e) {
      console.error("Failed to save content-store.json on the server:", e);
      setSaveError(
        "تعذّر الحفظ على الخادم — التغيير محفوظ بمتصفحك مؤقتاً فقط. تأكد إن السيرفر شغال (npm run dev) وحاول مرة ثانية.",
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent(defaultContent);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ content, hydrated, saving, saveError, save, reset }),
    [content, hydrated, saving, saveError, save, reset],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}

export function booksBySlugs(slugs: string[], sourceBooks = books) {
  return slugs
    .map((slug) => sourceBooks.find((book) => book.slug === slug))
    .filter(Boolean) as typeof sourceBooks;
}
