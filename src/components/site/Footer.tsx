import { Link } from "@tanstack/react-router";
import { Mail, Phone, Smartphone, MessageCircle, MapPin, Facebook } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { site } from "@/config/site";
import { useContent } from "@/lib/content";
import logoText from "@/assets/logo-text-gold.png";

export function Footer() {
  const { t, tx, lang } = useI18n();
  const { content } = useContent();
  const categories = content.categories;

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Brand column */}
          <div>
            <img
              src={logoText}
              alt="دار الراية للنشر والتوزيع"
              className="h-14 w-auto mb-4"
            />
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              {lang === "ar"
                ? "دار نشر وتوزيع أردنية متخصصة في نشر وتوزيع الكتب والمؤلفات، نؤمن بقوة المعرفة وأهمية نشر الأفكار الجديدة."
                : "A Jordanian publishing house specialising in publishing and distributing books, we believe in the power of knowledge and the importance of spreading new ideas."}
            </p>
          </div>

          {/* Contact column */}
          <div>
            <h3 className="font-display text-2xl text-brass-soft mb-6">
              {t("contact.title")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brass shrink-0" />
                <span className="text-sm" dir="ltr">+962 6 523 1313</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brass shrink-0" />
                <span className="text-sm" dir="ltr">+962 77 724 1212</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-brass shrink-0" />
                <span className="text-sm" dir="ltr">+962 77 523 1313</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-brass shrink-0" />
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-brass-soft" dir="ltr">
                  +962 77 523 1313
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-brass shrink-0" />
                <a href={`mailto:${site.email}`} className="text-sm hover:text-brass-soft">{site.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-brass shrink-0" />
                <a href="mailto:dar_alraya@yahoo.com" className="text-sm hover:text-brass-soft">dar_alraya@yahoo.com</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-brass shrink-0" />
                <span className="text-sm">
                  {lang === "ar" ? "عمّان - الأردن" : "Amman - Jordan"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Facebook className="h-4 w-4 text-brass shrink-0" />
                <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-brass-soft">
                  {t("contact.facebook")}
                </a>
              </div>
            </div>
          </div>

          {/* Links column */}
          <div>
            <h3 className="font-display text-2xl text-brass-soft mb-6">
              {t("section.categories")}
            </h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c.slug}
                  to="/books"
                  search={{ category: c.slug, q: undefined }}
                  className="hover:text-brass-soft"
                >
                  {tx(c.name)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="hairline my-10" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}{" "}
          {lang === "ar" ? "دار الراية للنشر والتوزيع" : "Dar Al-Raya Publishing & Distribution"}
        </p>
      </div>
    </footer>
  );
}
