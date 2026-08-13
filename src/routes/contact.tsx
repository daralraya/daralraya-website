import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Smartphone, MessageCircle, MapPin, Facebook, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { site } from "@/config/site";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل بنا | دار الراية للنشر والتوزيع" },
      {
        name: "description",
        content:
          "تواصل مع دار الراية للنشر والتوزيع في عمّان للاستفسار عن الطلبات أو النشر أو التوزيع.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(lang === "ar" ? "يرجى كتابة رسالة" : "Please write a message");
      return;
    }
    // Build WhatsApp message
    const lines: string[] = [];
    if (lang === "ar") {
      if (name) lines.push(`الاسم: ${name}`);
      if (email) lines.push(`البريد: ${email}`);
      lines.push("");
      lines.push(`الرسالة:\n${message}`);
    } else {
      if (name) lines.push(`Name: ${name}`);
      if (email) lines.push(`Email: ${email}`);
      lines.push("");
      lines.push(`Message:\n${message}`);
    }
    const fullMsg = lines.join("\n");
    const url = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(fullMsg)}`;
    window.open(url, "_blank");
    toast.success(lang === "ar" ? "تم فتح واتساب" : "WhatsApp opened");
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
      <p className="eyebrow">{t("nav.contact")}</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">
        {t("contact.title")}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        {t("contact.lead")}
      </p>

      <div className="hairline my-12" />

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: Contact info */}
        <div>
          <h2 className="font-display text-3xl text-brass-soft">
            {lang === "ar" ? "اتصل بنا" : "Contact Us"}
          </h2>
          <div className="mt-8 space-y-5">
            {/* Phone 1 — هاتف */}
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 shrink-0 text-brass" />
              <span className="text-lg">
                {t("contact.phone")}: <span dir="ltr" className="inline-block">+962 6 523 1313</span>
              </span>
            </div>
            {/* Phone 2 — هاتف */}
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 shrink-0 text-brass" />
              <span className="text-lg">
                {t("contact.phone")}: <span dir="ltr" className="inline-block">+962 77 724 1212</span>
              </span>
            </div>
            {/* Mobile — محمول */}
            <div className="flex items-center gap-4">
              <Smartphone className="h-5 w-5 shrink-0 text-brass" />
              <span className="text-lg">
                {t("contact.mobile")}: <span dir="ltr" className="inline-block">+962 77 523 1313</span>
              </span>
            </div>
            {/* WhatsApp */}
            <div className="flex items-center gap-4">
              <MessageCircle className="h-5 w-5 shrink-0 text-brass" />
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg hover:text-brass-soft"
              >
                {t("contact.whatsapp")}: <span dir="ltr" className="inline-block">+962 77 523 1313</span>
              </a>
            </div>
          </div>

          <div className="hairline my-8" />

          {/* Links */}
          <h2 className="font-display text-3xl text-brass-soft">
            {t("contact.social")}
          </h2>
          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 shrink-0 text-brass" />
              <a href={`mailto:${site.email}`} className="text-lg hover:text-brass-soft">
                {site.email}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 shrink-0 text-brass" />
              <a href="mailto:dar_alraya@yahoo.com" className="text-lg hover:text-brass-soft">
                dar_alraya@yahoo.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 shrink-0 text-brass" />
              <span className="text-lg">
                {lang === "ar" ? "عمّان - الأردن" : "Amman - Jordan"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Facebook className="h-5 w-5 shrink-0 text-brass" />
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg hover:text-brass-soft"
              >
                {t("contact.facebook")}
              </a>
            </div>
          </div>
        </div>

        {/* Right: Message form */}
        <div>
          <h2 className="font-display text-3xl text-brass-soft">
            {lang === "ar" ? "أرسل رسالة" : "Send a Message"}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {lang === "ar"
              ? "اكتب رسالتك وسيتم إرسالها عبر واتساب"
              : "Write your message and it will be sent via WhatsApp"}
          </p>

          <form onSubmit={handleMessageSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                {lang === "ar" ? "الاسم" : "Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border bg-surface/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                placeholder={lang === "ar" ? "الاسم (اختياري)" : "Name (optional)"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                {t("contact.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-surface/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                placeholder={lang === "ar" ? "البريد (اختياري)" : "Email (optional)"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                {lang === "ar" ? "الرسالة" : "Message"}
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-border bg-surface/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary resize-none"
                placeholder={
                  lang === "ar"
                    ? "اكتب رسالتك هنا..."
                    : "Write your message here..."
                }
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              {lang === "ar" ? "إرسال عبر واتساب" : "Send via WhatsApp"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
