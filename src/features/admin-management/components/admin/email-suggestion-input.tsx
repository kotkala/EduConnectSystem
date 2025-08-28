import { Loader2 } from 'lucide-react'
"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Check, User, Mail } from "lucide-react"
import { searchUsersByEmailAction } from "@/features/admin-management/actions/user-actions"


import { Skeleton } from "@/shared/components/ui/skeleton";interface EmailSuggestionInputProps {
  readonly id: string
  readonly label: string
  readonly placeholder?: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onBlur?: () => void
  readonly error?: string
  readonly onUserSelect?: (user: UserSuggestion) => void
  readonly className?: string
}

interface UserSuggestion {
  id: string
  email: string
  full_name: string
  role: string
  phone_number?: string
  address?: string
  gender?: string
  date_of_birth?: string
}

export function EmailSuggestionInput({
  id,
  label,
  placeholder = "Enter email address",
  value,
  onChange,
  onBlur,
  error,
  onUserSelect,
  className
}: EmailSuggestionInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search for email suggestions
  useEffect(() => {
    const searchEmails = async () => {
      if (value.length < 3 || !value.includes('@')) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        const result = await searchUsersByEmailAction(value)
        if (result.success && result.data) {
          setSuggestions(result.data as UserSuggestion[])
          setShowSuggestions(result.data.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchEmails, 300)
    return () => clearTimeout(timeoutId)
  }, [value])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectUser(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle user selection
  const handleSelectUser = (user: UserSuggestion) => {
    onChange(user.email)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onUserSelect?.(user)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
      onBlur?.()
    }, 200)
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="email"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"} ${className}`}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">âš </span>
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border border-gray-200"
        >
          <CardContent className="p-0">
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`w-full p-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectUser(user)}
                aria-label={`Select user ${user.full_name} with email ${user.email}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {user.role} {user.phone_number && `â€¢ ${user.phone_number}`}
                      </div>
                    </div>
                  </div>
                  <div className="h-8 md:h-9 lg:h-10 w-8 flex items-center justify-center text-green-600">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No suggestions message */}
      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border border-gray-200">
          <CardContent className="p-3">
            <div className="text-sm text-gray-500 text-center">
              No existing users found with this email
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
