import { getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { clienteId, descricao, valor, vencimento, status } = req.body;
      if (!clienteId || !descricao || !valor || !vencimento) {
        return res.status(400).json({ error: "Dados obrigatórios faltando." });
      }
      const db = await getDb();
      const cobranca = {
        clienteId,
        descricao,
        valor,
        vencimento,
        status: status || "pendente",
        criadoEm: new Date(),
      };
      const result = await db.collection("cobrancas").insertOne(cobranca);
      return res.status(201).json({ success: true, cobrancaId: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao cadastrar cobrança.", details: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const db = await getDb();
      const cobrancas = await db.collection("cobrancas").find({}).toArray();
      return res.status(200).json(cobrancas);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar cobranças.", details: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
