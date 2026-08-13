import { ShoppingCart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function CartIcon() {
  const { totalItems } = useCart();
  const { t } = useI18n();

  if (totalItems === 0) return null;

  return (
    <Link
      to="/cart"
      className="relative flex items-center gap-2 border border-brass/40 px-3 py-2 text-sm text-brass transition-colors hover:border-brass hover:bg-brass/10"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">{t("cart.title")}</span>
      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brass text-[0.65rem] font-bold text-background">
        {totalItems}
      </span>
    </Link>
  );
}
