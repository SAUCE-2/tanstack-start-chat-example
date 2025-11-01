# TanStack Start Cloudflare Chat (template/example/starter)

A real-time chat application built with **TanStack Start**, **Cloudflare Workers**, and **Cloudflare Durable Objects**. This project demonstrates how to build a full-stack application with WebSocket support using modern React frameworks and edge computing.

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **pnpm** (v8 or higher) - [Install pnpm](https://pnpm.io/installation)
- **Cloudflare account** (for deployment) - [Sign up for free](https://dash.cloudflare.com/sign-up)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:

   ```bash
   cd tanstack-start-cloudflare-chat
   ```

2. **Install dependencies using pnpm**:

   ```bash
   pnpm install
   ```

3. **Set up Cloudflare Wrangler** (for local development):
   ```bash
   pnpm exec wrangler login
   ```

### Running Locally

**Start the development server:**

```bash
 pnpm dev
```

The application will be available at `http://localhost:3000`

### Building for Production

**Build the application:**

```bash
pnpm build
```

**Deploy to Cloudflare:**
You may need to run this twice

```bash
pnpm deploy
```

This builds the application and deploys it to Cloudflare Workers using Wrangler.

## Tech Utilised

### TanStack Start

Full-stack React framework that combines the best of React Server Components, routing, and data fetching into a single framework.

#### Resources

- **[TanStack Start Documentation](https://tanstack.com/start/latest)** - Complete documentation
- **[TanStack Start GitHub](https://github.com/tanstack/start)** - Source code and examples
- **[TanStack Start Quick Start](https://tanstack.com/start/latest/docs/quick-start)** - Quick start guide

### Cloudflare Workers

A serverless platform that runs JavaScript at the edge, enabling you to deploy code that executes close to your users.

#### Resources

- **[Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)** - Comprehensive guides
- **[Workers Getting Started Guide](https://developers.cloudflare.com/workers/get-started/guide/)** - First steps with Workers

### Cloudflare Durable Objects

Strongly consistent, stateful coordination for Cloudflare Workers. They're perfect for real-time applications like chat rooms, gaming servers, and collaborative applications.

#### Resources

- **[Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)** - Complete reference
- **[Durable Objects Getting Started](https://developers.cloudflare.com/durable-objects/get-started/)** - Introduction and setup
