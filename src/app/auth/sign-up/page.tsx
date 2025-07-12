import { SignUpForm } from "@/components/sign-up-form";
import { CozyLayout, CozyContainer } from "@/components/ui/cozy-layout";
import { EduConnectAnimatedContainer, EduConnectAnimatedCard } from "@/components/ui/animated-components";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Page() {
  return (
    <CozyLayout showFloatingElements={true}>
      {/* Navigation Header */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href="/" className="text-2xl font-bold educonnect-gradient-text">
              EduConnect
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
        <CozyContainer size="sm">
          <EduConnectAnimatedContainer variant="slideUp" delay={0.2}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold educonnect-gradient-text mb-2">
                Tạo tài khoản mới
              </h1>
              <p className="text-muted-foreground">
                Bắt đầu hành trình học tập cùng EduConnect
              </p>
            </div>
            
            <EduConnectAnimatedCard 
              variant="premium" 
              hover="lift" 
              className="max-w-sm mx-auto"
            >
              <div className="p-6">
                <SignUpForm />
              </div>
            </EduConnectAnimatedCard>
            
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </EduConnectAnimatedContainer>
        </CozyContainer>
      </div>
    </CozyLayout>
  );
}
