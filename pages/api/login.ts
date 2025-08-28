import type { NextApiRequest, NextApiResponse } from 'next';
import { login, authService } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    console.log('🔐 Tentativa de login para:', email);
    
    const result = await login({ email, password });
    if (!result) {
      // Verifica se o usuário existe usando a importação correta
      const userExists = email && email.trim && 
        authService.getAllUsers().some((u: any) => u.email === email.trim().toLowerCase());
      
      if (!userExists) {
        console.log('❌ Usuário não encontrado:', email);
        return res.status(401).json({ error: 'Usuário não encontrado' });
      } else {
        console.log('❌ Senha inválida para:', email);
        return res.status(401).json({ error: 'Senha inválida' });
      }
    }
    
    console.log('✅ Login realizado com sucesso para:', email);
    return res.status(200).json(result);
  } catch (error: any) {
    // Log para depuração
    console.error('❌ Erro no login API:', error);
    return res.status(401).json({ error: error.message || 'Credenciais inválidas' });
  }
}
