import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    template: "%s | n0tepad",
    default: "n0tepad",
  },
  description: "A collaborative notepad application with dark mode",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="notepad-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'