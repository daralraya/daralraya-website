import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Book } from "@/data/catalog";
import { site } from "@/config/site";

export type CartItem = {
  slug: string;
  title: { ar: string; en: string };
  author: { ar: string; en: string };
  price: number;
  currency: "USD";
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  addItem: (book: Book) => void;
  incrementQty: (slug: string) => void;
  decrementQty: (slug: string) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  total: number;
  totalItems: number;
};

const CART_KEY = "alraya.cart.v3";

function bookToCartItem(book: Book): CartItem {
  return {
    slug: book.slug,
    title: book.title,
    author: book.authors[0] || { ar: "", en: "" },
    price: book.price,
    currency: book.currency,
    quantity: 1,
  };
}

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((book: Book) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === book.slug);
      if (existing) {
        const next = prev.map((i) =>
          i.slug === book.slug ? { ...i, quantity: i.quantity + 1 } : i
        );
        saveCart(next);
        return next;
      }
      const next = [...prev, bookToCartItem(book)];
      saveCart(next);
      return next;
    });
  }, []);

  const incrementQty = useCallback((slug: string) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.slug === slug ? { ...i, quantity: i.quantity + 1 } : i
      );
      saveCart(next);
      return next;
    });
  }, []);

  const decrementQty = useCallback((slug: string) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.slug === slug ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
        )
        .filter((i) => i.quantity > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.slug !== slug);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, incrementQty, decrementQty, removeItem, clear, total, totalItems }),
    [items, addItem, incrementQty, decrementQty, removeItem, clear, total, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function buildWhatsAppMessage(items: CartItem[], name: string, phone: string, lang: "ar" | "en"): string {
  const isAr = lang === "ar";
  const lines: string[] = [];

  if (isAr) {
    lines.push("طلب كتب — دار الراية للنشر والتوزيع");
    lines.push("────────────────");
    if (name) lines.push(`الاسم: ${name}`);
    if (phone) lines.push(`الهاتف: ${phone}`);
    lines.push("");
    lines.push("الكتب المطلوبة:");
    items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title.ar} — تأليف: ${item.author.ar} — ${item.quantity}x — $${(item.price * item.quantity).toFixed(2)}`);
    });
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    lines.push("");
    lines.push(`الإجمالي التقديري: $${total.toFixed(2)}`);
  } else {
    lines.push("Book order — Dar Al-Raya Publishing");
    lines.push("────────────────");
    if (name) lines.push(`Name: ${name}`);
    if (phone) lines.push(`Phone: ${phone}`);
    lines.push("");
    lines.push("Requested books:");
    items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title.en || item.title.ar} — By: ${item.author.en || item.author.ar} — x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}`);
    });
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    lines.push("");
    lines.push(`Estimated total: $${total.toFixed(2)}`);
  }

  return lines.join("\n");
}

export function sendOrderViaWhatsApp(items: CartItem[], name: string, phone: string, lang: "ar" | "en") {
  const message = buildWhatsAppMessage(items, name, phone, lang);
  const url = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
