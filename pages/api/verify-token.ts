import type { NextApiRequest, NextApiResponse } from 'next';
import { authService } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token não informado' });
  }

  const user = authService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  return res.status(200).json({ user });
}
