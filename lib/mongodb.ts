import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "sistema_cobranca";

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function getDb() {
  const client = await connectToDatabase();
  return client.db(dbName);
}
