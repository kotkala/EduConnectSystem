import { MainLayout } from "@/components/layout/main-layout";
import { APP_CONFIG } from "@/lib/constants";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex-1 flex flex-col gap-20 items-center justify-center">
        <h1 className="text-3xl font-bold text-center">
          Chào mừng đến với {APP_CONFIG.name}!
        </h1>
        <p className="text-center text-muted-foreground">
          Hệ thống xác thực Supabase + Next.js đã sẵn sàng.
        </p>
      </div>
    </MainLayout>
  );
}
