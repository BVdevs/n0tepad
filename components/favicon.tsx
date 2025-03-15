"use client"

import { useEffect } from "react"

interface FaviconProps {
  isDarkMode: boolean
}

export function Favicon({ isDarkMode }: FaviconProps) {
  useEffect(() => {
    // Create the SVG string with dynamic color
    const color = isDarkMode ? "#e3e3e3" : "#000000"
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="${color}"><path d="M319.33-246.67h321.34v-66.66H319.33v66.66Zm0-166.66h321.34V-480H319.33v66.67ZM226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H574l226 226v507.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm314-542.67v-190.66h-314v666.66h506.66v-476H540.67Zm-314-190.66v190.66-190.66 666.66-666.66Z"/></svg>`

    // Convert SVG string to base64
    const base64Svg = btoa(svgString)

    // Find existing favicon or create new one
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
    }

    // Update favicon
    link.href = `data:image/svg+xml;base64,${base64Svg}`
  }, [isDarkMode])

  return null
}

