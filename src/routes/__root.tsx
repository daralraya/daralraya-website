import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  type ReactNode,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { ContentProvider } from "@/lib/content";
import { CartProvider } from "@/lib/cart";
import { AnalyticsProvider } from "@/lib/analytics";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VisualOverrides } from "@/components/site/VisualOverrides";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-brass">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          الصفحة غير موجودة / Page not found
        </h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            الرئيسية / Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  console.error(error);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "دار الراية للنشر والتوزيع" },
      {
        name: "description",
        content:
          "دار نشر أردنية متخصصة في نشر وتوزيع الكتب الأكاديمية والأدبية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "دار الراية للنشر والتوزيع" },
      { property: "og:locale", content: "ar_JO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#141a2b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap",
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AnalyticsProvider>
          <CartProvider>
            <ContentProvider>
            <VisualOverrides />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
            </ContentProvider>
          </CartProvider>
        </AnalyticsProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
