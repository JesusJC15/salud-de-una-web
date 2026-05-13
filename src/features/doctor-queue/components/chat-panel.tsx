'use client'

import type { KeyboardEvent } from 'react'
import type { ChatMessage } from '@/features/doctor-queue/services/consultation-service'
import { useEffect, useRef, useState } from 'react'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Conectando...',
  connected: 'En línea',
  disconnected: 'Desconectado',
  reconnecting: 'Reconectando...',
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  connecting: 'text-yellow-500',
  connected: 'text-green-500',
  disconnected: 'text-slate-400',
  reconnecting: 'text-yellow-500',
}

interface Props {
  messages: ChatMessage[]
  status: ConnectionStatus
  onSend: (content: string) => void
  onRetry?: (message: ChatMessage) => void
  currentUserId: string
  disabled?: boolean
}

export function ChatPanel({ messages, status, onSend, onRetry, currentUserId, disabled }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled)
      return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">Chat clínico</h3>
        <span className={`text-xs font-semibold ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {status !== 'connected' && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            {status === 'reconnecting'
              ? 'Reconectando el chat clínico. Los mensajes pendientes se podrán reintentar.'
              : 'Chat desconectado. Verifica la conexión antes de enviar nuevos mensajes.'}
          </div>
        )}
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-8">
            No hay mensajes aún. Inicia la conversación.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-cyan-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                }`}
              >
                {!isOwn && (
                  <p className="mb-1 text-xs font-bold text-teal-600">
                    {msg.senderRole === 'PATIENT' ? 'Paciente' : 'Médico'}
                  </p>
                )}
                <p>{msg.content}</p>
                {msg.createdAt && (
                  <p className={`mt-1 text-right text-xs ${isOwn ? 'text-cyan-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    {msg.deliveryStatus === 'sending' ? ' · Enviando' : ''}
                    {msg.deliveryStatus === 'failed' ? ' · Falló' : ''}
                  </p>
                )}
                {msg.deliveryStatus === 'failed' && onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(msg)}
                    className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-red-600"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || status !== 'connected'}
            placeholder={status === 'connected' ? 'Escribe un mensaje... (Enter para enviar)' : 'Esperando conexión...'}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || status !== 'connected'}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
