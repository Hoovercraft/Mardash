import { FastifyInstance } from 'fastify'

export async function usersRoutes(app: FastifyInstance) {
  const disabled = async (_req: unknown, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) => {
    return reply.status(410).send({ error: 'User and group management has been removed in local single-user mode' })
  }

  app.get('/api/users', disabled)
  app.post('/api/users', disabled)
  app.patch('/api/users/:id', disabled)
  app.delete('/api/users/:id', disabled)
  app.get('/api/user-groups', disabled)
  app.post('/api/user-groups', disabled)
  app.put('/api/user-groups/:id/visibility', disabled)
  app.put('/api/user-groups/:id/arr-visibility', disabled)
  app.put('/api/user-groups/:id/widget-visibility', disabled)
  app.put('/api/user-groups/:id/docker-access', disabled)
  app.put('/api/user-groups/:id/docker-widget-access', disabled)
  app.put('/api/user-groups/:id/background', disabled)
  app.delete('/api/user-groups/:id', disabled)
}
