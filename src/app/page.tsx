'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// ðŸš€ OPTIMIZATION: Use LazyMotion for smaller bundle size
import { LazyMotion, motion, AnimatePresence } from 'framer-motion'
// ðŸ§¹ CLEANUP: Removed unused dynamic import

// Lazy load motion features
const loadFeatures = () => import('@/lib/motion-features').then(res => res.default)

// ðŸ§¹ CLEANUP: Removed unused MotionDiv import
// ðŸ§¹ CLEANUP: Removed unused Spinner import
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
  const { user, profile } = useAuth() // ðŸ§¹ CLEANUP: Removed unused loading destructure
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ðŸŽ¯ FIXED: Removed individual loading UI - now handled by CoordinatedLoadingOverlay
  // Context7 principle: Single loading indicator prevents cognitive overload

  // Conditional rendering based on auth state
  if (user && profile) {
    return <AuthenticatedLandingPage profile={profile} />
  }

  return (
    <LazyMotion features={loadFeatures}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 scroll-smooth" style={{ willChange: 'transform' }}>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 relative">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src="/Edu Connect.svg"
                alt="EduConnect Logo"
                width={32}
                height={32}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-foreground">EduConnect</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Chá»©c nÄƒng
              </Link>
              <Link href="#roles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Vai trÃ²
              </Link>
              <Link href="#docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                HÆ°á»›ng dáº«n
              </Link>
              <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                Vá» há»‡ thá»‘ng
              </Link>
              <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                LiÃªn há»‡
              </Link>
            </div>

            {/* Desktop Auth Button (single) */}
            <div className="hidden xl:flex items-center space-x-2">
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="min-h-[44px] px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
              >
                ÄÄƒng nháº­p
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
                Chá»©c nÄƒng
              </Link>
              <Link
                href="#roles"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Vai trÃ²
              </Link>
              <Link
                href="#docs"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                HÆ°á»›ng dáº«n
              </Link>
              <Link
                href="#about"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Vá» há»‡ thá»‘ng
              </Link>
              <Link
                href="#contact"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                LiÃªn há»‡
              </Link>

                <div className="px-3 pt-2 border-t border-border">
                  <Button
                    onClick={() => {
                      setAuthModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                  >
                    ÄÄƒng nháº­p
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
                Káº¿t Ná»‘i GiÃ¡o Dá»¥c{' '}
                <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  ThÃ´ng Minh Vá»›i AI
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                EduConnect giÃºp tá»± Ä‘á»™ng hÃ³a giao tiáº¿p giá»¯a nhÃ  trÆ°á»ng, giÃ¡o viÃªn vÃ  phá»¥ huynh qua trá»£ lÃ½ áº£o AI tiÃªn tiáº¿n
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-medium">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Tiáº¿t kiá»‡m 70% thá»i gian xá»­ lÃ½ thÃ´ng tin</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>TÄƒng 90% hiá»‡u quáº£ giao tiáº¿p</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                >
                  ÄÄƒng nháº­p
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 px-8 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Link href="#docs">
                    <Play className="w-4 h-4 mr-2" />
                    HÆ°á»›ng dáº«n
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs sm:text-sm text-gray-500 px-2">hoáº·c</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* OAuth náº±m trong AuthModal Ä‘á»ƒ giáº£m nhiá»…u giao diá»‡n */}
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={`trust-indicator-${num}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 border-2 border-white flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <span>ÄÃ£ Ä‘Æ°á»£c tin dÃ¹ng bá»Ÿi <strong>100+ trÆ°á»ng THPT</strong></span>
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
                    <p className="text-sm text-emerald-600">â— Äang hoáº¡t Ä‘á»™ng</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-gray-700">Con em há»c lá»›p 10A1 cÃ³ Ä‘iá»ƒm kiá»ƒm tra mÃ´n ToÃ¡n chÆ°a áº¡?</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-white">Äiá»ƒm kiá»ƒm tra ToÃ¡n cá»§a em Nguyá»…n VÄƒn A lá»›p 10A1: 8.5 Ä‘iá»ƒm. BÃ i kiá»ƒm tra ngÃ y 15/11/2024.</p>
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
            ThÃ¡ch Thá»©c Trong Giao Tiáº¿p GiÃ¡o Dá»¥c Hiá»‡n Táº¡i
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Nhá»¯ng khÃ³ khÄƒn mÃ  cÃ¡c trÆ°á»ng há»c Ä‘ang gáº·p pháº£i trong viá»‡c giao tiáº¿p vá»›i phá»¥ huynh vÃ  há»c sinh
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
          {[
            {
              icon: X,
              title: "Phá»¥ huynh khÃ³ tiáº¿p cáº­n thÃ´ng tin há»c táº­p cá»§a con",
              description: "ThÃ´ng tin phÃ¢n tÃ¡n qua nhiá»u kÃªnh khÃ¡c nhau, khÃ³ theo dÃµi vÃ  cáº­p nháº­t",
              stat: "85% phá»¥ huynh gáº·p khÃ³ khÄƒn liÃªn láº¡c vá»›i giÃ¡o viÃªn",
              color: "text-red-600"
            },
            {
              icon: Clock,
              title: "GiÃ¡o viÃªn quÃ¡ táº£i vá»›i viá»‡c tráº£ lá»i cÃ¢u há»i láº·p Ä‘i láº·p láº¡i",
              description: "Thá»i gian dÃ nh cho giáº£ng dáº¡y bá»‹ giáº£m do pháº£i xá»­ lÃ½ quÃ¡ nhiá»u tin nháº¯n",
              stat: "GiÃ¡o viÃªn dÃ nh 3+ giá»/ngÃ y chá»‰ Ä‘á»ƒ tráº£ lá»i tin nháº¯n",
              color: "text-orange-600"
            },
            {
              icon: FileX,
              title: "ThÃ´ng tin phÃ¢n tÃ¡n, khÃ´ng Ä‘á»“ng bá»™ giá»¯a cÃ¡c kÃªnh",
              description: "Dá»¯ liá»‡u khÃ´ng nháº¥t quÃ¡n, dáº«n Ä‘áº¿n hiá»ƒu láº§m vÃ  thÃ´ng tin sai lá»‡ch",
              stat: "60% thÃ´ng tin bá»‹ máº¥t hoáº·c khÃ´ng cáº­p nháº­t",
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
                Tá»•ng quan cá»•ng thÃ´ng tin trÆ°á»ng
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Cá»•ng thÃ´ng tin táº­p trung cho giÃ¡o viÃªn, há»c sinh, phá»¥ huynh vÃ  quáº£n trá»‹, tÃ­ch há»£p trá»£ lÃ½ AI Ä‘á»ƒ há»— trá»£ tra cá»©u nhanh.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, title: "Tá»± Ä‘á»™ng tráº£ lá»i 24/7", color: "bg-orange-100 text-primary" },
                { icon: Smartphone, title: "TÃ­ch há»£p Ä‘a ná»n táº£ng", color: "bg-emerald-100 text-emerald-600" },
                { icon: TrendingUp, title: "Há»c há»i vÃ  cáº£i thiá»‡n liÃªn tá»¥c", color: "bg-purple-100 text-purple-600" }
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Demo TÆ°Æ¡ng TÃ¡c</h3>
                  <p className="text-gray-600">Tráº£i nghiá»‡m EduConnect AI ngay bÃ¢y giá»</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">EduConnect AI</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="text-gray-700">Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp báº¡n:</p>
                    <div className="space-y-2">
                      {[
                        "ðŸ“Š Kiá»ƒm tra Ä‘iá»ƒm sá»‘ há»c sinh",
                        "ðŸ“… Xem lá»‹ch há»c vÃ  lá»‹ch thi",
                        "ðŸ“¢ Nháº­n thÃ´ng bÃ¡o tá»« nhÃ  trÆ°á»ng",
                        "ðŸ’¬ LiÃªn láº¡c vá»›i giÃ¡o viÃªn"
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
            TÃ­nh NÄƒng Ná»•i Báº­t
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Giáº£i phÃ¡p AI toÃ n diá»‡n vá»›i cÃ¡c tÃ­nh nÄƒng tiÃªn tiáº¿n cho giÃ¡o dá»¥c hiá»‡n Ä‘áº¡i
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {[
            {
              icon: Brain,
              title: "TrÃ­ Tuá»‡ NhÃ¢n Táº¡o TiÃªn Tiáº¿n",
              description: "Sá»­ dá»¥ng NLP vÃ  Machine Learning Ä‘á»ƒ hiá»ƒu vÃ  tráº£ lá»i chÃ­nh xÃ¡c cÃ¡c cÃ¢u há»i vá» há»c táº­p, lá»‹ch trÃ¬nh, Ä‘iá»ƒm sá»‘",
              benefits: ["Äá»™ chÃ­nh xÃ¡c 95%", "Há»c tá»« dá»¯ liá»‡u trÆ°á»ng", "Cáº­p nháº­t liÃªn tá»¥c"],
              color: "from-primary to-orange-600"
            },
            {
              icon: Smartphone,
              title: "TÃ­ch Há»£p Äa Ná»n Táº£ng",
              description: "Káº¿t ná»‘i vá»›i website trÆ°á»ng, app mobile, Zalo, Facebook Messenger, SMS",
              benefits: ["KhÃ´ng cáº§n thay Ä‘á»•i há»‡ thá»‘ng", "Deployment nhanh", "API má»Ÿ rá»™ng"],
              color: "from-emerald-500 to-emerald-600"
            },
            {
              icon: BarChart3,
              title: "PhÃ¢n TÃ­ch ThÃ´ng Minh",
              description: "Dashboard theo dÃµi hiá»‡u quáº£ giao tiáº¿p, xu hÆ°á»›ng cÃ¢u há»i, má»©c Ä‘á»™ hÃ i lÃ²ng",
              benefits: ["BÃ¡o cÃ¡o real-time", "Insights tá»± Ä‘á»™ng", "KPI tracking"],
              color: "from-purple-500 to-purple-600"
            },
            {
              icon: FileEdit,
              title: "Quáº£n LÃ½ Ná»™i Dung Dá»… DÃ ng",
              description: "Cáº­p nháº­t thÃ´ng tin trÆ°á»ng, lá»‹ch há»c, thÃ´ng bÃ¡o qua giao diá»‡n trá»±c quan",
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
            EduConnect Hoáº¡t Äá»™ng NhÆ° Tháº¿ NÃ o?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Quy trÃ¬nh triá»ƒn khai Ä‘Æ¡n giáº£n vÃ  hiá»‡u quáº£ trong 4 bÆ°á»›c
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            {
              step: "01",
              icon: Settings,
              title: "TÃ­ch Há»£p Há»‡ Thá»‘ng",
              description: "Káº¿t ná»‘i vá»›i há»‡ thá»‘ng quáº£n lÃ½ há»c sinh hiá»‡n cÃ³ cá»§a trÆ°á»ng",
              color: "bg-primary"
            },
            {
              step: "02",
              icon: Brain,
              title: "Cáº¥u HÃ¬nh AI",
              description: "Huáº¥n luyá»‡n AI vá»›i dá»¯ liá»‡u vÃ  quy trÃ¬nh riÃªng cá»§a trÆ°á»ng",
              color: "bg-emerald-500"
            },
            {
              step: "03",
              icon: Smartphone,
              title: "Triá»ƒn Khai Äa KÃªnh",
              description: "PhÃ¡t hÃ nh chatbot trÃªn website, app, social media",
              color: "bg-purple-500"
            },
            {
              step: "04",
              icon: Monitor,
              title: "GiÃ¡m SÃ¡t & Tá»‘i Æ¯u",
              description: "Theo dÃµi hiá»‡u quáº£ vÃ  liÃªn tá»¥c cáº£i thiá»‡n AI",
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
            Quyá»n truy cáº­p theo vai trÃ²
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Thiáº¿t káº¿ phá»¥c vá»¥ Ä‘á»“ng thá»i Ban giÃ¡m hiá»‡u, giÃ¡o viÃªn, há»c sinh vÃ  phá»¥ huynh
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
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">DÃ nh Cho Ban GiÃ¡m Hiá»‡u</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Giáº£m 60% khá»‘i lÆ°á»£ng cÃ´ng viá»‡c hÃ nh chÃ­nh",
                  "TÄƒng sá»± hÃ i lÃ²ng cá»§a phá»¥ huynh lÃªn 90%",
                  "Tiáº¿t kiá»‡m chi phÃ­ váº­n hÃ nh 40%"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, title: "BÃ¡o cÃ¡o tá»•ng quan" },
                  { icon: Settings, title: "Quáº£n lÃ½ nhiá»u bot" },
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
                <h4 className="text-xl font-bold text-gray-900 mb-2">Dashboard Quáº£n LÃ½</h4>
                <p className="text-gray-600 mb-6">Theo dÃµi toÃ n bá»™ hoáº¡t Ä‘á»™ng cá»§a há»‡ thá»‘ng</p>

                <div className="space-y-3 text-left">
                  {[
                    { label: "Tin nháº¯n Ä‘Ã£ xá»­ lÃ½", value: "2,847", trend: "+12%" },
                    { label: "Äá»™ hÃ i lÃ²ng", value: "94%", trend: "+5%" },
                    { label: "Thá»i gian pháº£n há»“i", value: "< 30s", trend: "-40%" }
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
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">DÃ nh Cho GiÃ¡o ViÃªn</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Táº­p trung vÃ o giáº£ng dáº¡y thay vÃ¬ tráº£ lá»i email",
                  "Tá»± Ä‘á»™ng thÃ´ng bÃ¡o Ä‘iá»ƒm sá»‘, bÃ i táº­p",
                  "Quáº£n lÃ½ lá»‹ch há»p phá»¥ huynh thÃ´ng minh"
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
                <h4 className="text-xl font-bold text-gray-900 mb-2">Giao Diá»‡n GiÃ¡o ViÃªn</h4>
                <p className="text-gray-600 mb-6">Quáº£n lÃ½ lá»›p há»c vÃ  giao tiáº¿p hiá»‡u quáº£</p>

                <div className="space-y-3 text-left">
                  {[
                    "ðŸ“š Lá»›p 10A1 - 35 há»c sinh",
                    "ðŸ“ 5 bÃ i táº­p chÆ°a cháº¥m",
                    "ðŸ’¬ 12 tin nháº¯n tá»« phá»¥ huynh",
                    "ðŸ“… Há»p phá»¥ huynh 15/12"
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
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">DÃ nh Cho Phá»¥ Huynh</h3>
              </div>

              <div className="space-y-4">
                {[
                  "Nháº­n thÃ´ng tin con em 24/7",
                  "KhÃ´ng bá» lá»¡ thÃ´ng bÃ¡o quan trá»ng",
                  "Giao tiáº¿p thuáº­n tiá»‡n qua kÃªnh quen thuá»™c"
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
                <h4 className="text-xl font-bold text-gray-900 mb-2">á»¨ng Dá»¥ng Phá»¥ Huynh</h4>
                <p className="text-gray-600 mb-6">Theo dÃµi con em má»i lÃºc má»i nÆ¡i</p>

                <div className="space-y-3 text-left">
                  {[
                    { icon: "ðŸ“Š", title: "Äiá»ƒm sá»‘ má»›i nháº¥t", desc: "ToÃ¡n: 8.5, VÄƒn: 9.0" },
                    { icon: "ðŸ“…", title: "Lá»‹ch há»c hÃ´m nay", desc: "7 tiáº¿t, nghá»‰ tiáº¿t 4" },
                    { icon: "ðŸ“¢", title: "ThÃ´ng bÃ¡o", desc: "Há»p phá»¥ huynh 20/12" }
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
            ThÃ´ng tin chung vá» há»‡ thá»‘ng
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Sá»‘ liá»‡u minh há»a vÃ  pháº¡m vi sá»­ dá»¥ng cá»§a cá»•ng thÃ´ng tin
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { number: "100+", label: "TrÆ°á»ng THPT", icon: GraduationCap, color: "text-primary" },
            { number: "50,000+", label: "Phá»¥ huynh", icon: Heart, color: "text-emerald-600" },
            { number: "1,000+", label: "GiÃ¡o viÃªn", icon: Users, color: "text-purple-600" },
            { number: "95%", label: "Má»©c Ä‘á»™ hÃ i lÃ²ng", icon: Star, color: "text-orange-600" }
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
            Chia sáº» tá»« ngÆ°á»i dÃ¹ng
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Nhá»¯ng cÃ¢u chuyá»‡n thá»±c táº¿ trong quÃ¡ trÃ¬nh váº­n hÃ nh cá»•ng thÃ´ng tin
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              quote: "EduConnect Ä‘Ã£ thay Ä‘á»•i hoÃ n toÃ n cÃ¡ch chÃºng tÃ´i giao tiáº¿p vá»›i phá»¥ huynh. Hiá»‡u quáº£ vÆ°á»£t mong Ä‘á»£i!",
              name: "Tháº§y Nguyá»…n VÄƒn A",
              position: "Hiá»‡u trÆ°á»Ÿng THPT LÃª QuÃ½ ÄÃ´n",
              avatar: "ðŸ‘¨â€ðŸ’¼",
              rating: 5
            },
            {
              quote: "TÃ´i cÃ³ thá»ƒ theo dÃµi há»c táº­p cá»§a con báº¥t cá»© lÃºc nÃ o. Ráº¥t tiá»‡n lá»£i vÃ  nhanh chÃ³ng!",
              name: "CÃ´ Tráº§n Thá»‹ B",
              position: "Phá»¥ huynh há»c sinh lá»›p 11A",
              avatar: "ðŸ‘©â€ðŸ’¼",
              rating: 5
            },
            {
              quote: "Chatbot tráº£ lá»i chÃ­nh xÃ¡c vÃ  nhanh chÃ³ng. TÃ´i tiáº¿t kiá»‡m Ä‘Æ°á»£c ráº¥t nhiá»u thá»i gian.",
              name: "CÃ´ LÃª Thá»‹ C",
              position: "GiÃ¡o viÃªn chá»§ nhiá»‡m",
              avatar: "ðŸ‘©â€ðŸ«",
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
            CÃ¢u Há»i ThÆ°á»ng Gáº·p
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Nhá»¯ng tháº¯c máº¯c phá»• biáº¿n vá» EduConnect vÃ  giáº£i Ä‘Ã¡p chi tiáº¿t
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: "EduConnect cÃ³ khÃ³ cÃ i Ä‘áº·t khÃ´ng?",
              answer: "KhÃ´ng, chÃºng tÃ´i há»— trá»£ cÃ i Ä‘áº·t vÃ  tÃ­ch há»£p hoÃ n toÃ n miá»…n phÃ­. Thá»i gian triá»ƒn khai chá»‰ 1-2 tuáº§n."
            },
            {
              question: "Dá»¯ liá»‡u há»c sinh cÃ³ Ä‘Æ°á»£c báº£o máº­t khÃ´ng?",
              answer: "Tuyá»‡t Ä‘á»‘i. EduConnect tuÃ¢n thá»§ nghiÃªm ngáº·t cÃ¡c tiÃªu chuáº©n báº£o máº­t dá»¯ liá»‡u quá»‘c táº¿ vÃ  Viá»‡t Nam."
            },
            {
              question: "AI cÃ³ thá»ƒ tráº£ lá»i chÃ­nh xÃ¡c cÃ¡c cÃ¢u há»i phá»©c táº¡p khÃ´ng?",
              answer: "AI Ä‘Æ°á»£c huáº¥n luyá»‡n vá»›i dá»¯ liá»‡u cá»¥ thá»ƒ cá»§a tá»«ng trÆ°á»ng, Ä‘áº£m báº£o Ä‘á»™ chÃ­nh xÃ¡c 95%+ cho cÃ¡c cÃ¢u há»i thÆ°á»ng gáº·p."
            },
            {
              question: "EduConnect cÃ³ tÃ­ch há»£p Ä‘Æ°á»£c vá»›i há»‡ thá»‘ng hiá»‡n táº¡i khÃ´ng?",
              answer: "CÃ³, EduConnect Ä‘Æ°á»£c thiáº¿t káº¿ Ä‘á»ƒ tÃ­ch há»£p dá»… dÃ ng vá»›i háº§u háº¿t cÃ¡c há»‡ thá»‘ng quáº£n lÃ½ há»c sinh hiá»‡n cÃ³."
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
              Truy cáº­p cá»•ng thÃ´ng tin cá»§a trÆ°á»ng
            </h2>
            <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
              ÄÄƒng nháº­p Ä‘á»ƒ xem thÃ´ng bÃ¡o, thá»i khÃ³a biá»ƒu, káº¿t quáº£ há»c táº­p vÃ  trao Ä‘á»•i vá»›i nhÃ  trÆ°á»ng
            </p>

             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Button
                 onClick={() => setAuthModalOpen(true)}
                 size="lg"
                 className="h-14 px-8 text-lg font-semibold bg-white text-primary hover:bg-gray-100 shadow-lg"
               >
                 ÄÄƒng nháº­p
                 <ArrowRight className="w-5 h-5 ml-2" />
               </Button>
               <Button
                 asChild
                 variant="outline"
                 size="lg"
                 className="h-14 px-8 text-lg font-semibold bg-white text-primary hover:bg-gray-100 shadow-lg"
               >
                 <Link href="#docs">HÆ°á»›ng dáº«n</Link>
               </Button>
             </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Báº£o máº­t theo chuáº©n</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>TÃ­ch há»£p tÃ i khoáº£n trÆ°á»ng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Há»— trá»£ ká»¹ thuáº­t</span>
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
                  src="/Edu Connect.svg"
                  alt="EduConnect Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold">EduConnect</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Giáº£i phÃ¡p AI hÃ ng Ä‘áº§u cho giÃ¡o dá»¥c Viá»‡t Nam
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>123 ÄÆ°á»ng ABC, Quáº­n 1, TP.HCM</span>
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
              <h4 className="font-semibold">LiÃªn Káº¿t Nhanh</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {["ÄÄƒng nháº­p", "HÆ°á»›ng dáº«n sá»­ dá»¥ng", "LiÃªn há»‡ há»— trá»£", "ThÃ´ng bÃ¡o", "Tin tá»©c"].map((link) => (
                  <div key={link}>
                    <Link href="#" className="hover:text-primary transition-colors">{link}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">PhÃ¡p LÃ½</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {["ChÃ­nh sÃ¡ch báº£o máº­t", "Äiá»u khoáº£n sá»­ dá»¥ng", "Cookie Policy"].map((link) => (
                  <div key={link}>
                    <Link href="#" className="hover:text-primary transition-colors">{link}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Theo DÃµi ChÃºng TÃ´i</h4>
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
