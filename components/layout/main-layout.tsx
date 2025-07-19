import { Header } from "./header";
import { Footer } from "./footer";
import type { WithChildren } from "@/lib/types";

/**
 * Main layout component that wraps the entire application
 */
export function MainLayout({ children }: WithChildren) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Header />
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 w-full">
          {children}
        </div>
        <Footer />
      </div>
    </main>
  );
}
