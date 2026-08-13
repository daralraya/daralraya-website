import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ANALYTICS_KEY = "alraya.analytics.v1";

export type PageView = {
  path: string;
  ts: number;
  referrer?: string;
};

export type BookClick = {
  slug: string;
  title: string;
  ts: number;
  action: "cart" | "view";
};

export type SiteAnalytics = {
  pageViews: PageView[];
  bookClicks: BookClick[];
  lastReset: string;
};

function loadAnalytics(): SiteAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return { pageViews: [], bookClicks: [], lastReset: new Date().toISOString() };
}

function saveAnalytics(data: SiteAnalytics) {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
}

type AnalyticsCtx = {
  trackPage: (path: string, referrer?: string) => void;
  trackBookClick: (slug: string, title: string, action: "cart" | "view") => void;
  data: SiteAnalytics;
  reset: () => void;
};

const AnalyticsContext = createContext<AnalyticsCtx | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteAnalytics>(loadAnalytics);

  useEffect(() => {
    // Track initial page load
    trackPage(window.location.pathname, document.referrer || undefined);
  }, []);

  const trackPage = useCallback((path: string, referrer?: string) => {
    setData((prev) => {
      const view: PageView = { path, ts: Date.now(), referrer };
      const next = {
        ...prev,
        pageViews: [...prev.pageViews, view],
      };
      saveAnalytics(next);
      return next;
    });
  }, []);

  const trackBookClick = useCallback((slug: string, title: string, action: "cart" | "view") => {
    setData((prev) => {
      const click: BookClick = { slug, title, ts: Date.now(), action };
      const next = {
        ...prev,
        bookClicks: [...prev.bookClicks, click],
      };
      saveAnalytics(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh: SiteAnalytics = { pageViews: [], bookClicks: [], lastReset: new Date().toISOString() };
    saveAnalytics(fresh);
    setData(fresh);
  }, []);

  const value = useMemo(() => ({ trackPage, trackBookClick, data, reset }), [trackPage, trackBookClick, data, reset]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return ctx;
}

export function usePageTracker(path: string) {
  const { trackPage } = useAnalytics();
  useEffect(() => {
    trackPage(path, document.referrer || undefined);
  }, [path, trackPage]);
}
