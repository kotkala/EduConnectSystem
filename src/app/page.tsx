import { CozyLayout, CozyHero, CozySection, CozyGrid, CozyContainer } from "@/components/ui/cozy-layout";
import { 
  EduConnectAnimatedCard, 
  EduConnectAnimatedButton, 
  EduConnectAnimatedBadge,
  EduConnectAnimatedText,
  EduConnectAnimatedContainer
} from "@/components/ui/animated-components";
import { CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Star, BookOpen, Users, Shield, Zap, ArrowRight, Github, Mail, MessageCircle, GraduationCap, Award, Lightbulb, Target, ChevronRight } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function HomePage() {
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
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/login">Đăng nhập</Link>
            </Button>
            <Button asChild size="sm" variant="default">
              <Link href="/auth/sign-up">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section with Better Balance */}
      <CozyHero
        variant="centered"
        subtitle="🌟 Chào mừng đến với"
        title="EduConnect"
        description={
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-muted-foreground mb-6">
              Hệ thống giáo dục thế hệ mới với thiết kế cao cấp, trải nghiệm học tập đỉnh cao 
              và công nghệ tiên tiến nhất.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground/80">
              Được thiết kế với tình yêu và sự tỉ mỉ bởi đội ngũ chuyên gia có hơn 15 năm kinh nghiệm.
            </p>
          </div>
        }
        actions={
          <EduConnectAnimatedContainer variant="slideUp" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <EduConnectAnimatedButton 
                variant="premium" 
                size="lg" 
                magnetic={true}
                glow={true}
                liquidFill={true}
                icon={<ChevronRight className="h-5 w-5" />}
                className="w-full sm:w-auto"
              >
                <Link href="/auth/sign-up" className="flex items-center gap-2 justify-center">
                  Bắt đầu hành trình
                </Link>
              </EduConnectAnimatedButton>
              
              <EduConnectAnimatedButton 
                variant="ghost" 
                size="lg"
                icon={<ArrowRight className="h-5 w-5" />}
                className="w-full sm:w-auto"
              >
                <Link href="/auth/login" className="flex items-center gap-2 justify-center">
                  Đăng nhập ngay
                </Link>
              </EduConnectAnimatedButton>
            </div>
          </EduConnectAnimatedContainer>
        }
      />

      {/* Enhanced Features Section with Better Visual Balance and Spacing */}
      <CozySection 
        title="Tính năng đẳng cấp thế giới"
        subtitle="Khám phá những tính năng cao cấp được thiết kế đặc biệt cho thế hệ học viên hiện đại"
        centered
        className="py-24"
      >
        <CozyGrid columns={3} gap="xl" className="max-w-7xl mx-auto">
          <EduConnectAnimatedCard 
            variant="premium" 
            hover="lift" 
            float={true}
            shimmer={true}
            className="group h-full relative overflow-hidden"
          >
            {/* Card background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <CardHeader className="text-center p-10 relative z-10">
              <EduConnectAnimatedContainer variant="bounce" delay={0.2}>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-educonnect-large">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </EduConnectAnimatedContainer>
              
              <EduConnectAnimatedText variant="gradient" className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                Học tập thông minh AI
              </EduConnectAnimatedText>
              
              <CardDescription className="text-base md:text-lg leading-relaxed text-center mb-6 text-muted-foreground/90">
                Hệ thống học tập thích ứng với AI tiên tiến, cá nhân hóa hoàn toàn trải nghiệm học tập cho từng học viên với độ chính xác tuyệt đối
              </CardDescription>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <EduConnectAnimatedBadge variant="primary" size="md" bounce={true} icon={<Lightbulb className="h-4 w-4" />}>
                  AI Thông minh
                </EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="success" size="md" bounce={true} icon={<Target className="h-4 w-4" />}>
                  Cá nhân hóa
                </EduConnectAnimatedBadge>
              </div>
            </CardHeader>
          </EduConnectAnimatedCard>

          <EduConnectAnimatedCard 
            variant="premium" 
            hover="morph" 
            glow={true}
            borderAnimation={true}
            className="group h-full relative overflow-hidden"
          >
            {/* Card background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <CardHeader className="text-center p-10 relative z-10">
              <EduConnectAnimatedContainer variant="bounce" delay={0.4}>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-blue-large">
                  <Users className="h-10 w-10 text-white" />
                </div>
              </EduConnectAnimatedContainer>
              
              <EduConnectAnimatedText variant="glow" className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                Cộng đồng toàn cầu
              </EduConnectAnimatedText>
              
              <CardDescription className="text-base md:text-lg leading-relaxed text-center mb-6 text-muted-foreground/90">
                Kết nối với hàng triệu học viên trên toàn thế giới, chia sẻ kiến thức và cùng nhau phát triển trong môi trường học tập đẳng cấp quốc tế
              </CardDescription>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <EduConnectAnimatedBadge variant="info" size="md" pulse={true} icon={<Users className="h-4 w-4" />}>
                  1M+ Học viên
                </EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="primary" size="md" pulse={true} icon={<Award className="h-4 w-4" />}>
                  Chứng nhận
                </EduConnectAnimatedBadge>
              </div>
            </CardHeader>
          </EduConnectAnimatedCard>

          <EduConnectAnimatedCard 
            variant="premium" 
            hover="rotate" 
            float={true}
            className="group h-full relative overflow-hidden"
          >
            {/* Card background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <CardHeader className="text-center p-10 relative z-10">
              <EduConnectAnimatedContainer variant="bounce" delay={0.6}>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-amber-large">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </EduConnectAnimatedContainer>
              
              <EduConnectAnimatedText variant="wave" className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                Bảo mật tuyệt đối
              </EduConnectAnimatedText>
              
              <CardDescription className="text-base md:text-lg leading-relaxed text-center mb-6 text-muted-foreground/90">
                Công nghệ bảo mật quân sự với Supabase Enterprise, đảm bảo dữ liệu của bạn được bảo vệ bằng mã hóa AES-256 và các tiêu chuẩn bảo mật cao nhất
              </CardDescription>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <EduConnectAnimatedBadge variant="warning" size="md" glow={true} icon={<Shield className="h-4 w-4" />}>
                  AES-256
                </EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="success" size="md" glow={true} icon={<Award className="h-4 w-4" />}>
                  ISO 27001
                </EduConnectAnimatedBadge>
              </div>
            </CardHeader>
          </EduConnectAnimatedCard>
        </CozyGrid>
      </CozySection>

      {/* Enhanced Stats Section with Icons, Separators and Better Visual Design */}
      <CozySection className="educonnect-bg-gradient-hero rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-educonnect-xl py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-shimmer"></div>
        
        <CozyContainer>
          <CozyGrid columns={4} gap="xl" className="max-w-7xl mx-auto relative z-10">
            <EduConnectAnimatedContainer variant="fadeIn" delay={0.1}>
              <div className="text-center p-8 relative group">
                {/* Icon with background */}
                <EduConnectAnimatedContainer variant="bounce" delay={0.2}>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </EduConnectAnimatedContainer>
                
                <EduConnectAnimatedText variant="typewriter" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 educonnect-gradient-text leading-none">
                  1,000,000+
                </EduConnectAnimatedText>
                <div className="text-teal-700 font-semibold text-lg md:text-xl leading-relaxed">Học viên toàn cầu</div>
                
                {/* Visual separator line */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent hidden lg:block"></div>
              </div>
            </EduConnectAnimatedContainer>
            
            <EduConnectAnimatedContainer variant="fadeIn" delay={0.2}>
              <div className="text-center p-8 relative group">
                {/* Icon with background */}
                <EduConnectAnimatedContainer variant="bounce" delay={0.3}>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </EduConnectAnimatedContainer>
                
                <EduConnectAnimatedText variant="typewriter" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 educonnect-gradient-text leading-none">
                  50,000+
                </EduConnectAnimatedText>
                <div className="text-teal-700 font-semibold text-lg md:text-xl leading-relaxed">Khóa học chất lượng</div>
                
                {/* Visual separator line */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent hidden lg:block"></div>
              </div>
            </EduConnectAnimatedContainer>
            
            <EduConnectAnimatedContainer variant="fadeIn" delay={0.3}>
              <div className="text-center p-8 relative group">
                {/* Icon with background */}
                <EduConnectAnimatedContainer variant="bounce" delay={0.4}>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                </EduConnectAnimatedContainer>
                
                <EduConnectAnimatedText variant="typewriter" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 educonnect-gradient-text leading-none">
                  10,000+
                </EduConnectAnimatedText>
                <div className="text-teal-700 font-semibold text-lg md:text-xl leading-relaxed">Giảng viên chuyên gia</div>
                
                {/* Visual separator line */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent hidden lg:block"></div>
              </div>
            </EduConnectAnimatedContainer>
            
            <EduConnectAnimatedContainer variant="fadeIn" delay={0.4}>
              <div className="text-center p-8 relative group">
                {/* Icon with background */}
                <EduConnectAnimatedContainer variant="bounce" delay={0.5}>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                </EduConnectAnimatedContainer>
                
                <EduConnectAnimatedText variant="typewriter" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 educonnect-gradient-text leading-none">
                  99.8%
                </EduConnectAnimatedText>
                <div className="text-teal-700 font-semibold text-lg md:text-xl leading-relaxed">Tỷ lệ hài lòng</div>
              </div>
            </EduConnectAnimatedContainer>
          </CozyGrid>
          
          {/* Additional visual enhancement - floating elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-teal-400/10 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-400/10 rounded-full animate-float-slower"></div>
          <div className="absolute top-1/2 right-20 w-12 h-12 bg-purple-400/10 rounded-full animate-float"></div>
        </CozyContainer>
      </CozySection>

      {/* Enhanced Technology Section */}
      <CozySection 
        title="Công nghệ đẳng cấp Enterprise"
        subtitle="Được xây dựng với những công nghệ tiên tiến và đáng tin cậy nhất thế giới"
        centered
      >
        <CozyGrid columns={2} gap="lg">
          <EduConnectAnimatedCard variant="glass" hover="glow" className="p-8 h-full">
            <div className="flex items-center gap-6 mb-8">
              <EduConnectAnimatedContainer variant="bounce" delay={0.2}>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-green">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </EduConnectAnimatedContainer>
              <div>
                <EduConnectAnimatedText variant="gradient" className="text-2xl font-bold">
                  Next.js 15 Enterprise
                </EduConnectAnimatedText>
                <p className="text-muted-foreground text-lg">Framework React thế hệ mới</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EduConnectAnimatedBadge variant="premium" size="sm" glow={true}>App Router</EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="premium" size="sm" glow={true}>Server Components</EduConnectAnimatedBadge>
              </div>
              <div className="flex items-center gap-3">
                <EduConnectAnimatedBadge variant="premium" size="sm" glow={true}>TypeScript 5</EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="premium" size="sm" glow={true}>Tailwind CSS Pro</EduConnectAnimatedBadge>
              </div>
            </div>
          </EduConnectAnimatedCard>

          <EduConnectAnimatedCard variant="glass" hover="scale" className="p-8 h-full">
            <div className="flex items-center gap-6 mb-8">
              <EduConnectAnimatedContainer variant="bounce" delay={0.4}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-purple">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </EduConnectAnimatedContainer>
              <div>
                <EduConnectAnimatedText variant="glow" className="text-2xl font-bold">
                  Supabase Enterprise
                </EduConnectAnimatedText>
                <p className="text-muted-foreground text-lg">Backend-as-a-Service hàng đầu</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EduConnectAnimatedBadge variant="info" size="sm" pulse={true}>Authentication Pro</EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="info" size="sm" pulse={true}>PostgreSQL</EduConnectAnimatedBadge>
              </div>
              <div className="flex items-center gap-3">
                <EduConnectAnimatedBadge variant="info" size="sm" pulse={true}>Real-time Sync</EduConnectAnimatedBadge>
                <EduConnectAnimatedBadge variant="info" size="sm" pulse={true}>Global CDN</EduConnectAnimatedBadge>
              </div>
            </div>
          </EduConnectAnimatedCard>
        </CozyGrid>
      </CozySection>

      {/* Enhanced CTA Section */}
      <CozySection className="bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600 rounded-3xl mx-4 sm:mx-6 lg:mx-8 text-white shadow-educonnect-xl relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-shimmer"></div>
        
        <CozyContainer size="md">
          <EduConnectAnimatedContainer variant="slideUp" delay={0.2}>
            <div className="text-center relative z-10">
              <EduConnectAnimatedContainer variant="bounce" delay={0.3}>
                <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-glass">
                  <Sparkles className="h-5 w-5 animate-pulse-glow" />
                  <span className="text-lg font-semibold">Thiết kế với tình yêu và đam mê</span>
                  <Heart className="h-5 w-5 animate-pulse text-pink-300" />
                </div>
              </EduConnectAnimatedContainer>
              
              <EduConnectAnimatedText variant="fadeIn" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                Sẵn sàng thay đổi cuộc đời với giáo dục?
              </EduConnectAnimatedText>
              
              <EduConnectAnimatedContainer variant="slideUp" delay={0.5}>
                <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
                  Tham gia cùng hàng triệu học viên đã tin tưởng và lựa chọn EduConnect 
                  để khám phá tiềm năng vô hạn và thành công trong sự nghiệp.
                </p>
              </EduConnectAnimatedContainer>
              
              <EduConnectAnimatedContainer variant="bounce" delay={0.7}>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <EduConnectAnimatedButton 
                    variant="secondary" 
                    size="xl"
                    magnetic={true}
                    liquidFill={true}
                    className="bg-white text-teal-600 hover:bg-gray-50 shadow-educonnect-large"
                    icon={<GraduationCap className="h-6 w-6" />}
                  >
                    <Link href="/auth/sign-up" className="flex items-center gap-3">
                      Đăng ký miễn phí ngay
                    </Link>
                  </EduConnectAnimatedButton>
                  
                  <EduConnectAnimatedButton 
                    variant="ghost" 
                    size="xl"
                    className="border-white/40 text-white hover:bg-white/20 backdrop-blur-sm"
                    icon={<ArrowRight className="h-6 w-6" />}
                  >
                    <Link href="/protected" className="flex items-center gap-3">
                      Khám phá tính năng
                    </Link>
                  </EduConnectAnimatedButton>
                </div>
              </EduConnectAnimatedContainer>
            </div>
          </EduConnectAnimatedContainer>
        </CozyContainer>
      </CozySection>

      {/* Enhanced Footer */}
      <CozySection spacing="md">
        <CozyContainer>
          <EduConnectAnimatedContainer variant="fadeIn" delay={0.2}>
            <div className="border-t border-border pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
                  <span className="text-muted-foreground">
                    Được xây dựng với tình yêu và công nghệ tiên tiến bởi 
                    <span className="font-semibold text-teal-600 ml-1">EduConnect Team</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <EduConnectAnimatedButton variant="ghost" size="sm">
                    <Github className="h-5 w-5 mr-2" />
                    GitHub
                  </EduConnectAnimatedButton>
                  <EduConnectAnimatedButton variant="ghost" size="sm">
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </EduConnectAnimatedButton>
                  <EduConnectAnimatedButton variant="ghost" size="sm">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Hỗ trợ 24/7
                  </EduConnectAnimatedButton>
                </div>
              </div>
            </div>
          </EduConnectAnimatedContainer>
        </CozyContainer>
      </CozySection>
    </CozyLayout>
  );
}
