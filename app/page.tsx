import { Suspense } from "react"
import type { Metadata } from "next"
import Notepad from "@/components/notepad"

export const metadata: Metadata = {
  title: "n0tepad",
  description: "A collaborative notepad application with dark mode",
}

export default function Home() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading notepad...</div>
        }
      >
        <Notepad />
      </Suspense>
    </main>
  )
}

