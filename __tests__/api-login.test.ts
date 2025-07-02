import { describe, it, expect } from 'vitest'

const fetch = globalThis.fetch || require('node-fetch')

describe('API Login', () => {
  it('deve autenticar usuário válido', async () => {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sistema.com', password: 'jp22032006' })
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('token')
    expect(data).toHaveProperty('user')
    expect(data.user.email).toBe('admin@sistema.com')
  })

  it('deve recusar usuário/senha inválidos', async () => {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sistema.com', password: 'errada' })
    })
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})
