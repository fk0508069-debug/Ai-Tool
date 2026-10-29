"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  Bot,
  User,
  Loader2,
  Menu,
  Pencil,
  Plus,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  CalendarDays,
  BookOpen,
  Target,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const UPLOAD_URL = "/api/upload";
const CHAT_URL = "/api/chat";
const EDIT_URL = "/api/chat/edit";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  fileName?: string;
  fileType?: string; // 👈 Added to track if it's an image
};

type Conversation = {
  id: string;
  title: string;
};

type ChatUIProps = {
  userName?: string;
  initialMessages?: Message[];
  conversationId?: string;
  conversations?: Conversation[];
};

export function ChatUI({
  userName = "User",
  initialMessages = [],
  conversationId,
  conversations = [],
}: ChatUIProps) {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestLockRef = useRef(false);

  // Synchronize state when navigating between conversations.
  useEffect(() => {
    setMessages(initialMessages);
    setConvId(conversationId);
    setIsNewChat(false);
    setError(null);
    setEditingId(null);
    setEditInput("");
  }, [initialMessages, conversationId]);

  // Keep the latest message visible.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // 👇 HELPER TO PROCESS FILES FROM ANY SOURCE (Drop, Paste, Click) 👇
  function processFile(selected: File) {
    setError(null);
    if (selected.size > MAX_FILE_SIZE) {
      setError("Maximum file size is 15 MB.");
      return;
    }
    setFile(selected);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) processFile(selected);
  }

  // 👇 COPY-PASTE SUPPORT 👇
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedFiles = e.clipboardData?.files;
    if (pastedFiles && pastedFiles.length > 0) {
      e.preventDefault();
      processFile(pastedFiles[0]);
    }
  }

  // 👇 DRAG & DROP SUPPORT 👇
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleNewChat() {
    if (requestLockRef.current || isTyping) return;

    setMessages([]);
    setConvId(undefined);
    setInput("");
    setError(null);
    setEditingId(null);
    setEditInput("");
    setIsSidebarOpen(false);
    setIsNewChat(true);
    clearFile();

    router.push("/assistant?new=1");
  }

  async function uploadDocument(selectedFile: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("subject", "Chat Attachment"); // Updated subject name

    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || "Document upload failed.");
    }
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      (!input.trim() && !file) ||
      requestLockRef.current ||
      isTyping ||
      editingId !== null
    ) {
      return;
    }

    requestLockRef.current = true;

    const userText = input.trim();
    const selectedFile = file;
    
    // Auto-generate message if they just attached a file without text
    const chatMessage = userText || 
      (selectedFile?.type.startsWith("image/") 
        ? "Please analyze this image." 
        : `Please read ${selectedFile?.name}.`);

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: chatMessage,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
    };

    const history = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((previous) => [...previous, newMessage]);
    setInput("");
    clearFile();
    setIsTyping(true);
    setError(null);

    try {
      if (selectedFile) {
        await uploadDocument(selectedFile);
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage,
          history,
          fileName: selectedFile?.name ?? null,
          conversationId: convId ?? null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Chat request failed.");
      }

      if (data?.redirect) {
        router.push(data.redirect);
        return;
      }

      if (typeof data?.reply !== "string") {
        throw new Error("The server returned an invalid chat response.");
      }

      if (!convId && data.conversationId) {
        const newId = String(data.conversationId);

        setConvId(newId);
        setIsNewChat(false);

        router.replace(`/assistant?id=${encodeURIComponent(newId)}`);
        router.refresh();
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);
      setInput((previous) => previous || userText);
    } finally {
      requestLockRef.current = false;
      setIsTyping(false);
    }
  }

  async function handleSaveEdit(messageId: string) {
    if (
      !editInput.trim() ||
      requestLockRef.current ||
      isTyping ||
      !convId
    ) {
      return;
    }

    const msgIndex = messages.findIndex(
      (message) => message.id === messageId
    );

    if (msgIndex === -1) return;

    const newContent = editInput.trim();

    const history = messages
      .slice(0, msgIndex)
      .map(({ role, content }) => ({ role, content }));

    requestLockRef.current = true;
    setIsTyping(true);
    setEditingId(null);
    setError(null);

    const previousMessages = messages;

    setMessages((previous) =>
      previous
        .slice(0, msgIndex + 1)
        .map((message, index) =>
          index === msgIndex
            ? { ...message, content: newContent }
            : message
        )
    );

    try {
      const response = await fetch(EDIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          newContent,
          conversationId: convId,
          history,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to edit message.");
      }

      if (typeof data?.reply !== "string") {
        throw new Error("The server returned an invalid chat response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        },
      ]);

      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to edit message.";

      setError(message);
      setMessages(previousMessages);
    } finally {
      requestLockRef.current = false;
      setIsTyping(false);
    }
  }

  return (
    // 👇 ADDED DRAG AND DROP TO MAIN CONTAINER 👇
    <div 
      className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background text-foreground"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-border/60 bg-background",
          "transition-transform duration-200 ease-out",
          "md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link
            href="/assistant?new=1"
            onClick={(event) => {
              event.preventDefault();
              handleNewChat();
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                AI Life OS
              </p>
              <p className="text-[11px] text-muted-foreground">
                Your personal workspace
              </p>
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat action */}
        <div className="px-3 pb-5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleNewChat}
            disabled={isTyping}
            className="h-11 w-full justify-start gap-3 rounded-xl border-border/70 bg-background font-medium shadow-none hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            New chat
            <span className="ml-auto text-xs text-muted-foreground">
              ↵
            </span>
          </Button>
        </div>

        {/* Conversation history */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-xs font-medium text-muted-foreground">
              Recent conversations
            </p>
          </div>

          <div className="space-y-1">
            {conversations.map((conversation) => {
              const active =
                !isNewChat && convId === conversation.id;

              return (
                <Link
                  key={conversation.id}
                  href={`/assistant?id=${encodeURIComponent(conversation.id)}`}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3",
                    "text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />

                  <span className="min-w-0 flex-1 truncate">
                    {conversation.title || "New conversation"}
                  </span>
                </Link>
              );
            })}

            {conversations.length === 0 && (
              <div className="px-3 py-5">
                <p className="text-xs leading-5 text-muted-foreground">
                  Your saved conversations will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account footer */}
        <div className="shrink-0 border-t border-border/60 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {userName.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                Personal workspace
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">

        {/* Top bar */}
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/90 px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                AI Assistant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Personal assistant
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={handleNewChat}
              disabled={isTyping}
              aria-label="New chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Conversation viewport */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
          <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pt-10">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border border-border/70 bg-muted/40 shadow-sm">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  What can I help you with?
                </h1>

                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Plan your day, organize your goals, study smarter,
                  or get help understanding your documents.
                </p>

                <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setInput("Help me organize my tasks for today.")
                    }
                    className="group rounded-2xl border border-border/70 p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/50"
                  >
                    <CalendarDays className="mb-3 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <p className="text-sm font-medium">Plan my day</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Organize tasks and priorities
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group rounded-2xl border border-border/70 p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/50"
                  >
                    <FileText className="mb-3 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <p className="text-sm font-medium">Read a document</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Upload notes or a PDF
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInput("Help me create a study plan for my exams.")
                    }
                    className="group rounded-2xl border border-border/70 p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/50"
                  >
                    <BookOpen className="mb-3 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <p className="text-sm font-medium">Study smarter</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Create a focused study plan
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInput(
                        "Help me review my goals and build better habits."
                      )
                    }
                    className="group rounded-2xl border border-border/70 p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/50"
                  >
                    <Target className="mb-3 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <p className="text-sm font-medium">Build better habits</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Review goals and routines
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "group flex gap-3 sm:gap-4",
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-1",
                      message.role === "user"
                        ? "max-w-[90%] items-end sm:max-w-[85%]"
                        : "max-w-[calc(100%-2.75rem)] flex-1 items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "min-w-0 text-sm leading-7",
                        message.role === "user"
                          ? "rounded-3xl rounded-br-md bg-muted/70 px-4 py-3 sm:px-5"
                          : "w-full px-0 py-1"
                      )}
                    >
                      {editingId === message.id ? (
                        <div className="w-full min-w-[220px] space-y-3 sm:min-w-[320px]">
                          <Input
                            value={editInput}
                            onChange={(event) =>
                              setEditInput(event.target.value)
                            }
                            className="bg-background"
                            autoFocus
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={!editInput.trim() || isTyping}
                            >
                              Save & Submit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}

                      {message.fileName && (
                        <div className="mt-3 flex max-w-full items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            {/* 👇 DYNAMIC ICON FOR IMAGE vs FILE 👇 */}
                            {message.fileType?.startsWith("image/") ? (
                              <ImageIcon className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {message.fileName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Attached {message.fileType?.startsWith("image/") ? "image" : "document"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && !editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(message.id);
                          setEditInput(message.content);
                        }}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Bottom composer */}
        <div className="shrink-0 bg-background px-3 pb-3 pt-3 sm:px-6 sm:pb-5">
          <div className="mx-auto w-full max-w-3xl">

            {error && (
              <div
                role="alert"
                className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSend}
              className={cn(
                "overflow-hidden rounded-[24px] border border-border/70",
                "bg-background shadow-sm transition-all",
                "focus-within:border-primary/40 focus-within:shadow-md"
              )}
            >
              {/* File preview */}
              {file && (
                <div className="px-4 pt-3">
                  <div className="flex w-fit max-w-full items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2.5">
                    {/* 👇 DYNAMIC ICON IN COMPOSER PREVIEW 👇 */}
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                    )}

                    <span className="max-w-[220px] truncate text-xs">
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={isTyping}
                      aria-label="Remove attachment"
                      className="rounded-md p-1 transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Composer row */}
              <div className="flex items-end gap-2 p-2 sm:gap-3 sm:p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  // 👇 NOW ACCEPTS IMAGES TOO 👇
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Attach document"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping || editingId !== null}
                  className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onPaste={handlePaste} // 👈 PASTE SUPPORT ADDED
                  placeholder="Message AI Life OS... (Paste images here)"
                  disabled={isTyping || editingId !== null}
                  className="min-h-10 flex-1 border-0 bg-transparent px-1 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  disabled={
                    (!input.trim() && !file) ||
                    isTyping ||
                    editingId !== null
                  }
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              AI Life OS can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}