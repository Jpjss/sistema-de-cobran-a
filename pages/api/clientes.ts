import { getDb } from "@/lib/mongodb";

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
  } else {
    res.status(405).end();
  }
}
