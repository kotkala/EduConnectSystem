'use client'

import Link from 'next/link'
import Image from 'next/image'

const nav = [
  { href: '#features', label: 'Chức năng' },
  { href: '#roles', label: 'Vai trò' },
  { href: '#docs', label: 'Hướng dẫn' },
  { href: '#about', label: 'Về hệ thống' },
  { href: '#contact', label: 'Liên hệ' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-orange-gradient-soft/90 backdrop-blur supports-[backdrop-filter]:bg-orange-gradient-soft/90 border-b border-orange-200">
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/Edu icon.svg"
              alt="EduConnect"
              width={32}
              height={32}
              className="h-8 w-8 transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-orange-gradient-vibrant rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </div>
          <span className="font-bold text-lg text-orange-gradient bg-orange-gradient bg-clip-text text-transparent">
            EduConnect Portal
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-orange-700 hover:text-orange-600 transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-gradient transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}


