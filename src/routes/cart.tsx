import { createFileRoute } from "@tanstack/react-router";
import { useCart, sendOrderViaWhatsApp, type CartItem } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Plus, Minus, Trash2, Send, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BookCover } from "@/components/site/BookCover";
import { books } from "@/data/catalog";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة الطلبات | دار الراية للنشر والتوزيع" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, incrementQty, decrementQty, removeItem, clear, total, totalItems } = useCart();
  const { t, lang } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSend = () => {
    if (items.length === 0) return;
    sendOrderViaWhatsApp(items, name, phone, lang);
    toast.success(lang === "ar" ? "تم إرسال الطلب" : "Order sent");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-brass/30 mb-6" />
        <h1 className="font-display text-3xl">{t("cart.empty")}</h1>
        <p className="mt-4 text-muted-foreground">
          {lang === "ar"
            ? "لم تقم باختيار أي كتب بعد"
            : "You haven't selected any books yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
      <h1 className="font-display text-4xl">{t("cart.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {lang === "ar"
          ? `${totalItems} كتاب في سلة الطلبات`
          : `${totalItems} books in your order`}
      </p>

      <div className="hairline my-8" />

      {/* Book items */}
      <div className="space-y-4">
        {items.map((item) => {
          const fullBook = books.find((b) => b.slug === item.slug);
          return (
            <div
              key={item.slug}
              className="flex items-start gap-4 border border-border p-4"
            >
              {/* Book cover thumbnail */}
              <div className="w-16 h-24 shrink-0">
                {fullBook ? (
                  <BookCover book={fullBook} />
                ) : (
                  <div className="w-full h-full bg-brass/10 border border-border flex items-center justify-center">
                    <span className="text-xs text-brass">📚</span>
                  </div>
                )}
              </div>

              {/* Book info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {lang === "ar" ? item.title.ar : item.title.en || item.title.ar}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {lang === "ar" ? item.author.ar : item.author.en || item.author.ar}
                </p>
                <p className="text-sm text-brass mt-2">${item.price.toFixed(2)}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1 border border-border rounded-sm">
                <button
                  onClick={() => decrementQty(item.slug)}
                  className="p-2 text-muted-foreground hover:text-brass transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => incrementQty(item.slug)}
                  className="p-2 text-muted-foreground hover:text-brass transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.slug)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="hairline my-8" />

      <div className="flex items-center justify-between">
        <span className="text-lg">{lang === "ar" ? "الإجمالي" : "Total"}</span>
        <span className="font-display text-3xl text-brass">${total.toFixed(2)}</span>
      </div>

      <div className="hairline my-8" />

      {/* Contact info for order */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {t("cart.name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border bg-surface/50 px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder={lang === "ar" ? "الاسم (اختياري)" : "Your name (optional)"}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {t("cart.phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-border bg-surface/50 px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder={lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone number (optional)"}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSend}
            className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            {lang === "ar" ? "إرسال الطلب عبر واتساب" : "Send order via WhatsApp"}
          </button>
          <button
            onClick={() => { clear(); toast.success(lang === "ar" ? "تم مسح السلة" : "Cart cleared"); }}
            className="border border-border px-6 py-3.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "ar" ? "مسح السلة" : "Clear cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
