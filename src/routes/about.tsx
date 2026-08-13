import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/hero-books.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن الدار | دار الراية للنشر والتوزيع" },
      {
        name: "description",
        content:
          "دار الراية للنشر والتوزيع: دار أردنية ترافق الكتاب من المخطوطة الأولى حتى يد القارئ بمعايير مهنية.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt=""
          width={1600}
          height={1104}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="veil absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 py-28 lg:px-8">
          <p className="eyebrow">{t("about.title")}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-balance-title sm:text-6xl">
            <span className="gold-text">{t("about.hero")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground/75">
            {t("about.heroSub")}
          </p>
        </div>
      </section>

      {/* Story section */}
      <section className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
        {/* Founding paragraph */}
        <p className="text-lg leading-loose text-foreground/80">{t("about.p1")}</p>

        <div className="hairline my-10" />

        {/* Work approach paragraph */}
        <p className="text-lg leading-loose text-foreground/80">{t("about.p2")}</p>

        <div className="hairline my-10" />

        {/* Adopted as references — separate highlighted card */}
        <div className="border border-brass/30 bg-brass/5 p-8 rounded-sm">
          <p className="font-display text-xl text-brass-soft mb-3">
            {t("about.references")}
          </p>
          <p className="text-lg leading-loose text-foreground/80">{t("about.p3")}</p>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="eyebrow">{t("about.values")}</p>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <span className="font-display text-5xl text-brass/35">
                  {String(i).padStart(2, "0")}
                </span>
                <h2 className="mt-4 font-display text-2xl">{t(`about.v${i}.t`)}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {t(`about.v${i}.d`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
