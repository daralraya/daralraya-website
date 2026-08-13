import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import logoCircle from "@/assets/alraya.png";
import logoText from "@/assets/logo-text-gold.png";
import { CartIcon } from "./CartIcon";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/books", key: "nav.books" },
  { to: "/downloads", key: "nav.downloads" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const { t, lang, toggle } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#0c0f1a] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" className="group flex items-center gap-4" onClick={() => setOpen(false)}>
          <img src={logoCircle} alt="دار الراية" className="h-20 w-20 object-contain" />
          <img src={logoText} alt="دار الراية للنشر والتوزيع" className="h-16 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative text-sm text-foreground transition-colors hover:text-brass-soft"
              activeProps={{ className: "text-brass-soft" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartIcon />
          <button
            type="button"
            onClick={toggle}
            className="border border-border px-3 py-2 text-[0.68rem] tracking-[0.18em] uppercase transition-colors hover:border-primary hover:text-brass-soft"
          >
            {lang === "ar" ? "EN" : "ع"}
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="border border-border p-2.5 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border transition-[max-height] duration-500 lg:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav className="flex flex-col px-5 py-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="border-b border-border/60 py-3.5 text-sm last:border-0"
              activeProps={{ className: "text-brass-soft" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
