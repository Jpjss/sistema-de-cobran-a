import type { NextApiRequest, NextApiResponse } from 'next';
import { login } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const result = await login({ email, password });
    // result deve conter token e/ou dados do usuário
    return res.status(200).json(result);
  } catch (error: any) {
    // Log para depuração
    console.error('Erro no login API:', error);
    return res.status(401).json({ error: error.message || 'Credenciais inválidas' });
  }
}
