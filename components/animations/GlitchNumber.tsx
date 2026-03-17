"use client"

import { useState, useEffect } from "react"

const GLITCH_CHARS = "0123456789!@#$%^&*"

interface GlitchNumberProps {
  value: string | number
  duration?: number
}

export function GlitchNumber({ value, duration = 800 }: GlitchNumberProps) {
  const [display, setDisplay] = useState(value.toString())
  const valStr = value.toString()

  useEffect(() => {
    let start = Date.now()
    let timer: NodeJS.Timeout

    const tick = () => {
      const now = Date.now()
      const progress = Math.min((now - start) / duration, 1)

      if (progress >= 1) {
        setDisplay(valStr)
        return
      }

      const scrambled = valStr
        .split("")
        .map((char, i) => {
          if (char === " " || char === "," || char === "." || char === "%") return char
          // Reveal characters from left to right as progress increases
          if (progress > i / valStr.length) {
            return valStr[i]
          }
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        })
        .join("")

      setDisplay(scrambled)
      timer = setTimeout(tick, 40) // Run at roughly ~25fps for a nice visual speed
    }

    timer = setTimeout(tick, 40)
    return () => clearTimeout(timer)
  }, [valStr, duration])

  return <span className="tabular-nums">{display}</span>
}