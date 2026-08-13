import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getDownloadManifest, type DownloadEntry } from "@/lib/downloads-server";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "تحميل القوائم | دار الراية للنشر والتوزيع" },
      {
        name: "description",
        content: "تحميل قوائم إصدارات دار الراية للنشر والتوزيع بصيغة إكسل.",
      },
    ],
  }),
  component: DownloadsPage,
});

const initialFiles: DownloadEntry[] = [{
  id: "catalog-2026",
  filename: "catalog-2026.xlsx",
  url: "/downloads/catalog-2026.xlsx",
  labelAr: "قائمة دار الراية للنشر والتوزيع",
  labelEn: "Dar Al-Raya Publishing Catalogue",
  size: 0,
  updatedAt: "2026-01-01T00:00:00.000Z",
}];

function DownloadsPage() {
  const { t, lang } = useI18n();
  const [files, setFiles] = useState<DownloadEntry[]>(initialFiles);

  useEffect(() => {
    let active = true;
    getDownloadManifest().then((next) => {
      if (active) setFiles(next);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
      <p className="eyebrow">{t("nav.downloads")}</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">{t("downloads.title")}</h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("downloads.lead")}</p>

      <div className="hairline my-12" />

      <div className="space-y-4">
        {files.map((f) => (
          <a
              key={f.id}
              href={f.url}
            download
            className="flex items-center justify-between gap-4 border border-border p-6 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-4">
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-brass" />
              <span className="font-medium">{lang === "ar" ? f.labelAr : f.labelEn}</span>
            </div>
            <span className="flex items-center gap-2 text-sm text-brass-soft">
              <Download className="h-4 w-4" />
              {t("downloads.download")}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
