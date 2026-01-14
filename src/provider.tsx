"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import TopProgressBar from "@/components/shared/top-progress-bar";
import ScrollToTopButton from "@/components/shared/scroll-to-top-button";
import ClientLayout from "@/components/client-layout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <TopProgressBar />
      <ClientLayout>{children}</ClientLayout>
      <ScrollToTopButton />
      <Toaster />
    </Provider>
  );
}
