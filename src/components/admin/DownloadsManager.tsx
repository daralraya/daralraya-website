import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload } from "lucide-react";
import {
  deleteDownloadFile,
  getDownloadManifest,
  uploadDownloadFile,
  type DownloadEntry,
} from "@/lib/downloads";

const field = "w-full border border-border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brass";
const label = "mb-1.5 block text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase";
const accept = ".xlsx,.xls,.csv,.doc,.docx,.pdf,.ppt,.pptx,.odt,.ods,.zip";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الملف"));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

function formatSize(size: number): string {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadsManager() {
  const [files, setFiles] = useState<DownloadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setFiles(await getDownloadManifest());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الملفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !labelAr.trim() || !labelEn.trim()) {
      toast.error("اختر ملفاً واكتب اسمه بالعربية والإنجليزية");
      return;
    }
    setUploading(true);
    try {
      const entry = await uploadDownloadFile({
        data: {
          filename: selectedFile.name,
          labelAr: labelAr.trim(),
          labelEn: labelEn.trim(),
          dataUrl: await readAsDataUrl(selectedFile),
        },
      });
      setFiles((current) => [...current, entry]);
      setSelectedFile(null);
      setLabelAr("");
      setLabelEn("");
      toast.success("تمت إضافة الملف");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (entry: DownloadEntry) => {
    if (!window.confirm(`حذف الملف «${entry.filename}»؟`)) return;
    try {
      await deleteDownloadFile({ data: { id: entry.id } });
      setFiles((current) => current.filter((file) => file.id !== entry.id));
      toast.success("تم حذف الملف");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الملف");
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="border border-border p-5 sm:p-7">
        <p className="eyebrow">الملفات</p>
        <h2 className="mt-2 font-display text-3xl text-brass-soft">إضافة ملف للتنزيل</h2>
        <form onSubmit={handleUpload} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className={label}>الاسم الظاهر بالعربية</span>
            <input className={field} value={labelAr} onChange={(event) => setLabelAr(event.target.value)} />
          </label>
          <label>
            <span className={label}>الاسم الظاهر بالإنجليزية</span>
            <input className={field} value={labelEn} onChange={(event) => setLabelEn(event.target.value)} />
          </label>
          <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 border border-dashed border-border px-4 py-4 transition-colors hover:border-brass">
            <Upload className="h-5 w-5 text-brass" />
            <span className="min-w-0 flex-1 truncate text-sm">{selectedFile?.name ?? "اختيار ملف Excel أو Word أو PDF أو غيره"}</span>
            <input type="file" accept={accept} className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
          </label>
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">الحد الأعلى لحجم الملف 25 ميغابايت.</p>
            <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm text-primary-foreground disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {uploading ? "جارٍ الرفع..." : "إضافة الملف"}
            </button>
          </div>
        </form>
      </section>

      <section className="border border-border p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">التنزيلات الحالية</p>
            <h2 className="mt-2 font-display text-3xl text-brass-soft">الملفات المنشورة</h2>
          </div>
          <button type="button" onClick={() => void load()} className="border border-border px-4 py-2 text-xs transition-colors hover:border-brass">تحديث</button>
        </div>
        <div className="mt-6 space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : files.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد ملفات منشورة.</p> : files.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-4 border border-border p-4">
              <Download className="h-5 w-5 shrink-0 text-brass" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{entry.labelAr}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{entry.filename}{entry.size ? ` · ${formatSize(entry.size)}` : ""}</p>
              </div>
              <a href={entry.url} target="_blank" rel="noreferrer" className="border border-border px-3 py-2 text-xs transition-colors hover:border-brass">معاينة</a>
              <button type="button" onClick={() => void handleDelete(entry)} className="inline-flex items-center gap-2 border border-destructive/40 px-3 py-2 text-xs text-destructive transition-colors hover:border-destructive">
                <Trash2 className="h-4 w-4" />
                حذف
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
