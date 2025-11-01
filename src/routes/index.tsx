import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/')({ component: ChatApp })

interface ChatMessage {
  type: 'message'
  username: string
  text: string
  timestamp: string
}

interface UserListMessage {
  type: 'userList'
  users: string[]
}

interface PongMessage {
  type: 'pong'
  timestamp: string
  id: string
  serverTime: string
}

type ServerMessage = ChatMessage | UserListMessage | PongMessage

function ChatApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [tempUsername, setTempUsername] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected')
  const [pingTime, setPingTime] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingPings = useRef<Map<string, number>>(new Map())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const pingId = Math.random().toString(36).substring(7)
      const timestamp = Date.now()

      pendingPings.current.set(pingId, timestamp)

      wsRef.current.send(
        JSON.stringify({
          type: 'ping',
          id: pingId,
          timestamp: new Date().toISOString(),
        }),
      )
    }
  }

  const startPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    // Send ping immediately
    sendPing()

    // Then every 5 seconds
    pingIntervalRef.current = setInterval(sendPing, 5000)
  }

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }

  const connect = (user: string) => {
    setConnectionStatus('connecting')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws?username=${encodeURIComponent(user)}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      setConnectionStatus('connected')
      startPingInterval()
    }

    ws.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      if (data.type === 'message') {
        setMessages((prev) => [...prev, data])
      } else if (data.type === 'userList') {
        setOnlineUsers(data.users)
      } else if (data.type === 'pong') {
        const sentTime = pendingPings.current.get(data.id)
        if (sentTime) {
          const latency = Date.now() - sentTime
          setPingTime(latency)
          pendingPings.current.delete(data.id)
        }
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setMessages([])
      setOnlineUsers([])
      setPingTime(null)
      stopPingInterval()
    }

    ws.onerror = () => {
      setConnectionStatus('disconnected')
      ws.close()
    }

    wsRef.current = ws
  }

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tempUsername.trim()) {
      connect(tempUsername.trim())
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim() && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          text: messageInput.trim(),
        }),
      )
      setMessageInput('')
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      stopPingInterval()
    }
  }, [])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="mb-2">
                  Choose a username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Join Chat
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <Card className="flex-1 flex flex-col min-w-0 m-0 rounded-none border-0">
        <CardHeader className="border-b flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-4">
            <CardTitle>Chat Room</CardTitle>
            {/* Connection status */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              {pingTime !== null && connectionStatus === 'connected' && (
                <span className="text-muted-foreground">{pingTime}ms</span>
              )}
            </div>
          </div>
          {/* Users popover */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Users ({onlineUsers.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" side="left" className="w-64 m-2">
                <div className="pb-3 border-b mb-2">
                  <h3 className="text-sm font-semibold">
                    Online Users ({onlineUsers.length})
                  </h3>
                </div>
                <ScrollArea className="max-h-[400px]">
                  <ul className="space-y-2">
                    {onlineUsers.map((user, idx) => (
                      <li
                        key={idx}
                        className="text-foreground flex items-center gap-2 py-1"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
                        <span className="truncate">{user}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-4">
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-muted-foreground font-mono text-xs shrink-0 mt-1">
                      {formatTime(msg.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-foreground">
                        {msg.username}:
                      </span>{' '}
                      <span className="text-muted-foreground">{msg.text}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
