import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const db = await getDb();
    const { nome, email } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ success: false, error: "Nome e e-mail são obrigatórios." });
    }
    const result = await db.collection("clientes").insertOne({ nome, email });
    res.status(201).json({ success: true, id: result.insertedId });
  } else if (req.method === "GET") {
    const db = await getDb();
    const clientes = await db.collection("clientes").find().toArray();
    res.status(200).json(clientes);
  } else if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID do cliente é obrigatório para atualização." });
    }
    const db = await getDb();
    try {
      const updates = req.body;
      await db.collection("clientes").updateOne(
        { _id: new ObjectId(id as string) },
        { $set: updates }
      );
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: "Erro ao atualizar cliente." });
    }
  } else if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID do cliente é obrigatório para exclusão." });
    }
    const db = await getDb();
    try {
      await db.collection("clientes").deleteOne({ _id: new ObjectId(id as string) });
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: "Erro ao excluir cliente." });
    }
  } else {
    res.status(405).end();
  }
}
