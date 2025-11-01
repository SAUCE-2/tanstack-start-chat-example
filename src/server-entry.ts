// Export the ChatRoom Durable Object class
export { ChatRoom } from './chat-room'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket upgrade requests
    if (url.pathname === '/api/ws') {
      const upgradeHeader = request.headers.get('Upgrade')
      if (upgradeHeader === 'websocket') {
        const username = url.searchParams.get('username')

        if (!username) {
          return new Response('Username is required', { status: 400 })
        }

        // Get the Durable Object namespace
        const id = env.CHAT_ROOM.idFromName('global-chat')
        const stub = env.CHAT_ROOM.get(id)

        // Forward the request to the Durable Object
        return stub.fetch(request)
      }
    }

    // Import and use the default TanStack Start server entry
    const startServerEntry = await import('@tanstack/react-start/server-entry')
    return startServerEntry.default.fetch(request)
  },
}
