import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"

/**
 * GET /api/users
 * 
 * Lista todos os usuários/analistas cadastrados no sistema
 * Usado para popular dropdowns e filtros na interface de atendimentos
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const client = await clientPromise
    const db = client.db("fynapp")

    // Buscar todos os usuários, ordenados por nome
    let users = await db
      .collection("users")
      .find({})
      .sort({ name: 1 })
      .toArray()

    // Se não houver usuários, criar analistas de exemplo
    if (users.length === 0) {
      console.log("Nenhum usuário encontrado. Criando analistas de exemplo...")
      
      const analistasExemplo = [
        {
          name: "João Silva",
          email: "joao.silva@empresa.com",
          valorHora: 120.00,
          ativo: true,
          role: "analista",
          createdAt: new Date()
        },
        {
          name: "Maria Santos",
          email: "maria.santos@empresa.com",
          valorHora: 150.00,
          ativo: true,
          role: "analista",
          createdAt: new Date()
        },
        {
          name: "Pedro Costa",
          email: "pedro.costa@empresa.com",
          valorHora: 100.00,
          ativo: true,
          role: "analista",
          createdAt: new Date()
        }
      ]

      const result = await db.collection("users").insertMany(analistasExemplo)
      console.log(`✅ ${result.insertedCount} analistas criados com sucesso!`)

      // Buscar novamente
      users = await db
        .collection("users")
        .find({})
        .sort({ name: 1 })
        .toArray()
    }

    // Converter _id para string e remover senhas
    const usersFormatted = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      valorHora: user.valorHora || 0,
      ativo: user.ativo !== false, // default true
      role: user.role || "analista"
    }))

    return res.status(200).json({
      success: true,
      users: usersFormatted,
      total: usersFormatted.length
    })

  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    return res.status(500).json({
      error: "Erro ao listar usuários",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
