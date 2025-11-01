import { DurableObject } from 'cloudflare:workers'

interface Session {
  webSocket: WebSocket
  username: string
  quit: boolean
}

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

interface ErrorMessage {
  type: 'error'
  message: string
}

interface PongMessage {
  type: 'pong'
  timestamp: string
  id: string
  serverTime: string
}

type ServerMessage = ChatMessage | UserListMessage | ErrorMessage | PongMessage

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, Session>

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sessions = new Map()
  }

  async fetch(request: Request): Promise<Response> {
    // Expect a WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    // Get username from URL query params
    const url = new URL(request.url)
    const username = url.searchParams.get('username')

    if (!username || username.trim().length === 0) {
      return new Response('Username is required', { status: 400 })
    }

    // Create WebSocket pair
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // Accept the WebSocket connection
    await this.handleSession(server, username.trim())

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async handleSession(webSocket: WebSocket, username: string): Promise<void> {
    // Accept the WebSocket connection
    webSocket.accept()

    // Create session
    const session: Session = {
      webSocket,
      username,
      quit: false,
    }

    this.sessions.set(webSocket, session)

    // Broadcast updated user list to all clients
    this.broadcastUserList()

    // Send join message to all clients
    this.broadcast({
      type: 'message',
      username: 'System',
      text: `${username} joined the chat`,
      timestamp: new Date().toISOString(),
    })

    // Set up event handlers
    webSocket.addEventListener('message', async (msg) => {
      try {
        if (typeof msg.data === 'string') {
          const data = JSON.parse(msg.data)

          if (data.type === 'message' && data.text) {
            // Broadcast message to all clients
            this.broadcast({
              type: 'message',
              username: session.username,
              text: data.text,
              timestamp: new Date().toISOString(),
            })
          } else if (data.type === 'ping') {
            // Handle ping - send pong back to sender only
            webSocket.send(
              JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString(),
                id: data.id,
                serverTime: new Date().toISOString(),
              } as PongMessage),
            )
          }
        }
      } catch (err) {
        // Send error back to this client
        webSocket.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          } as ErrorMessage),
        )
      }
    })

    webSocket.addEventListener('close', () => {
      session.quit = true
      this.sessions.delete(webSocket)

      // Broadcast updated user list
      this.broadcastUserList()

      // Send leave message
      this.broadcast({
        type: 'message',
        username: 'System',
        text: `${username} left the chat`,
        timestamp: new Date().toISOString(),
      })
    })

    webSocket.addEventListener('error', () => {
      session.quit = true
      this.sessions.delete(webSocket)
      this.broadcastUserList()
    })
  }

  broadcast(message: ServerMessage): void {
    const messageStr = JSON.stringify(message)

    this.sessions.forEach((session) => {
      try {
        session.webSocket.send(messageStr)
      } catch (err) {
        // Connection might be closing, mark it for removal
        session.quit = true
      }
    })

    // Clean up any sessions marked as quit
    this.sessions.forEach((session, ws) => {
      if (session.quit) {
        this.sessions.delete(ws)
      }
    })
  }

  broadcastUserList(): void {
    const users = Array.from(this.sessions.values())
      .filter((s) => !s.quit)
      .map((s) => s.username)

    this.broadcast({
      type: 'userList',
      users,
    })
  }
}
