import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { normalizeArabicForSearch } from "@/lib/arabic-search";
import { useContent, defaultContent, type SiteContent, booksBySlugs } from "@/lib/content";
import { useAnalytics } from "@/lib/analytics";
import { type Book, type Category } from "@/data/catalog";
import { persistAddedBook, persistBookOverride, useCatalogBooks } from "@/lib/use-catalog-books";
import { uploadCatalogCover } from "@/lib/catalog-cover-upload-server";
import { BookCover } from "@/components/site/BookCover";
import { LiveVisualEditor } from "@/components/admin/LiveVisualEditor";
import { DownloadsManager } from "@/components/admin/DownloadsManager";
import { SecurityManager } from "@/components/admin/SecurityManager";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  changeAdminPassword,
  getAdminAuthStatus,
  loginAdmin,
  logoutAdmin,
  requestAdminPasswordReset,
  resetAdminPassword,
} from "@/lib/admin-auth";
import { Plus, Trash2, Edit3, Search, Eye, X, Save, Upload } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحرير | دار الراية" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const field =
  "w-full border border-border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brass";
const labelClass = "mb-1.5 block text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase";

/* ─── LOGIN / PASSWORD RECOVERY ─── */
function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("ceo@alraya-jo.com");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await loginAdmin({ data: { password: pass } });
      onUnlock();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  const submitResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await requestAdminPasswordReset({ data: { email } });
      toast.success("إذا كان البريد صحيحاً، ستصل رسالة إعادة التعيين قريباً");
      setForgot(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال الطلب");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5">
      <p className="eyebrow">لوحة التحكم</p>
      <h1 className="mt-3 font-display text-4xl">أدخل كلمة السر</h1>
      {!forgot ? (
        <>
          <form className="mt-8 flex gap-3" onSubmit={submitLogin}>
            <input type="password" value={pass} onChange={(event) => setPass(event.target.value)} className={field} autoComplete="current-password" placeholder="كلمة السر" />
            <button disabled={busy} className="bg-primary px-6 py-2.5 text-sm text-primary-foreground disabled:opacity-50">{busy ? "جارٍ التحقق..." : "دخول"}</button>
          </form>
          <button type="button" onClick={() => setForgot(true)} className="mt-4 self-start text-sm text-brass-soft underline-offset-4 hover:underline">نسيت كلمة السر؟</button>
        </>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={submitResetRequest}>
          <p className="text-sm leading-relaxed text-muted-foreground">أدخل بريد الاسترداد لإرسال رابط إعادة تعيين صالح لمرة واحدة.</p>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} autoComplete="email" required />
          <div className="flex gap-3">
            <button type="button" onClick={() => setForgot(false)} className="border border-border px-5 py-2.5 text-sm">إلغاء</button>
            <button disabled={busy} className="bg-primary px-6 py-2.5 text-sm text-primary-foreground disabled:opacity-50">{busy ? "جارٍ الإرسال..." : "إرسال رابط الاسترداد"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AdminResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
      toast.error(`يجب أن تتكون كلمة السر من ${ADMIN_PASSWORD_MIN_LENGTH} حرفاً أو أكثر`);
      return;
    }
    if (password !== confirm) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      await resetAdminPassword({ data: { token, newPassword: password } });
      toast.success("تم تغيير كلمة السر");
      window.history.replaceState({}, "", "/admin");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "الرابط غير صالح أو انتهت صلاحيته");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5">
      <p className="eyebrow">لوحة التحكم</p>
      <h1 className="mt-3 font-display text-4xl">تعيين كلمة سر جديدة</h1>
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} autoComplete="new-password" minLength={ADMIN_PASSWORD_MIN_LENGTH} placeholder="كلمة السر الجديدة" required />
        <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={field} autoComplete="new-password" placeholder="تأكيد كلمة السر الجديدة" required />
        <button disabled={busy} className="w-full bg-primary px-6 py-2.5 text-sm text-primary-foreground disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "حفظ كلمة السر"}</button>
      </form>
    </div>
  );
}

/* ─── MAIN ADMIN ─── */
function AdminPage() {
  const { lang } = useI18n();
  const { content, hydrated, save } = useContent();
  const { data: analyticsData } = useAnalytics();
  const catalogBooks = useCatalogBooks();
  const [unlocked, setUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [resetToken, setResetToken] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<SiteContent>(content);
  const [tab, setTab] = useState<
    "editor" | "books" | "archive" | "categories" | "featured" | "marquee" | "analytics" | "downloads" | "security"
  >("editor");

  // Custom books
  const [customBooks, setCustomBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [coverPatches, setCoverPatches] = useState<Record<string, string>>({});
  const [bookPatches, setBookPatches] = useState<Record<string, Partial<Book>>>({});
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);

  useEffect(() => {
    setResetToken(new URLSearchParams(window.location.search).get("token"));
    getAdminAuthStatus()
      .then((status) => setUnlocked(status.authenticated))
      .catch(() => setUnlocked(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (hydrated) setDraft(content);
  }, [hydrated, content]);

  if (!authChecked || resetToken === undefined) return null;
  if (resetToken) return <AdminResetPassword token={resetToken} />;
  if (!unlocked) return <AdminLogin onUnlock={() => setUnlocked(true)} />;

  const set = (patch: Partial<SiteContent>) => setDraft((d) => ({ ...d, ...patch }));

  const toggleSlug = (key: "featured" | "newReleases", slug: string) =>
    set({
      [key]: draft[key].includes(slug)
        ? draft[key].filter((s) => s !== slug)
        : [...draft[key], slug],
    } as Partial<SiteContent>);

  const reorderSlideshow = (
    key: "featured" | "newReleases",
    sourceSlug: string,
    targetSlug: string,
  ) => {
    if (sourceSlug === targetSlug) return;
    const ordered = [...draft[key]];
    const sourceIndex = ordered.indexOf(sourceSlug);
    const targetIndex = ordered.indexOf(targetSlug);
    if (sourceIndex < 0 || targetIndex < 0) return;
    ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, sourceSlug);
    set({ [key]: ordered } as Partial<SiteContent>);
  };

  const catalogSlugs = new Set(catalogBooks.map((book) => book.slug));
  const allBooks = [...catalogBooks, ...customBooks.filter((book) => !catalogSlugs.has(book.slug))].map((book) => ({
    ...book,
    ...(bookPatches[book.slug] ?? {}),
    ...(coverPatches[book.slug] ? { cover: coverPatches[book.slug] } : {}),
  }));
  const coverlessSlugs = new Set(allBooks.filter((book) => !book.cover).map((book) => book.slug));
  const archivedSlugSet = new Set([...draft.archivedSlugs, ...coverlessSlugs]);
  const publishedBooks = allBooks.filter((book) => !archivedSlugSet.has(book.slug));
  const archivedBooks = allBooks.filter((book) => archivedSlugSet.has(book.slug));
  const slideshowBooks = publishedBooks.filter((book) => Boolean(book.cover));

  const normalizedSearch = normalizeArabicForSearch(searchQuery);
  const matchesSearch = (book: Book) => {
    if (!normalizedSearch) return true;
    const fields = [
      book.title.ar,
      book.title.en,
      book.isbn,
      ...book.authors.flatMap((author) => [author.ar, author.en]),
    ];
    return fields.some((value) => normalizeArabicForSearch(value).includes(normalizedSearch));
  };

  const filteredBooks = publishedBooks.filter(matchesSearch);
  const filteredArchivedBooks = archivedBooks.filter(matchesSearch);

  const archiveBook = (slug: string) =>
    set({
      archivedSlugs: draft.archivedSlugs.includes(slug)
        ? draft.archivedSlugs
        : [...draft.archivedSlugs, slug],
    });

  const publishBook = (book: Book) => {
    if (!book.cover) {
      toast.error("أرفق غلافاً أولاً قبل نشر الكتاب");
      return;
    }
    set({ archivedSlugs: draft.archivedSlugs.filter((item) => item !== book.slug) });
  };

  const persistArchiveStatus = async (book: Book, nextArchived: boolean) => {
    if (!nextArchived && !book.cover) {
      toast.error("أرفق غلافاً أولاً قبل نشر الكتاب");
      return;
    }
    const nextDraft = {
      ...draft,
      archivedSlugs: nextArchived
        ? draft.archivedSlugs.includes(book.slug) ? draft.archivedSlugs : [...draft.archivedSlugs, book.slug]
        : draft.archivedSlugs.filter((slug) => slug !== book.slug),
    };
    setDraft(nextDraft);
    await save(nextDraft);
    toast.success(nextArchived ? "تم نقل الكتاب إلى الأرشيف" : "تم نشر الكتاب");
  };

  const uploadCover = async (book: Book, file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("الرجاء اختيار صورة JPG أو PNG أو WebP");
      return;
    }

    setUploadingSlug(book.slug);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الصورة"));
        reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        reader.readAsDataURL(file);
      });
      const uploaded = await uploadCatalogCover({ data: { slug: book.isbn || book.slug, dataUrl } });
      await persistBookOverride(book.slug, { cover: uploaded.cover });
      setCoverPatches((current) => ({ ...current, [book.slug]: uploaded.cover }));
      const nextDraft = { ...draft, archivedSlugs: draft.archivedSlugs.filter((item) => item !== book.slug) };
      setDraft(nextDraft);
      await save(nextDraft);
      toast.success("تم حفظ الغلاف ونشر الكتاب");
      return uploaded.cover;
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الغلاف");
      return undefined;
    } finally {
      setUploadingSlug(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <p className="eyebrow">alraya-jo.com</p>
      <h1 className="mt-3 font-display text-5xl">لوحة التحكم</h1>
      <p className="mt-4 max-w-3xl leading-loose text-muted-foreground">
        عدّل المحتوى، أضف كتب، تحكم بالتخصصات، اختر المختارات وأحدث الإصدارات، وراقب الإحصائيات.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-border overflow-x-auto">
        {(
          [
            ["editor", "المحرر المرئي"],
            ["books", "الكتب"],
            ["archive", `الأرشيف (${archivedBooks.length})`],
            ["categories", "التخصصات"],
            ["featured", "المختارات"],
            ["marquee", "معاينة الشريط"],
            ["analytics", "الإحصائيات"],
            ["downloads", "التنزيلات"],
            ["security", "الأمان"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm whitespace-nowrap transition-colors ${
              tab === key
                ? "border-b-2 border-brass text-brass-soft font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ LIVE VISUAL EDITOR TAB ═══ */}
      {tab === "editor" && <LiveVisualEditor />}

      {/* ═══ BOOKS TAB ═══ */}
      {tab === "books" && (
        <>
          <AddBookSection
            categories={draft.categories}
            onSave={async (newBook) => {
              await persistAddedBook(newBook);
              setCustomBooks((current) => [...current, newBook]);
              toast.success("تمت إضافة الكتاب");
            }}
          />

          {/* Search */}
          <div className="mt-8 relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الكتب..."
              className="w-full border border-border bg-background/60 pr-10 py-2.5 text-sm outline-none focus:border-brass"
            />
          </div>

          {/* All books list */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">{filteredBooks.length} كتاب</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[60vh] overflow-y-auto pr-2">
              {filteredBooks.map((b) => {
                const isCustom = customBooks.find((cb) => cb.slug === b.slug);
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => setEditingBook(b)}
                    className="flex w-full items-start gap-3 border border-border p-3 text-right transition-colors hover:border-brass hover:bg-brass/5 group"
                  >
                    <div className="w-12 h-16 shrink-0">
                      <BookCover book={b} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.title.ar}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.authors[0]?.ar}</p>
                      <p className="text-xs text-brass mt-1">
                        ${b.price} · {b.year}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">انقر لتعديل بيانات الكتاب أو أرشفته</p>
                    </div>
                    {isCustom && <span className="text-[0.6rem] text-muted-foreground">مضاف</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ ARCHIVE TAB ═══ */}
      {tab === "archive" && (
        <Section title="الأرشيف">
          <p className="mb-5 text-sm text-muted-foreground">هذه الكتب لا تظهر للزوار في الموقع الرئيسي</p>
          <div className="relative max-w-md mb-5">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الأرشيف..."
              className="w-full border border-border bg-background/60 pr-10 py-2.5 text-sm outline-none focus:border-brass"
            />
          </div>
          {filteredArchivedBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد كتب في الأرشيف.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArchivedBooks.map((book) => (
                <div key={book.slug} role="button" tabIndex={0} onClick={() => setEditingBook(book)} className="flex cursor-pointer items-start gap-3 border border-border p-3 transition-colors hover:border-brass">
                  <div className="w-12 h-16 shrink-0">
                    {book.cover ? <BookCover book={book} /> : <div className="flex h-full items-center justify-center border border-dashed border-border text-[0.55rem] text-muted-foreground">بدون غلاف</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{book.title.ar}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.authors[0]?.ar}</p>
                    <p className="mt-3 text-xs text-muted-foreground">انقر لفتح التعديل ورفع الغلاف أو نشر الكتاب</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ═══ CATEGORIES TAB ═══ */}
      {tab === "categories" && (
        <CategoriesManager
          categories={draft.categories}
          onChange={async (nextCategories) => {
            const nextDraft = { ...draft, categories: nextCategories };
            setDraft(nextDraft);
            await save(nextDraft);
          }}
        />
      )}

      {/* ═══ FEATURED TAB ═══ */}
      {tab === "featured" && (
        <>
          <FeaturedSelector
            allBooks={slideshowBooks}
            featured={draft.featured}
            newReleases={draft.newReleases}
            onToggleFeatured={(slug) => toggleSlug("featured", slug)}
            onToggleNew={(slug) => toggleSlug("newReleases", slug)}
          />
        </>
      )}

      {/* ═══ MARQUEE PREVIEW TAB ═══ */}
      {tab === "marquee" && (
        <MarqueePreviewTab
          featured={draft.featured}
          newReleases={draft.newReleases}
          allBooks={slideshowBooks}
          onReorderFeatured={(source, target) => reorderSlideshow("featured", source, target)}
          onReorderNew={(source, target) => reorderSlideshow("newReleases", source, target)}
        />
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {tab === "analytics" && <AnalyticsTab analyticsData={analyticsData} />}

      {/* ═══ DOWNLOADS TAB ═══ */}
      {tab === "downloads" && <DownloadsManager />}

      {/* ═══ SECURITY TAB ═══ */}
      {tab === "security" && <SecurityManager onLogout={() => setUnlocked(false)} />}

      {/* Save bar for the content, books, archive and slideshow tabs. The visual editor saves its own history. */}
      {editingBook && (
        <BookEditModal
          book={editingBook}
          categories={draft.categories}
          archived={archivedSlugSet.has(editingBook.slug)}
          uploading={uploadingSlug === editingBook.slug}
          onClose={() => setEditingBook(null)}
          onSave={async (patch) => {
            const saved = await persistBookOverride(editingBook.slug, patch);
            if (saved) {
              setBookPatches((current) => ({ ...current, [editingBook.slug]: patch }));
              setEditingBook(saved);
            }
          }}
          onArchive={() => persistArchiveStatus(editingBook, true)}
          onPublish={() => persistArchiveStatus(editingBook, false)}
          onUpload={async (file) => {
            const cover = await uploadCover(editingBook, file);
            if (cover) setEditingBook((current) => current && current.slug === editingBook.slug ? { ...current, cover } : current);
            return cover;
          }}
        />
      )}

      {tab !== "editor" && <div className="sticky bottom-0 mt-12 flex flex-wrap gap-3 border-t border-border bg-background/95 py-5 backdrop-blur z-40">
        <button
          type="button"
          onClick={() => {
            save(draft);
            toast.success("تم الحفظ بنجاح");
          }}
          className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brass)]"
        >
          <Save className="h-4 w-4" />
          حفظ التغييرات
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("alraya.content.v2");
            window.location.reload();
          }}
          className="border border-border px-7 py-3.5 text-sm text-muted-foreground hover:border-destructive hover:text-destructive"
        >
          مسح الذاكرة
        </button>
      </div>}
    </div>
  );
}

/* ─── CONTENT TAB (retained for backward-compatible data) ─── */
function ContentTab({
  draft,
  set,
}: {
  draft: SiteContent;
  set: (patch: Partial<SiteContent>) => void;
}) {
  return (
    <>
      <Section title="نصوص الواجهة / Hero">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <span className={labelClass}>العنوان الرئيسي — عربي</span>
            <textarea
              rows={3}
              className={field}
              value={draft.hero.title.ar}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    title: { ...draft.hero.title, ar: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <span className={labelClass}>Main title — English</span>
            <textarea
              rows={3}
              className={field}
              value={draft.hero.title.en}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    title: { ...draft.hero.title, en: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mt-4">
          <div>
            <span className={labelClass}>الشعار / Slogan — عربي</span>
            <textarea
              rows={3}
              className={field}
              value={draft.hero.tagline.ar}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    tagline: { ...draft.hero.tagline, ar: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <span className={labelClass}>Slogan — English</span>
            <textarea
              rows={3}
              className={field}
              value={draft.hero.tagline.en}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    tagline: { ...draft.hero.tagline, en: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mt-4">
          <div>
            <span className={labelClass}>العنوان الفرعي — عربي</span>
            <textarea
              rows={2}
              className={field}
              value={draft.hero.subtitle.ar}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    subtitle: { ...draft.hero.subtitle, ar: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <span className={labelClass}>Subtitle — English</span>
            <textarea
              rows={2}
              className={field}
              value={draft.hero.subtitle.en}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    subtitle: { ...draft.hero.subtitle, en: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mt-4">
          <div>
            <span className={labelClass}>نص صغير — عربي</span>
            <textarea
              rows={2}
              className={field}
              value={draft.hero.eyebrow.ar}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    eyebrow: { ...draft.hero.eyebrow, ar: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <span className={labelClass}>Eyebrow — English</span>
            <textarea
              rows={2}
              className={field}
              value={draft.hero.eyebrow.en}
              onChange={(e) =>
                set({
                  hero: {
                    ...draft.hero,
                    eyebrow: { ...draft.hero.eyebrow, en: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>
      </Section>
    </>
  );
}

/* ─── ADD BOOK SECTION ─── */
function AddBookSection({
  categories,
  onSave,
}: {
  categories: Category[];
  onSave: (book: Book) => Promise<void>;
}) {
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [authorAr, setAuthorAr] = useState("");
  const [authorEn, setAuthorEn] = useState("");
  const [category, setCategory] = useState("literature");
  const [price, setPrice] = useState("");
  const [year, setYear] = useState("2026");
  const [isbn, setIsbn] = useState("");
  // Auto-fill cover when ISBN changes and no custom URL has been typed
  const [coverAutoFilled, setCoverAutoFilled] = useState(false);
  const [edition, setEdition] = useState("");
  const [summaryAr, setSummaryAr] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim()) {
      toast.error("عنوان الكتاب بالعربي مطلوب");
      return;
    }

    const slug =
      titleAr
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]/g, "") +
      "-" +
      Date.now().toString(36);
    const newBook: Book = {
      slug,
      title: { ar: titleAr.trim(), en: titleEn.trim() || titleAr.trim() },
      authors: [{ ar: authorAr.trim(), en: authorEn.trim() || authorAr.trim() }],
      category,
      price: parseFloat(price) || 15,
      currency: "USD",
      year: parseInt(year) || 2026,
      summary: { ar: summaryAr.trim(), en: summaryEn.trim() },
      ...(isbn.trim() ? { isbn: isbn.trim() } : {}),
      ...(edition.trim() ? { edition: { ar: edition.trim(), en: edition.trim() } } : {}),
      ...(pages.trim() && Number(pages) > 0 ? { pages: Number(pages) } : {}),
      ...(coverUrl.trim() ? { cover: coverUrl.trim() } : {}),
    };

    try {
      await onSave(newBook);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إضافة الكتاب");
      return;
    }
    setTitleAr("");
    setTitleEn("");
    setAuthorAr("");
    setAuthorEn("");
    setPrice("");
    setIsbn("");
    setEdition("");
    setSummaryAr("");
    setSummaryEn("");
    setPages("");
    setCoverUrl("");
    setCoverAutoFilled(false);
  };

  return (
    <Section title="إضافة كتاب جديد">
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className={labelClass}>عنوان الكتاب — عربي *</span>
          <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className={field} />
        </div>
        <div>
          <span className={labelClass}>Book title — English</span>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={field} />
        </div>
        <div>
          <span className={labelClass}>المؤلف — عربي</span>
          <input value={authorAr} onChange={(e) => setAuthorAr(e.target.value)} className={field} />
        </div>
        <div>
          <span className={labelClass}>Author — English</span>
          <input value={authorEn} onChange={(e) => setAuthorEn(e.target.value)} className={field} />
        </div>
        <div>
          <span className={labelClass}>التخصص</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name.ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelClass}>السعر ($)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={field}
            placeholder="15"
          />
        </div>
        <div>
          <span className={labelClass}>السنة</span>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={field}
            placeholder="2026"
          />
        </div>
        <div>
          <span className={labelClass}>عدد الصفحات</span>
          <input
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            className={field}
            placeholder="300"
          />
        </div>
        <div>
          <span className={labelClass}>ISBN</span>
          <input
            value={isbn}
            onChange={(e) => {
              const val = e.target.value;
              setIsbn(val);
              // Auto-fill cover URL with local Processed_Covers path when ISBN looks complete
              const trimmed = val.trim();
              if (trimmed.length >= 13 && trimmed.startsWith("97")) {
                setCoverUrl(`/Processed_Covers/${trimmed}.jpg`);
                setCoverAutoFilled(true);
              } else if (coverAutoFilled) {
                setCoverUrl("");
                setCoverAutoFilled(false);
              }
            }}
            className={field}
            placeholder="978-..."
          />
        </div>
        <div>
          <span className={labelClass}>الطبعة</span>
          <input
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            className={field}
            placeholder="الأولى"
          />
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>رابط صورة الغلاف (اختياري)</span>
          <div className="flex gap-3 items-start">
            <input
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                setCoverAutoFilled(false);
              }}
              className={field}
              placeholder="/Processed_Covers/978-....jpg أو رابط خارجي"
            />
            {coverUrl.trim() && (
              <img
                src={coverUrl.trim()}
                alt="معاينة الغلاف"
                className="h-24 w-16 shrink-0 object-cover border border-border shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                onLoad={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "block";
                }}
              />
            )}
          </div>
          {coverUrl.trim() && (
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              {coverUrl.startsWith("/Processed_Covers/")
                ? "📁 غلاف محلي من المجلد — تأكد أن الملف موجود في public/Processed_Covers/"
                : "🔗 رابط خارجي"}
            </p>
          )}
        </div>
        <div>
          <span className={labelClass}>ملخص — عربي</span>
          <textarea
            rows={3}
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <span className={labelClass}>Summary — English</span>
          <textarea
            rows={3}
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            className={field}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            إضافة الكتاب
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ─── CATEGORIES MANAGER ─── */
function CategoriesManager({
  categories: cats,
  onChange,
}: {
  categories: Category[];
  onChange: (categories: Category[]) => Promise<void>;
}) {
  const catalog = useCatalogBooks();
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [saving, setSaving] = useState(false);

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAr.trim() || saving) return;
    const slug = newAr.trim().replace(/\s+/g, "-");
    if (cats.some((c) => c.slug === slug)) {
      toast.error("هذا التخصص موجود بالفعل");
      return;
    }
    setSaving(true);
    try {
      await onChange([
        ...cats,
        {
          slug,
          name: { ar: newAr.trim(), en: newEn.trim() || newAr.trim() },
          blurb: { ar: "", en: "" },
        },
      ]);
      setNewAr("");
      setNewEn("");
      toast.success("تمت إضافة التخصص");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ التخصص");
    } finally {
      setSaving(false);
    }
  };

  const removeCat = async (slug: string) => {
    const count = catalog.filter((b) => b.category === slug).length;
    if (count > 0) {
      toast.error(`لا يمكن حذف "${slug}" — هناك ${count} كتب فيه`);
      return;
    }
    setSaving(true);
    try {
      await onChange(cats.filter((c) => c.slug !== slug));
      toast.success("تم حذف التخصص");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف التخصص");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="إدارة التخصصات">
      <form onSubmit={addCat} className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <span className={labelClass}>اسم التخصص — عربي</span>
          <input value={newAr} onChange={(e) => setNewAr(e.target.value)} className={field} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <span className={labelClass}>Category name — English</span>
          <input value={newEn} onChange={(e) => setNewEn(e.target.value)} className={field} />
        </div>
        <button
          type="submit"
          className="bg-primary px-5 py-2.5 text-sm text-primary-foreground h-10"
        >
          {saving ? "جارٍ الحفظ..." : "+ إضافة"}
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {cats.map((c) => {
          const count = catalog.filter((b) => b.category === c.slug).length;
          return (
            <div
              key={c.slug}
              className="flex items-center justify-between border border-border px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium">{c.name.ar}</span>
                <span className="text-sm text-muted-foreground mr-3">/ {c.name.en}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{count} كتاب</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => removeCat(c.slug)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── FEATURED SELECTOR — Improved UI ─── */
function FeaturedSelector({
  allBooks,
  featured,
  newReleases,
  onToggleFeatured,
  onToggleNew,
}: {
  allBooks: Book[];
  featured: string[];
  newReleases: string[];
  onToggleFeatured: (slug: string) => void;
  onToggleNew: (slug: string) => void;
}) {
  const [searchFeatured, setSearchFeatured] = useState("");
  const [searchNew, setSearchNew] = useState("");

  const featuredFiltered = searchFeatured
    ? allBooks.filter(
        (b) =>
          b.title.ar.includes(searchFeatured) ||
          b.title.en?.toLowerCase().includes(searchFeatured.toLowerCase()),
      )
    : allBooks;

  const newFiltered = searchNew
    ? allBooks.filter(
        (b) =>
          b.title.ar.includes(searchNew) ||
          b.title.en?.toLowerCase().includes(searchNew.toLowerCase()),
      )
    : allBooks;

  return (
    <>
      {/* Featured */}
      <Section title="مختارات الدار / Featured">
        <p className="text-sm text-muted-foreground mb-3">
          اختر الكتب التي تظهر في شريط "مختارات الدار" على الصفحة الرئيسية. الكتب المختارة:{" "}
          <span className="text-brass">{featured.length}</span>
        </p>

        <div className="relative max-w-md mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchFeatured}
            onChange={(e) => setSearchFeatured(e.target.value)}
            placeholder="بحث عن كتاب..."
            className="w-full border border-border bg-background/60 pr-10 py-2.5 text-sm outline-none focus:border-brass"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[50vh] overflow-y-auto pr-2">
          {featuredFiltered.map((b) => (
            <label
              key={b.slug}
              className={`flex items-center gap-3 border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                featured.includes(b.slug)
                  ? "border-brass bg-brass/10"
                  : "border-border hover:border-brass/40"
              }`}
            >
              <div className="w-8 h-11 shrink-0">
                <BookCover book={b} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{b.title.ar}</p>
                <p className="text-xs text-muted-foreground truncate">{b.authors[0]?.ar}</p>
              </div>
              <input
                type="checkbox"
                checked={featured.includes(b.slug)}
                onChange={() => onToggleFeatured(b.slug)}
                className="h-4 w-4 accent-brass shrink-0"
              />
            </label>
          ))}
        </div>
      </Section>

      {/* New Releases */}
      <Section title="أحدث الإصدارات / New Releases">
        <p className="text-sm text-muted-foreground mb-3">
          اختر الكتب التي تظهر في شريط "أحدث الإصدارات". الكتب المختارة:{" "}
          <span className="text-brass">{newReleases.length}</span>
        </p>

        <div className="relative max-w-md mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchNew}
            onChange={(e) => setSearchNew(e.target.value)}
            placeholder="بحث عن كتاب..."
            className="w-full border border-border bg-background/60 pr-10 py-2.5 text-sm outline-none focus:border-brass"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[50vh] overflow-y-auto pr-2">
          {newFiltered.map((b) => (
            <label
              key={b.slug}
              className={`flex items-center gap-3 border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                newReleases.includes(b.slug)
                  ? "border-brass bg-brass/10"
                  : "border-border hover:border-brass/40"
              }`}
            >
              <div className="w-8 h-11 shrink-0">
                <BookCover book={b} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{b.title.ar}</p>
                <p className="text-xs text-muted-foreground truncate">{b.authors[0]?.ar}</p>
              </div>
              <input
                type="checkbox"
                checked={newReleases.includes(b.slug)}
                onChange={() => onToggleNew(b.slug)}
                className="h-4 w-4 accent-brass shrink-0"
              />
            </label>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ─── MARQUEE PREVIEW TAB ─── */
function MarqueePreviewTab({
  featured,
  newReleases,
  allBooks,
  onReorderFeatured,
  onReorderNew,
}: {
  featured: string[];
  newReleases: string[];
  allBooks: Book[];
  onReorderFeatured: (source: string, target: string) => void;
  onReorderNew: (source: string, target: string) => void;
}) {
  return (
    <Section title="معاينة الشريط المتحرك">
      <ReorderableSlideshow
        title="مختارات الدار"
        slugs={featured}
        allBooks={allBooks}
        onReorder={onReorderFeatured}
      />
      <div className="my-10 border-t border-border" />
      <ReorderableSlideshow
        title="أحدث الإصدارات"
        slugs={newReleases}
        allBooks={allBooks}
        onReorder={onReorderNew}
      />
    </Section>
  );
}

function ReorderableSlideshow({
  title,
  slugs,
  allBooks,
  onReorder,
}: {
  title: string;
  slugs: string[];
  allBooks: Book[];
  onReorder: (source: string, target: string) => void;
}) {
  const selected = slugs
    .map((slug) => allBooks.find((book) => book.slug === slug))
    .filter(Boolean) as Book[];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl text-brass-soft">{title}</h3>
        <span className="text-xs text-muted-foreground">{selected.length} كتاباً</span>
      </div>
      <div className="overflow-hidden border border-border p-4 rounded-sm">
        <MarqueeStrip bookList={selected.length > 0 ? selected : allBooks.slice(0, 10)} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {selected.map((book, index) => (
          <div
            key={book.slug}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", book.slug);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const source = event.dataTransfer.getData("text/plain");
              if (source) onReorder(source, book.slug);
            }}
            className="group cursor-grab border border-border bg-background p-2 active:cursor-grabbing"
            title="اسحب الكتاب لتغيير ترتيبه"
          >
            <div className="flex gap-2">
              <div className="h-14 w-10 shrink-0"><BookCover book={book} /></div>
              <div className="min-w-0 flex-1">
                <span className="text-[0.6rem] text-brass">{index + 1}</span>
                <p className="line-clamp-2 text-xs leading-relaxed">{book.title.ar}</p>
                <p className="mt-1 text-[0.6rem] text-muted-foreground">اسحب لإعادة الترتيب</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MARQUEE STRIP — draggable infinite loop ─── */
function MarqueeStrip({ bookList }: { bookList: Book[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [animDur, setAnimDur] = useState("30s");
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  useEffect(() => {
    if (!trackRef.current) return;
    const total = trackRef.current.scrollWidth / 2;
    const speed = Math.max(total / 30, 1);
    const dur = total / speed;
    setAnimDur(`${Math.max(dur, 15)}s`);
  }, [bookList]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startOffset.current = offset;
    setPaused(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    setOffset(startOffset.current + dx);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    setPaused(false);
    setTimeout(() => setOffset(0), 100);
  };

  if (bookList.length === 0) return null;

  const doubled = [...bookList, ...bookList];

  return (
    <div
      className="overflow-hidden py-3 select-none"
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
      <div
        ref={trackRef}
        className="flex gap-5"
        style={{
          transform: `translateX(${offset}px)`,
          animation: paused ? "none" : `marquee ${animDur} linear infinite`,
          width: "max-content",
          transition: isDragging.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {doubled.map((b, i) => (
          <div key={`${b.slug}-${i}`} className="flex items-center gap-3 shrink-0 w-48">
            <div className="w-14 h-20 shrink-0">
              <BookCover book={b} />
            </div>
            <div>
              <p className="text-sm font-medium truncate">{b.title.ar}</p>
              <p className="text-xs text-muted-foreground truncate">{b.authors[0]?.ar}</p>
              <p className="text-xs text-brass mt-0.5">${b.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ANALYTICS TAB ─── */
function AnalyticsTab({
  analyticsData,
}: {
  analyticsData: {
    pageViews: { ts: number }[];
    bookClicks: { slug: string; title: string; ts: number }[];
  };
}) {
  const todayViews = analyticsData.pageViews.filter(
    (v) => new Date(v.ts).toDateString() === new Date().toDateString(),
  ).length;
  const totalViews = analyticsData.pageViews.length;

  const bookClickCounts: Record<string, { title: string; count: number }> = {};
  analyticsData.bookClicks.forEach((c) => {
    if (!bookClickCounts[c.slug]) {
      bookClickCounts[c.slug] = { title: c.title, count: 0 };
    }
    const entry = bookClickCounts[c.slug];
    if (entry) entry.count++;
  });
  const topBooks = Object.entries(bookClickCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);

  return (
    <>
      <Section title="الإحصائيات">
        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard label="زيارات اليوم" value={String(todayViews)} />
          <StatCard label="إجمالي الزيارات" value={String(totalViews)} />
          <StatCard label="ضغطات على الكتب" value={String(analyticsData.bookClicks.length)} />
        </div>

        <div className="mt-8">
          <h3 className="font-display text-xl text-brass-soft mb-4">الكتب الأكثر طلبًا</h3>
          {topBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          ) : (
            <div className="space-y-2">
              {topBooks.map(([slug, { title, count }]) => (
                <div
                  key={slug}
                  className="flex items-center justify-between border border-border px-4 py-2.5"
                >
                  <span className="text-sm truncate">{title}</span>
                  <span className="text-sm text-brass shrink-0 ml-4">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

/* ─── SHARED HELPERS ─── */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl text-brass-soft">{title}</h2>
      <div className="hairline my-5" />
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-6 text-center">
      <p className="font-display text-4xl text-brass-soft">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}


type BookEditForm = {
  titleAr: string;
  titleEn: string;
  authorAr: string;
  authorEn: string;
  category: string;
  price: string;
  year: string;
  isbn: string;
  editionAr: string;
  editionEn: string;
  pages: string;
  summaryAr: string;
  summaryEn: string;
};

function bookToEditForm(book: Book): BookEditForm {
  const author = book.authors[0] ?? { ar: "", en: "" };
  return {
    titleAr: book.title.ar,
    titleEn: book.title.en,
    authorAr: author.ar,
    authorEn: author.en,
    category: book.category,
    price: String(book.price ?? ""),
    year: String(book.year ?? ""),
    isbn: book.isbn ?? "",
    editionAr: book.edition?.ar ?? "",
    editionEn: book.edition?.en ?? "",
    pages: book.pages ? String(book.pages) : "",
    summaryAr: book.summary?.ar ?? "",
    summaryEn: book.summary?.en ?? "",
  };
}

function BookEditModal({
  book,
  categories: categoryOptions,
  archived,
  uploading,
  onClose,
  onSave,
  onArchive,
  onPublish,
  onUpload,
}: {
  book: Book;
  categories: Category[];
  archived: boolean;
  uploading: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Book>) => Promise<void>;
  onArchive: () => Promise<void>;
  onPublish: () => Promise<void>;
  onUpload: (file: File) => Promise<string | undefined>;
}) {
  const [form, setForm] = useState<BookEditForm>(() => bookToEditForm(book));
  const [coverPreview, setCoverPreview] = useState(book.cover);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    setForm(bookToEditForm(book));
    setCoverPreview(book.cover);
  }, [book.slug, book.cover]);

  const update = (key: keyof BookEditForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: { ar: form.titleAr.trim(), en: form.titleEn.trim() || form.titleAr.trim() },
        authors: [{ ar: form.authorAr.trim(), en: form.authorEn.trim() || form.authorAr.trim() }],
        category: form.category,
        price: Number(form.price) || 0,
        year: Number(form.year) || 0,
        summary: { ar: form.summaryAr.trim(), en: form.summaryEn.trim() || form.summaryAr.trim() },
        ...(form.isbn.trim() ? { isbn: form.isbn.trim() } : {}),
        ...(form.editionAr.trim() || form.editionEn.trim()
          ? { edition: { ar: form.editionAr.trim(), en: form.editionEn.trim() || form.editionAr.trim() } }
          : {}),
        ...(form.pages.trim() && Number(form.pages) > 0 ? { pages: Number(form.pages) } : {}),
      });
      toast.success("تم حفظ بيانات الكتاب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ بيانات الكتاب");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async () => {
    setChangingStatus(true);
    try {
      if (archived) await onPublish();
      else await onArchive();
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="تعديل الكتاب">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-border bg-background p-5 shadow-2xl sm:p-7" dir="rtl">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="eyebrow">تعديل بيانات الكتاب</p>
            <h2 className="mt-2 font-display text-3xl text-brass-soft">{book.title.ar}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{book.isbn || book.slug}</p>
          </div>
          <button type="button" onClick={onClose} className="border border-border p-2 text-muted-foreground transition-colors hover:border-brass hover:text-brass" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelClass}>عنوان الكتاب بالعربية</span>
              <input className={field} value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} required />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>عنوان الكتاب بالإنجليزية</span>
              <input className={field} value={form.titleEn} onChange={(event) => update("titleEn", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>المؤلف بالعربية</span>
              <input className={field} value={form.authorAr} onChange={(event) => update("authorAr", event.target.value)} required />
            </label>
            <label>
              <span className={labelClass}>المؤلف بالإنجليزية</span>
              <input className={field} value={form.authorEn} onChange={(event) => update("authorEn", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>التخصص</span>
              <select className={`${field} text-foreground`} value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.name.ar}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>السعر بالدولار</span>
              <input className={field} type="number" min="0" step="0.01" placeholder="عند الاستعلام" value={form.price} onChange={(event) => update("price", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>سنة النشر</span>
              <input className={field} type="number" min="0" value={form.year} onChange={(event) => update("year", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>رقم ISBN</span>
              <input className={field} value={form.isbn} onChange={(event) => update("isbn", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>الطبعة بالعربية</span>
              <input className={field} value={form.editionAr} onChange={(event) => update("editionAr", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>الطبعة بالإنجليزية</span>
              <input className={field} value={form.editionEn} onChange={(event) => update("editionEn", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>عدد الصفحات</span>
              <input className={field} type="number" min="0" value={form.pages} onChange={(event) => update("pages", event.target.value)} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>الملخص بالعربية</span>
              <textarea className={`${field} min-h-28 resize-y`} value={form.summaryAr} onChange={(event) => update("summaryAr", event.target.value)} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>الملخص بالإنجليزية</span>
              <textarea className={`${field} min-h-28 resize-y`} value={form.summaryEn} onChange={(event) => update("summaryEn", event.target.value)} />
            </label>
          </div>

          <aside className="space-y-4">
            <div className="border border-border bg-surface/40 p-3">
              <div className="aspect-[3/4] overflow-hidden bg-black/20">
                {coverPreview ? <img src={coverPreview} alt={`غلاف ${form.titleAr}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">لا يوجد غلاف</div>}
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 border border-border px-3 py-2 text-xs transition-colors hover:border-brass hover:text-brass">
                <Upload className="h-4 w-4" />
                <span>{uploading ? "جارٍ رفع الغلاف..." : "استبدال الغلاف"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const nextCover = await onUpload(file);
                    if (nextCover) setCoverPreview(nextCover);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className={`border p-4 ${archived ? "border-brass/50 bg-brass/5" : "border-emerald-700/50 bg-emerald-950/20"}`}>
              <p className="text-xs text-muted-foreground">حالة الظهور على الموقع</p>
              <p className="mt-2 font-medium">{archived ? "في الأرشيف" : "منشور"}</p>
              <button type="button" onClick={handleStatus} disabled={changingStatus || (!archived && !book.cover)} className="mt-3 w-full border border-border px-3 py-2 text-xs transition-colors hover:border-brass hover:text-brass disabled:cursor-not-allowed disabled:opacity-50">
                {changingStatus ? "جارٍ الحفظ..." : archived ? "نشر الكتاب" : "نقل إلى الأرشيف"}
              </button>
              {!archived && !book.cover && <p className="mt-2 text-[0.65rem] text-muted-foreground">لا يمكن نشر كتاب بلا غلاف.</p>}
            </div>
          </aside>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5 lg:col-span-2">
            <button type="button" onClick={onClose} className="border border-border px-5 py-2.5 text-sm transition-colors hover:border-brass">إلغاء</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saving ? "جارٍ الحفظ..." : "حفظ بيانات الكتاب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
