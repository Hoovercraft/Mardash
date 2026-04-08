import type { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user?: {
      sub: string
      username: string
      role: 'admin' | 'user' | 'guest'
      groupId?: string | null
    }
    jwtVerify: () => Promise<void>
  }
}
