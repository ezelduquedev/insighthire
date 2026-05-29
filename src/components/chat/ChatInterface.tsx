// Ruta destino: src/components/chat/ChatInterface.tsx
// Crear carpeta: src/components/chat/
'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface ChatInterfaceProps {
  candidateId: string
  candidateName: string
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function ChatInterface({ candidateId, candidateName }: ChatInterfaceProps) {
  const { messages, isLoading, isStreaming, sendMessage, loadHistory, error } = useChat(candidateId)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const firstName = candidateName.split(' ')[0]

  const suggestedQuestions = [
    `¿Cuántos años de experiencia tiene ${firstName}?`,
    `¿Qué tecnologías domina ${firstName}?`,
    `¿Cuál es la formación académica de ${firstName}?`,
    `¿Cuáles son las fortalezas de ${firstName}?`,
  ]

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-xl border border-[var(--ih-border)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ih-border-soft)] bg-[var(--ih-surface-2)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--ih-accent-soft)]">
          <Bot className="w-4 h-4 text-[var(--ih-accent)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--ih-text-primary)]">Chat IA</h3>
          <p className="text-xs text-[var(--ih-text-muted)]">Pregunta sobre {candidateName || 'el candidato'}</p>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--ih-accent)] animate-pulse" />
            <span className="text-xs text-[var(--ih-accent)] font-medium">Pensando...</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="text-center text-[var(--ih-text-secondary)] text-sm py-6">
              <Bot className="w-8 h-8 mx-auto mb-2 text-[var(--ih-text-muted)]" />
              <p className="font-medium text-[var(--ih-text-primary)]">Pregunta lo que quieras sobre el CV de {candidateName || 'este candidato'}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(question)
                    inputRef.current?.focus()
                  }}
                  className="text-left px-3.5 py-2.5 text-xs text-[var(--ih-text-secondary)] bg-[var(--ih-surface-2)] border border-[var(--ih-border)] rounded-xl hover:bg-[var(--ih-accent-soft)] hover:text-[var(--ih-accent)] transition-all font-medium"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'USER' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                message.role === 'USER' ? 'bg-[var(--ih-accent-soft)]' : 'bg-slate-100'
              )}
            >
              {message.role === 'USER' ? (
                <User className="w-3.5 h-3.5 text-[var(--ih-accent)]" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-[var(--ih-text-secondary)]" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border',
                message.role === 'USER'
                  ? 'bg-[var(--ih-accent)] text-white border-[var(--ih-accent)] rounded-br-md'
                  : 'bg-[var(--ih-surface-2)] text-[var(--ih-text-primary)] border-[var(--ih-border-soft)] rounded-bl-md'
              )}
            >
              <p className={cn("whitespace-pre-wrap leading-relaxed", message.role === 'USER' ? 'text-white' : 'text-[var(--ih-text-primary)]')}>{message.content}</p>

              {/* Sources */}
              {message.role === 'ASSISTANT' &&
                message.sources &&
                message.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--ih-border-soft)]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--ih-text-muted)] mb-1">Fuentes:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[var(--ih-border)] text-[var(--ih-text-secondary)] font-medium"
                        >
                          {source.chunkType} ({Math.round(source.similarity * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && !isStreaming && (
          <div className="flex items-center gap-2 text-[var(--ih-text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--ih-accent)]" />
            <span className="text-xs">Analizando CV...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-[var(--ih-border-soft)] bg-[var(--ih-surface-2)]"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre el candidato..."
          disabled={isLoading}
          className="flex-1 bg-white border border-[var(--ih-border)] rounded-lg px-3 py-2 text-sm text-[var(--ih-text-primary)] placeholder-[var(--ih-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ih-accent)]/30 focus:border-[var(--ih-accent)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--ih-accent)] text-white hover:bg-[var(--ih-accent-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}
