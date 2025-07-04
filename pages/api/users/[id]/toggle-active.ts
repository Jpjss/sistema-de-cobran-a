import type { NextApiRequest, NextApiResponse } from 'next';
import { authService } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID do usuário não informado' });
  }

  // Alterna o status do usuário
  const users = authService.getAllUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const novoStatus = !user.isActive;
  const ok = authService.updateUser(id, { isActive: novoStatus });
  if (!ok) {
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }

  return res.status(200).json({ id, isActive: novoStatus });
}
