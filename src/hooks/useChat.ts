// Ruta destino: src/hooks/useChat.ts
// Crear carpeta: src/hooks/
'use client'

import { useState, useCallback, useRef } from 'react'
import { ChatMessage } from '@/types'

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  sendMessage: (message: string) => Promise<void>
  loadHistory: () => Promise<void>
  error: string | null
}

export function useChat(candidateId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/chat/history`)
      if (!response.ok) return
      const data = await response.json()
      if (data.success && Array.isArray(data.messages)) {
        // La API no devuelve sources, así que añadimos un array vacío
        const msgs: ChatMessage[] = data.messages.map((m: any) => ({
          ...m,
          sources: m.sources || [],
        }))
        setMessages(msgs)
      }
    } catch {
      // Silencioso: si falla el historial no bloqueamos la UI
    }
  }, [candidateId])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setIsStreaming(true)
    setError(null)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: message,
      sources: [],
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(`/api/candidates/${candidateId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error en el chat')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No se pudo leer la respuesta')

      const decoder = new TextDecoder()
      let assistantContent = ''
      let assistantSources: any[] = []
      let assistantId = (Date.now() + 1).toString()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.content) {
                assistantContent += data.content

                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1]
                  if (lastMessage?.role === 'ASSISTANT' && lastMessage.id === assistantId) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMessage, content: assistantContent },
                    ]
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'ASSISTANT' as const,
                      content: assistantContent,
                      sources: [],
                      createdAt: new Date().toISOString(),
                    },
                  ]
                })
              }

              if (data.done) {
                assistantSources = data.sources || []
                setIsStreaming(false)
              }
            } catch {
              // Ignorar líneas que no son JSON válido
            }
          }
        }
      }

      // Actualizar sources en el mensaje final
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'ASSISTANT' && lastMessage.id === assistantId) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, sources: assistantSources },
          ]
        }
        return prev
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return

      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ASSISTANT' as const,
          content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
          sources: [],
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [candidateId])

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    loadHistory,
    error,
  }
}
