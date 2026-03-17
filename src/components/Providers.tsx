"use client";

import { useServiceWorker } from "@/lib/hooks/use-service-worker";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return <I18nProvider>{children}</I18nProvider>;
}
