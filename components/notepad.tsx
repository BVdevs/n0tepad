"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { nanoid } from "nanoid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Save,
  Trash2,
  Download,
  FileText,
  Plus,
  Share2,
  Moon,
  Sun,
  Bold,
  Italic,
  Underline,
  Search,
  Undo,
  Redo,
  Users,
  Send,
  Copy,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Favicon } from "./favicon"

// Type definitions
type Note = {
  id: string
  title: string
  content: string
  lastModified: number
}

type User = {
  id: string
  name: string
  color: string
  cursor?: {
    position: number
    selection?: {
      start: number
      end: number
    }
  }
}

type ChatMessage = {
  userId: string
  userName: string
  message: string
  timestamp: number
}

// Generate a random color for user
const getRandomColor = () => {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F033FF",
    "#FF33F0",
    "#33FFF0",
    "#F0FF33",
    "#FF3333",
    "#33FF33",
    "#3333FF",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Wrap the component with dynamic import to disable SSR
const Notepad = () => {
  // Router and params
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams?.get("id")

  // State
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>("")
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [searchText, setSearchText] = useState("")
  const [replaceTextValue, setReplaceTextValue] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [collaborators, setCollaborators] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize app
  useEffect(() => {
    // Load saved notes from localStorage
    const savedNotes = localStorage.getItem("notepadNotes")
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    } else {
      // Create a default note if none exist
      const defaultNote: Note = {
        id: nanoid(),
        title: "Untitled Note",
        content: "",
        lastModified: Date.now(),
      }
      setNotes([defaultNote])
      localStorage.setItem("notepadNotes", JSON.stringify([defaultNote]))
    }

    // Initialize user
    const userId = localStorage.getItem("notepadUserId") || nanoid()
    const userName = localStorage.getItem("notepadUserName") || `User-${userId.substring(0, 4)}`
    localStorage.setItem("notepadUserId", userId)
    localStorage.setItem("notepadUserName", userName)

    const user: User = {
      id: userId,
      name: userName,
      color: getRandomColor(),
    }
    setCurrentUser(user)

    // Check if we're accessing a shared document
    if (documentId) {
      connectToSharedDocument(documentId, user)
    }

    // Set theme based on system preference if not set before
    const savedTheme = localStorage.getItem("notepadTheme")
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(prefersDark)
    }

    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [documentId])

  // Set active note when notes change or when accessing a shared document
  useEffect(() => {
    if (notes.length > 0 && !documentId) {
      // If no active note is set, use the first one
      if (!activeNoteId) {
        setActiveNoteId(notes[0].id)
      }

      // Find and set the active note
      const note = notes.find((note) => note.id === activeNoteId)
      if (note) {
        setActiveNote(note)
      } else {
        setActiveNoteId(notes[0].id)
        setActiveNote(notes[0])
      }
    }
  }, [notes, activeNoteId, documentId])

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("notepadTheme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("notepadTheme", "light")
    }
  }, [isDarkMode])

  // Connect to WebSocket for collaboration
  const connectToSharedDocument = (docId: string, user: User) => {
    // In a real app, this would connect to a real WebSocket server
    // For this demo, we'll simulate collaboration with mock data

    // Set up a mock document for collaboration
    const sharedNote: Note = {
      id: docId,
      title: "Shared Document",
      content: "This is a collaborative document. Type here to see real-time collaboration in action!",
      lastModified: Date.now(),
    }

    setActiveNoteId(docId)
    setActiveNote(sharedNote)

    // Simulate other users
    const mockUsers: User[] = [
      {
        id: "user1",
        name: "Alice",
        color: "#FF5733",
        cursor: { position: 10 },
      },
      {
        id: "user2",
        name: "Bob",
        color: "#33FF57",
        cursor: { position: 25 },
      },
    ]

    setCollaborators([...mockUsers, user])

    // Mock chat messages
    setChatMessages([
      {
        userId: "user1",
        userName: "Alice",
        message: "Hello everyone!",
        timestamp: Date.now() - 60000,
      },
      {
        userId: "user2",
        userName: "Bob",
        message: "Hi Alice, let's work on this document together.",
        timestamp: Date.now() - 30000,
      },
    ])

    // Generate share URL
    const shareUrl = `${window.location.origin}?id=${docId}`
    setShareUrl(shareUrl)

    toast({
      title: "Connected to shared document",
      description: "You are now collaborating in real-time",
    })
  }

  // Update cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current || !currentUser || !documentId) return

    const position = textareaRef.current.selectionStart
    const selection =
      textareaRef.current.selectionStart !== textareaRef.current.selectionEnd
        ? {
            start: textareaRef.current.selectionStart,
            end: textareaRef.current.selectionEnd,
          }
        : undefined

    // In a real app, this would send the cursor position to the server
    // For this demo, we'll just update the local state
    setCurrentUser({
      ...currentUser,
      cursor: { position, selection },
    })
  }

  // Save notes to localStorage
  const saveNotes = () => {
    if (documentId) return // Don't save shared documents to localStorage

    localStorage.setItem("notepadNotes", JSON.stringify(notes))
    toast({
      title: "Saved",
      description: "Your notes have been saved",
    })
  }

  // Auto-save functionality
  const scheduleAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveNotes()
    }, 2000) // Auto-save after 2 seconds of inactivity
  }

  // Create a new note
  const createNewNote = () => {
    const newNote: Note = {
      id: nanoid(),
      title: "Untitled Note",
      content: "",
      lastModified: Date.now(),
    }

    setNotes([...notes, newNote])
    setActiveNoteId(newNote.id)
    setActiveNote(newNote)
    scheduleAutoSave()
  }

  // Delete the active note
  const deleteNote = () => {
    if (notes.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one note",
        variant: "destructive",
      })
      return
    }

    const updatedNotes = notes.filter((note) => note.id !== activeNoteId)
    setNotes(updatedNotes)
    setActiveNoteId(updatedNotes[0].id)
    setActiveNote(updatedNotes[0])
    scheduleAutoSave()

    toast({
      title: "Deleted",
      description: "Note has been deleted",
    })
  }

  // Update note content
  const updateNoteContent = (content: string) => {
    if (!activeNote) return

    // Add to history for undo/redo
    if (historyIndex === -1) {
      setHistory([activeNote.content])
      setHistoryIndex(0)
    } else if (historyIndex < history.length - 1) {
      // If we're in the middle of the history, truncate it
      setHistory(history.slice(0, historyIndex + 1).concat(activeNote.content))
      setHistoryIndex(historyIndex + 1)
    } else {
      // Add to the end of history
      setHistory([...history, activeNote.content])
      setHistoryIndex(history.length)
    }

    // If this is a shared document, send updates to collaborators
    if (documentId) {
      // In a real app, this would send the update to the server
      // For this demo, we'll just update the local state
      setActiveNote({
        ...activeNote,
        content,
        lastModified: Date.now(),
      })

      // Update cursor position
      updateCursorPosition()
    } else {
      // Update local notes
      const updatedNotes = notes.map((note) =>
        note.id === activeNoteId ? { ...note, content, lastModified: Date.now() } : note,
      )

      setNotes(updatedNotes)
      setActiveNote({ ...activeNote, content, lastModified: Date.now() })
      scheduleAutoSave()
    }
  }

  // Update note title
  const updateNoteTitle = (title: string) => {
    if (!activeNote) return

    const updatedNotes = notes.map((note) =>
      note.id === activeNoteId ? { ...note, title, lastModified: Date.now() } : note,
    )

    setNotes(updatedNotes)
    setActiveNote({ ...activeNote, title, lastModified: Date.now() })
    scheduleAutoSave()
  }

  // Download note as a text file
  const downloadNote = () => {
    if (!activeNote) return

    const element = document.createElement("a")
    const file = new Blob([activeNote.content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${activeNote.title.replace(/\s+/g, "-").toLowerCase()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Downloaded",
      description: "Your note has been downloaded",
    })
  }

  // Format selected text
  const formatText = (format: "bold" | "italic" | "underline") => {
    if (!textareaRef.current || !activeNote) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = activeNote.content.substring(start, end)

    let formattedText = ""
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`
        break
      case "italic":
        formattedText = `*${selectedText}*`
        break
      case "underline":
        formattedText = `_${selectedText}_`
        break
    }

    const newContent = activeNote.content.substring(0, start) + formattedText + activeNote.content.substring(end)

    updateNoteContent(newContent)

    // Reset selection to include the formatting characters
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, end + 4) // 4 is for the ** or _ characters
    }, 0)
  }

  // Find and replace functionality
  const findText = () => {
    if (!textareaRef.current || !activeNote || !searchText) return

    const textarea = textareaRef.current
    const content = activeNote.content
    const index = content.indexOf(searchText, textarea.selectionEnd)

    if (index !== -1) {
      textarea.focus()
      textarea.setSelectionRange(index, index + searchText.length)
    } else {
      // If not found from current position, start from beginning
      const fromStart = content.indexOf(searchText)
      if (fromStart !== -1) {
        textarea.focus()
        textarea.setSelectionRange(fromStart, fromStart + searchText.length)
      } else {
        toast({
          title: "Not found",
          description: `"${searchText}" was not found in the document`,
        })
      }
    }
  }

  const replaceText = () => {
    if (!textareaRef.current || !activeNote || !searchText) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = activeNote.content.substring(start, end)

    if (selectedText === searchText) {
      const newContent = activeNote.content.substring(0, start) + replaceTextValue + activeNote.content.substring(end)

      updateNoteContent(newContent)

      textarea.focus()
      textarea.setSelectionRange(start, start + replaceTextValue.length)
    } else {
      toast({
        title: "Cannot replace",
        description: "Please find the text first",
      })
    }
  }

  const replaceAll = () => {
    if (!activeNote || !searchText) return

    const newContent = activeNote.content.split(searchText).join(replaceTextValue)
    updateNoteContent(newContent)

    toast({
      title: "Replaced all",
      description: `All occurrences of "${searchText}" have been replaced`,
    })
  }

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)

      if (!activeNote) return

      const updatedNotes = notes.map((note) =>
        note.id === activeNoteId ? { ...note, content: history[newIndex], lastModified: Date.now() } : note,
      )

      setNotes(updatedNotes)
      setActiveNote({ ...activeNote, content: history[newIndex], lastModified: Date.now() })
      scheduleAutoSave()
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

      if (!activeNote) return

      const updatedNotes = notes.map((note) =>
        note.id === activeNoteId ? { ...note, content: history[newIndex], lastModified: Date.now() } : note,
      )

      setNotes(updatedNotes)
      setActiveNote({ ...activeNote, content: history[newIndex], lastModified: Date.now() })
      scheduleAutoSave()
    }
  }

  // Chat functionality
  const sendChatMessage = () => {
    if (!newChatMessage.trim() || !currentUser) return

    const message: ChatMessage = {
      userId: currentUser.id,
      userName: currentUser.name,
      message: newChatMessage,
      timestamp: Date.now(),
    }

    setChatMessages([...chatMessages, message])
    setNewChatMessage("")

    // In a real app, this would send the message to other collaborators
  }

  // Share document
  const shareDocument = () => {
    if (!activeNote) return

    // In a real app, this would create a shared document on the server
    // For this demo, we'll just generate a URL with the current note ID
    const docId = activeNote.id
    const url = `${window.location.origin}?id=${docId}`
    setShareUrl(url)

    toast({
      title: "Share link created",
      description: "Copy the link to share with others",
    })
  }

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)

    toast({
      title: "Copied",
      description: "Share link copied to clipboard",
    })
  }

  // Calculate stats
  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  const getLineCount = (text: string) => {
    return text.split("\n").length
  }

  // Render line numbers
  const renderLineNumbers = () => {
    if (!activeNote || !showLineNumbers) return null

    const lineCount = getLineCount(activeNote.content)
    return (
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted flex flex-col items-end pr-2 pt-4 text-xs text-muted-foreground select-none">
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} className="leading-6">
            {i + 1}
          </div>
        ))}
      </div>
    )
  }

  // Render collaborator cursors (in a real app, these would be positioned correctly)
  const renderCollaboratorCursors = () => {
    if (!documentId || collaborators.length <= 1) return null

    return (
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {collaborators
          .filter((user) => user.id !== currentUser?.id)
          .map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
              <span className="text-xs">{user.name}</span>
            </div>
          ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-screen", isDarkMode ? "bg-black text-white" : "bg-white text-black")}>
      <Favicon isDarkMode={isDarkMode} />
      <header className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-xl font-bold">n0tepad</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Formatting tools */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText("bold")}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText("italic")}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText("underline")}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

          {/* Font size */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
            >
              A-
            </Button>
            <span className="text-xs w-4 text-center">{fontSize}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
            >
              A+
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

          {/* Search */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={cn(isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200", isSearchOpen && "bg-muted")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Find & Replace</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Undo/Redo */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

          {/* Collaboration */}
          {documentId && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className={cn(isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200", isChatOpen && "bg-muted")}
                    >
                      <Users className="h-4 w-4" />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Collaborators ({collaborators.length})</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Document</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-4">
                    <Input value={shareUrl} readOnly />
                    <Button onClick={copyShareUrl}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
            </>
          )}

          {/* File operations */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveNotes}
                  disabled={!!documentId}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={downloadNote}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!documentId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!documentId) {
                        shareDocument()
                      }
                    }}
                    className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDarkMode ? "Light Mode" : "Dark Mode"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Search bar */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 p-2 border-b">
          <Input
            placeholder="Find"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Replace"
            value={replaceTextValue}
            onChange={(e) => setReplaceTextValue(e.target.value)}
            className="max-w-xs"
          />
          <Button size="sm" onClick={findText}>
            Find
          </Button>
          <Button size="sm" onClick={replaceText}>
            Replace
          </Button>
          <Button size="sm" onClick={replaceAll}>
            Replace All
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Note list sidebar */}
        {!documentId && (
          <div className="w-64 border-r overflow-auto">
            <div className="p-2 flex justify-between items-center">
              <h2 className="font-semibold">Notes</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={createNewNote}
                className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="divide-y">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={cn("p-2 cursor-pointer hover:bg-muted", note.id === activeNoteId && "bg-muted")}
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <div className="font-medium truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {new Date(note.lastModified).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeNote && (
            <>
              <div className="p-2 border-b flex items-center">
                <Input
                  value={activeNote.title}
                  onChange={(e) => updateNoteTitle(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-lg font-medium"
                  disabled={!!documentId}
                />

                {!documentId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={deleteNote}
                    className={isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-hidden relative">
                {renderLineNumbers()}
                {renderCollaboratorCursors()}

                <Textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => updateNoteContent(e.target.value)}
                  onSelect={updateCursorPosition}
                  className={cn(
                    "h-full w-full resize-none rounded-none border-0 focus-visible:ring-0",
                    isDarkMode ? "bg-black text-white" : "bg-white text-black",
                    showLineNumbers && "pl-12",
                  )}
                  style={{ fontSize: `${fontSize}px` }}
                />
              </div>

              <div className="p-2 border-t flex justify-between text-xs text-muted-foreground">
                <div className="flex gap-4">
                  <span>{getWordCount(activeNote.content)} words</span>
                  <span>{activeNote.content.length} characters</span>
                  <span>{getLineCount(activeNote.content)} lines</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={showLineNumbers}
                      onChange={() => setShowLineNumbers(!showLineNumbers)}
                      className="h-3 w-3"
                    />
                    Line numbers
                  </label>

                  {documentId && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {collaborators.length} online
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Collaboration chat sidebar */}
        {isChatOpen && documentId && (
          <div className="w-64 border-l flex flex-col">
            <div className="p-2 border-b font-medium">Chat</div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {chatMessages.map((msg, i) => {
                const user = collaborators.find((u) => u.id === msg.userId)
                return (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user?.color || "#ccc" }} />
                      <span className="font-medium">{msg.userName}</span>
                    </div>
                    <p className="pl-3">{msg.message}</p>
                  </div>
                )
              })}
            </div>
            <div className="p-2 border-t flex gap-2">
              <Input
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage()
                  }
                }}
              />
              <Button size="icon" onClick={sendChatMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export with dynamic to disable SSR
export default dynamic(() => Promise.resolve(Notepad), {
  ssr: false,
})

