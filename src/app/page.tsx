'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LazyMotion, motion, AnimatePresence } from 'framer-motion'

// Lazy load motion features
const loadFeatures = () => import('@/lib/motion-features').then(res => res.default)


import { Button } from '@/shared/components/ui/button'
import {
  Users, GraduationCap, Heart, Brain, Phone,
  Smartphone, BarChart3, FileEdit, Settings, Monitor, CheckCircle, Star,
  ArrowRight, Play, MessageCircle, TrendingUp,
  X, FileX, AlertCircle, ChevronDown, ChevronUp, Mail, MapPin, MessageSquare,
  ExternalLink, Clock, Menu
} from 'lucide-react'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { AuthModal } from '@/features/authentication/components/auth/auth-modal'
import type { UserProfile } from '@/lib/types'

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000 }: { readonly end: string; readonly duration?: number }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const numericEnd = parseInt(end.replace(/\D/g, ''))
    if (isNaN(numericEnd)) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * numericEnd))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  const getDisplayValue = () => {
    if (end.includes('+')) return `${count}+`
    if (end.includes('%')) return `${count}%`
    return count.toLocaleString()
  }

  const displayValue = getDisplayValue()

  return <div ref={ref}>{displayValue}</div>
}

export default function Home() {
  const { user, profile } = useAuth() 
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  // Conditional rendering based on auth state
  if (user && profile) {
    return <AuthenticatedLandingPage profile={profile} />
  }

  return (
    <LazyMotion features={loadFeatures}>
      <div className="min-h-screen bg-orange-gradient-soft scroll-smooth" style={{ willChange: 'transform' }}>
      <header className="sticky top-0 z-50 bg-orange-gradient-soft/90 backdrop-blur-sm border-b border-orange-200">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 relative">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/Edu icon.svg"
                  alt="EduConnect Logo"
                  width={36}
                  height={36}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-orange-gradient-vibrant rounded-full opacity-0 group-hover:opacity-30 transition-opacity"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-orange-gradient bg-orange-gradient bg-clip-text text-transparent">
                EduConnect
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Chức năng
              </Link>
              <Link href="#roles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Vai trò
              </Link>
              <Link href="#docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Hướng dẫn
              </Link>
              <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Về hệ thống
              </Link>
              <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Liên hệ
              </Link>
            </div>

            {/* Desktop Auth Button (single) */}
            <div className="hidden xl:flex items-center space-x-2">
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="min-h-[44px] px-6 py-2 text-sm bg-orange-gradient hover:bg-orange-gradient-vibrant text-white font-medium whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Đăng nhập
              </Button>
            </div>


            {/* Mobile Menu Button */}
            <div className="xl:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </nav>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ willChange: 'transform' }}
                className="xl:hidden absolute left-0 right-0 top-full mx-4 sm:mx-6 mt-2 bg-card dark:bg-card rounded-lg border border-border shadow-lg"
              >
                <div className="flex flex-col py-2">
              <Link
                href="#features"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chức năng
              </Link>
              <Link
                href="#roles"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Vai trò
              </Link>
              <Link
                href="#docs"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Hướng dẫn
              </Link>
              <Link
                href="#about"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Về hệ thống
              </Link>
              <Link
                href="#contact"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>

                <div className="px-3 pt-2 border-t border-border">
                  <Button
                    onClick={() => {
                      setAuthModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full h-10 text-sm bg-orange-gradient hover:bg-orange-gradient-vibrant text-white font-medium rounded-md shadow-lg transition-all duration-300"
                  >
                    Đăng nhập
                  </Button>
                </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Kết Nối Giáo Dục{' '}
                <span className="text-orange-gradient bg-orange-gradient bg-clip-text text-transparent">
                  Thông Minh Với AI
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                EduConnect giúp tự động hóa giao tiếp giữa nhà trường, giáo viên và phụ huynh qua trợ lý ảo AI tiên tiến
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-medium">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Tiết kiệm 70% thời gian xử lý thông tin</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Tăng 90% hiệu quả giao tiếp</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-orange-gradient hover:bg-orange-gradient-vibrant text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Đăng nhập
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 px-8 text-base font-semibold border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-300"
                >
                  <Link href="#docs">
                    <Play className="w-4 h-4 mr-2" />
                    Hướng dẫn
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs sm:text-sm text-gray-500 px-2">hoặc</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* OAuth nằm trong AuthModal để giảm nhiễu giao diện */}
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={`trust-indicator-${num}`} className="w-8 h-8 rounded-full bg-orange-gradient border-2 border-white flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <span>Đã được tin dùng bởi <strong>100+ trường THPT</strong></span>
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              {/* Mock Chat Interface */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">EduConnect AI</h3>
                    <p className="text-sm text-emerald-600">â— Đang hoạt động</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-gray-700">Con em học lớp 10A1 có điểm kiểm tra môn Toán chưa ạ?</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-white">Điểm kiểm tra Toán của em Nguyễn Văn A lớp 10A1: 8.5 điểm. Bài kiểm tra ngày 15/11/2024.</p>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-emerald-500 text-white p-3 rounded-lg shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
            </motion.div>

            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Thách Thức Trong Giao Tiếp Giáo Dục Hiện Tại
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Những khó khăn mà các trường học đang gặp phải trong việc giao tiếp với phụ huynh và học sinh
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
          {[
            {
              icon: X,
              title: "Phụ huynh khó tiếp cận thông tin học tập của con",
              description: "Thông tin phân tán qua nhiều kênh khác nhau, khó theo dõi và cập nhật",
              stat: "85% phụ huynh gặp khó khăn liên lạc với giáo viên",
              color: "text-red-600"
            },
            {
              icon: Clock,
              title: "Giáo viên quá tải với việc trả lời câu hỏi lặp đi lặp lại",
              description: "Thời gian dành cho giảng dạy bị giảm do phải xử lý quá nhiều tin nhắn",
              stat: "Giáo viên dành 3+ giờ/ngày chỉ để trả lời tin nhắn",
              color: "text-orange-600"
            },
            {
              icon: FileX,
              title: "Thông tin phân tán, không đồng bộ giữa các kênh",
              description: "Dữ liệu không nhất quán, dẫn đến hiểu lầm và thông tin sai lệch",
              stat: "60% thông tin bị mất hoặc không cập nhật",
              color: "text-purple-600"
            }
          ].map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center p-6 lg:p-8"
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center ${problem.color}`}>
                <problem.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{problem.title}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{problem.description}</p>
              <div className={`text-sm font-semibold ${problem.color} bg-gray-50 rounded-lg p-3`}>
                {problem.stat}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Tổng quan cổng thông tin trường
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Cổng thông tin tập trung cho giáo viên, học sinh, phụ huynh và quản trị, tích hợp trợ lý AI để hỗ trợ tra cứu nhanh.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, title: "Tự động trả lời 24/7", color: "bg-orange-100 text-primary" },
                { icon: Smartphone, title: "Tích hợp đa nền tảng", color: "bg-emerald-100 text-emerald-600" },
                { icon: TrendingUp, title: "Học hỏi và cải thiện liên tục", color: "bg-purple-100 text-purple-600" }
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="text-center p-4 rounded-lg border border-gray-200"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${benefit.color} flex items-center justify-center`}>
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-border">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Demo Tương Tác</h3>
                  <p className="text-gray-600">Trải nghiệm EduConnect AI ngay bây giờ</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">EduConnect AI</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="text-gray-700">Xin chào! Tôi có thể giúp bạn:</p>
                    <div className="space-y-2">
                      {[
                        " Kiểm tra điểm số học sinh",
                        " Xem lịch học và lịch thi",
                        " Nhận thông báo từ nhà trường",
                        " Liên lạc với giáo viên"
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Tính Năng Nổi Bật
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Giải pháp AI toàn diện với các tính năng tiên tiến cho giáo dục hiện đại
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {[
            {
              icon: Brain,
              title: "Trí Tuệ Nhân Tạo Tiên Tiến",
              description: "Sử dụng NLP và Machine Learning để hiểu và trả lời chính xác các câu hỏi về học tập, lịch trình, điểm số",
              benefits: ["Độ chính xác 95%", "Học từ dữ liệu trường", "Cập nhật liên tục"],
              color: "from-primary to-orange-600"
            },
            {
              icon: Smartphone,
              title: "Tích Hợp Đa Nền Tảng",
              description: "Kết nối với website trường, app mobile, Zalo, Facebook Messenger, SMS",
              benefits: ["Không cần thay đổi hệ thống", "Deployment nhanh", "API mở rộng"],
              color: "from-emerald-500 to-emerald-600"
            },
            {
              icon: BarChart3,
              title: "Phân Tích Thông Minh",
              description: "Dashboard theo dõi hiệu quả giao tiếp, xu hướng câu hỏi, mức độ hài lòng",
              benefits: ["Báo cáo real-time", "Insights tự động", "KPI tracking"],
              color: "from-purple-500 to-purple-600"
            },
            {
              icon: FileEdit,
              title: "Quản Lý Nội Dung Dễ Dàng",
              description: "Cập nhật thông tin trường, lịch học, thông báo qua giao diện trực quan",
              benefits: ["Drag & drop editor", "Bulk upload", "Version control"],
              color: "from-orange-500 to-orange-600"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 lg:p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Docs/How It Works Section */}
      <section id="docs" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            EduConnect Hoạt Động Như Thế Nào?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Quy trình triển khai đơn giản và hiệu quả trong 4 bước
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            {
              step: "01",
              icon: Settings,
              title: "Tích Hợp Hệ Thống",
              description: "Kết nối với hệ thống quản lý học sinh hiện có của trường",
              color: "bg-primary"
            },
            {
              step: "02",
              icon: Brain,
              title: "Cấu Hình AI",
              description: "Huấn luyện AI với dữ liệu và quy trình riêng của trường",
              color: "bg-emerald-500"
            },
            {
              step: "03",
              icon: Smartphone,
              title: "Triển Khai Đa Kênh",
              description: "Phát hành chatbot trên website, app, social media",
              color: "bg-purple-500"
            },
            {
              step: "04",
              icon: Monitor,
              title: "Giám Sát & Tối Ưu",
              description: "Theo dõi hiệu quả và liên tục cải thiện AI",
              color: "bg-orange-500"
            }
          ].map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="relative mb-6">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role-based access Sections */}
      <section id="roles" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Quyền truy cập theo vai trò
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Thiết kế phục vụ đồng thời Ban giám hiệu, giáo viên, học sinh và phụ huynh
          </p>
        </div>

        <div className="space-y-16">
          {/* For School Administrators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Dành Cho Ban Giám Hiệu</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Giảm 60% khối lượng công việc hành chính",
                  "Tăng sự hài lòng của phụ huynh lên 90%",
                  "Tiết kiệm chi phí vận hành 40%"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, title: "Báo cáo tổng quan" },
                  { icon: Settings, title: "Quản lý nhiều bot" },
                  { icon: TrendingUp, title: "ROI tracking" }
                ].map((feature) => (
                  <div key={feature.title} className="text-center p-4 bg-gray-50 rounded-lg">
                    <feature.icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Dashboard Quản Lý</h4>
                <p className="text-gray-600 mb-6">Theo dõi toàn bộ hoạt động của hệ thống</p>

                <div className="space-y-3 text-left">
                  {[
                    { label: "Tin nhắn đã xử lý", value: "2,847", trend: "+12%" },
                    { label: "Độ hài lòng", value: "94%", trend: "+5%" },
                    { label: "Thời gian phản hồi", value: "< 30s", trend: "-40%" }
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{stat.value}</span>
                        <span className="text-xs text-emerald-600 ml-2">{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Teachers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            <div className="lg:order-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Dành Cho Giáo Viên</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Tập trung vào giảng dạy thay vì trả lời email",
                  "Tự động thông báo điểm số, bài tập",
                  "Quản lý lịch họp phụ huynh thông minh"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: MessageCircle, title: "Quick replies" },
                  { icon: Clock, title: "Schedule integration" },
                  { icon: TrendingUp, title: "Student progress tracking" }
                ].map((feature) => (
                  <div key={feature.title} className="text-center p-4 bg-gray-50 rounded-lg">
                    <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:order-1 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Giao Diện Giáo Viên</h4>
                <p className="text-gray-600 mb-6">Quản lý lớp học và giao tiếp hiệu quả</p>

                <div className="space-y-3 text-left">
                  {[
                    " Lớp 10A1 - 35 học sinh",
                    " 5 bài tập chưa chấm",
                    " 12 tin nhắn từ phụ huynh",
                    " Họp phụ huynh 15/12"
                  ].map((item) => (
                    <div key={item} className="p-3 bg-white rounded-lg text-sm text-gray-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Parents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Dành Cho Phụ Huynh</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Nhận thông tin con em 24/7",
                  "Không bỏ lỡ thông báo quan trọng",
                  "Giao tiếp thuận tiện qua kênh quen thuộc"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: AlertCircle, title: "Real-time notifications" },
                  { icon: Star, title: "Grade tracking" },
                  { icon: Clock, title: "Event reminders" }
                ].map((feature) => (
                  <div key={feature.title} className="text-center p-4 bg-gray-50 rounded-lg">
                    <feature.icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Ứng Dụng Phụ Huynh</h4>
                <p className="text-gray-600 mb-6">Theo dõi con em mọi lúc mọi nơi</p>

                <div className="space-y-3 text-left">
                  {[
                    { icon: "", title: "Điểm số mới nhất", desc: "Toán: 8.5, Văn: 9.0" },
                    { icon: "", title: "Lịch học hôm nay", desc: "7 tiết, nghỉ tiết 4" },
                    { icon: "", title: "Thông báo", desc: "Họp phụ huynh 20/12" }
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* General Info Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Thông tin chung về hệ thống
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Số liệu minh họa và phạm vi sử dụng của cổng thông tin
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { number: "100+", label: "Trường THPT", icon: GraduationCap, color: "text-primary" },
            { number: "50,000+", label: "Phụ huynh", icon: Heart, color: "text-emerald-600" },
            { number: "1,000+", label: "Giáo viên", icon: Users, color: "text-purple-600" },
            { number: "95%", label: "Mức độ hài lòng", icon: Star, color: "text-orange-600" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`text-3xl lg:text-4xl font-bold mb-2 ${stat.color}`}>
                <AnimatedCounter end={stat.number} />
              </div>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* User Shares Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Chia sẻ từ người dùng
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Những câu chuyện thực tế trong quá trình vận hành cổng thông tin
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              quote: "EduConnect đã thay đổi hoàn toàn cách chúng tôi giao tiếp với phụ huynh. Hiệu quả vượt mong đợi!",
              name: "Thầy Nguyễn Văn A",
              position: "Hiệu trưởng THPT Lê Quý Đôn",
              avatar: "",
              rating: 5
            },
            {
              quote: "Tôi có thể theo dõi học tập của con bất cứ lúc nào. Rất tiện lợi và nhanh chóng!",
              name: "Cô Trần Thị B",
              position: "Phụ huynh học sinh lớp 11A",
              avatar: "",
              rating: 5
            },
            {
              quote: "Chatbot trả lời chính xác và nhanh chóng. Tôi tiết kiệm được rất nhiều thời gian.",
              name: "Cô Lê Thị C",
              position: "Giáo viên chủ nhiệm",
              avatar: "",
              rating: 5
            }
          ].map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 lg:p-8 bg-gray-50 rounded-2xl border border-gray-200"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={`star-${testimonial.name}-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-primary-foreground text-xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.position}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Những thắc mắc phổ biến về EduConnect và giải đáp chi tiết
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: "EduConnect có khó cài đặt không?",
              answer: "Không, chúng tôi hỗ trợ cài đặt và tích hợp hoàn toàn miễn phí. Thời gian triển khai chỉ 1-2 tuần."
            },
            {
              question: "Dữ liệu học sinh có được bảo mật không?",
              answer: "Tuyệt đối. EduConnect tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật dữ liệu quốc tế và Việt Nam."
            },
            {
              question: "AI có thể trả lời chính xác các câu hỏi phức tạp không?",
              answer: "AI được huấn luyện với dữ liệu cụ thể của từng trường, đảm bảo độ chính xác 95%+ cho các câu hỏi thường gặp."
            },
            {
              question: "EduConnect có tích hợp được với hệ thống hiện tại không?",
              answer: "Có, EduConnect được thiết kế để tích hợp dễ dàng với hầu hết các hệ thống quản lý học sinh hiện có."
            }
          ].map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-br from-primary to-purple-600 text-white">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Truy cập cổng thông tin của trường
            </h2>
            <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
              Đăng nhập để xem thông báo, thời khóa biểu, kết quả học tập và trao đổi với nhà trường
            </p>

             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Button
                 onClick={() => setAuthModalOpen(true)}
                 size="lg"
                 className="h-14 px-8 text-lg font-semibold bg-white text-primary hover:bg-gray-100 shadow-lg"
               >
                 Đăng nhập
                 <ArrowRight className="w-5 h-5 ml-2" />
               </Button>
               <Button
                 asChild
                 variant="outline"
                 size="lg"
                 className="h-14 px-8 text-lg font-semibold bg-white text-primary hover:bg-gray-100 shadow-lg"
               >
                 <Link href="#docs">Hướng dẫn</Link>
               </Button>
             </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Bảo mật theo chuẩn</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Tích hợp tài khoản trường</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Hỗ trợ kỹ thuật</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Image
                  src="/Edu icon.svg"
                  alt="EduConnect Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold">EduConnect</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Giải pháp AI hàng đầu cho giáo dục Việt Nam
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>123 Đường ABC, Quận 1, TP.HCM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>0901 234 567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@educonnect.vn</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Liên Kết Nhanh</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {["Đăng nhập", "Hướng dẫn sử dụng", "Liên hệ hỗ trợ", "Thông báo", "Tin tức"].map((link) => (
                  <div key={link}>
                    <Link href="#" className="hover:text-primary transition-colors">{link}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Pháp Lý</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {["Chính sách bảo mật", "Điều khoản sử dụng", "Cookie Policy"].map((link) => (
                  <div key={link}>
                    <Link href="#" className="hover:text-primary transition-colors">{link}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Theo Dõi Chúng Tôi</h4>
              <div className="flex gap-3">
                {[
                  { icon: ExternalLink, href: "#", label: "LinkedIn" },
                  { icon: ExternalLink, href: "#", label: "Facebook" },
                  { icon: ExternalLink, href: "#", label: "YouTube" },
                  { icon: MessageSquare, href: "#", label: "Zalo" }
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    title={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-300">
              Â© 2025 EduConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </div>
    </LazyMotion>
  )
}

// Authenticated user landing page
interface AuthenticatedLandingPageProps {
  readonly profile: UserProfile
}

function AuthenticatedLandingPage({ profile }: AuthenticatedLandingPageProps) {
  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'admin': return '/dashboard/admin'
      case 'teacher': return '/dashboard/teacher'
      case 'student': return '/student'
      case 'parent': return '/dashboard/parent'
      default: return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header moved to global layout to avoid duplication */}

      {/* Welcome Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            Welcome back to{' '}
            <span className="text-primary">EduConnect</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8">
            You&apos;re signed in as a <span className="font-semibold capitalize">{profile?.role}</span>.
            Access your personalized dashboard to continue your educational journey.
          </p>
          <div className="flex justify-center">
            <Button className="h-11 sm:h-12 md:h-14 px-6 sm:px-8 text-sm sm:text-base md:text-lg" asChild>
              <Link href={getDashboardPath(profile?.role)}>
                Open Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
