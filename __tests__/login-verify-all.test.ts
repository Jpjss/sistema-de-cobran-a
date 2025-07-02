// Teste automatizado de login e validação de token para todos os perfis
import { describe, it, expect } from 'vitest'

const fetch = globalThis.fetch || require('node-fetch')

const perfis = [
  { email: 'admin@sistema.com', senha: 'jp22032006', nome: 'Admin Sistema', role: 'admin' },
  { email: 'financeiro@sistema.com', senha: 'jp22032006', nome: 'João Financeiro', role: 'financeiro' },
  { email: 'suporte@sistema.com', senha: 'jp22032006', nome: 'Maria Suporte', role: 'suporte' },
  { email: 'jp0886230@gmail.com', senha: 'jp22032006', nome: 'Conta Suporte', role: 'suporte' },
]

describe('Login e validação de token para todos os perfis', () => {
  perfis.forEach((perfil) => {
    it(`deve autenticar e validar token para ${perfil.email}`, async () => {
      // Login
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: perfil.email, password: perfil.senha })
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe(perfil.email)
      expect(data.user.role).toBe(perfil.role)
      // Validação do token
      const res2 = await fetch('http://localhost:3000/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token })
      })
      expect(res2.status).toBe(200)
      const data2 = await res2.json()
      expect(data2).toHaveProperty('user')
      expect(data2.user.email).toBe(perfil.email)
      expect(data2.user.role).toBe(perfil.role)
    })
  })
})
