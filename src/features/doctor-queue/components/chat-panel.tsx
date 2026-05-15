'use client'

import type { KeyboardEvent } from 'react'
import type { ChatMessage } from '@/features/doctor-queue/services/consultation-service'
import { SendHorizonal, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Conectando...',
  connected: 'En línea',
  disconnected: 'Desconectado',
  reconnecting: 'Reconectando...',
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  connecting: 'text-amber-600 bg-amber-50 ring-amber-100',
  connected: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  disconnected: 'text-slate-500 bg-slate-50 ring-slate-100',
  reconnecting: 'text-amber-600 bg-amber-50 ring-amber-100',
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
    <div className="flex h-full min-h-[620px] flex-col rounded-2xl border border-white/80 bg-white/90 shadow-[0_16px_45px_rgba(15,118,110,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">Chat clínico</h3>
          <p className="text-xs text-slate-400">Comunicación en tiempo real con el paciente</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${STATUS_COLOR[status]}`}>
          {status === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
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
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-700">Sin mensajes todavía</p>
            <p className="mt-1 text-xs text-slate-400">Inicia la conversación cuando el paciente esté listo.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isOwn
                    ? 'bg-linear-to-br from-teal-500 to-cyan-600 text-white rounded-br-sm'
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
            placeholder={status === 'connected' ? 'Mensaje al paciente...' : 'Esperando conexión...'}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            aria-label="Enviar mensaje"
            disabled={!input.trim() || disabled || status !== 'connected'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:opacity-40"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
