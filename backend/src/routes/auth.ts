import { FastifyInstance } from 'fastify'

const LOCAL_USER = {
  sub: 'local-admin',
  username: 'lokal',
  role: 'admin',
  groupId: null,
} as const

export async function localSessionRoutes(app: FastifyInstance) {
  app.get('/api/auth/status', async () => ({ needsSetup: false, user: LOCAL_USER }))
  app.get('/api/auth/me', async () => LOCAL_USER)
  app.post('/api/auth/logout', async () => ({ ok: true }))
}
