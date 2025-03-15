"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Trash2, Download } from "lucide-react"

export default function Notepad() {
  const [text, setText] = useState("")

  // Load saved text from localStorage on component mount
  useEffect(() => {
    const savedText = localStorage.getItem("notepadText")
    if (savedText) {
      setText(savedText)
    }
  }, [])

  // Save text to localStorage
  const saveText = () => {
    localStorage.setItem("notepadText", text)
    alert("Text saved successfully!")
  }

  // Clear text
  const clearText = () => {
    if (window.confirm("Are you sure you want to clear all text?")) {
      setText("")
      localStorage.removeItem("notepadText")
    }
  }

  // Download text as a file
  const downloadText = () => {
    const element = document.createElement("a")
    const file = new Blob([text], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "notepad-text.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notepad</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={saveText} className="border-gray-700 hover:bg-gray-800">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={clearText} className="border-gray-700 hover:bg-gray-800">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={downloadText} className="border-gray-700 hover:bg-gray-800">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </header>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing here..."
        className="flex-1 resize-none bg-black border-gray-700 focus-visible:ring-gray-500 text-white"
      />

      <footer className="mt-2 text-sm text-gray-400">{text.length} characters</footer>
    </div>
  )
}

