import type { NextApiRequest, NextApiResponse } from 'next';
import { login } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const result = await login({ email, password });
    if (!result) {
      // Verifica se o usuário existe
      const userExists = email && email.trim &&
        (require('@/lib/auth').authService.getAllUsers().some((u: any) => u.email === email.trim().toLowerCase()));
      if (!userExists) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      } else {
        return res.status(401).json({ error: 'Senha inválida' });
      }
    }
    return res.status(200).json(result);
  } catch (error: any) {
    // Log para depuração
    console.error('Erro no login API:', error);
    return res.status(401).json({ error: error.message || 'Credenciais inválidas' });
  }
}
