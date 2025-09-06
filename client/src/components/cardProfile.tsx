"use client"

import { useState } from "react"
import { Camera } from "lucide-react"

interface UserProfileCardProps {
  name?: string
  lastName?: string
  lastUpdate?: string
  isActivelySearching?: boolean
  onToggleSearch?: (value: boolean) => void
}

export function UserProfileCard({
  name = "Laura",
  lastName = "Castrillon Fajardo",
  lastUpdate = "09/08/2025",
  isActivelySearching = true,
  onToggleSearch,
}: UserProfileCardProps) {
  const [activeSearch, setActiveSearch] = useState(isActivelySearching)

  const handleToggle = (value: boolean) => {
    setActiveSearch(value)
    onToggleSearch?.(value)
  }

  return (
    <div className="w-80 bg-slate-500/90 rounded-2xl p-8 shadow-xl border border-slate-400/30">
      {/* Avatar placeholder */}
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="text-center">
            <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <span className="text-sm text-slate-600 font-medium">Añadir foto</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
        <p className="text-white/95 text-lg font-medium">{lastName}</p>
      </div>

      {/* Last update */}
      <div className="text-center mb-8">
        <p className="text-white/75 text-sm">Última actualización {lastUpdate}</p>
        <div className="w-full h-px bg-white/20 mt-4"></div>
      </div>

      {/* Active search toggle */}
      <div className="flex items-center justify-between px-2">
        <span className="text-white text-sm font-medium flex-1">En búsqueda activa de empleo</span>
      
      </div>
    </div>
  )
}
