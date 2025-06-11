
// src/lib/mongodb.ts
import { MongoClient, type Db, type Collection, type InsertOneResult } from 'mongodb';
import type { Vulnerability } from '@/ai/flows/generate-vulnerability-report';

const uri = process.env.MONGODB_ATLAS_CONNECTION_STRING;
const dbName = process.env.MONGODB_DB_NAME || 'auditlens_db'; // You can make DB name configurable

if (!uri) {
  console.error("MongoDB Critical Error: MONGODB_ATLAS_CONNECTION_STRING is not defined in .env file.");
  // Depending on how critical DB access is at startup, you might throw an error here
  // throw new Error("MONGODB_ATLAS_CONNECTION_STRING is not defined.");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

interface AnalysisReportDocument {
  contractIdentifier: string;
  analysisTimestamp: Date;
  selectedTools: string[];
  vulnerabilities: Vulnerability[];
}

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      // Ping the database to check if the connection is still alive
      await cachedClient.db('admin').command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      console.warn("MongoDB connection lost, attempting to reconnect.", e);
      cachedClient = null;
      cachedDb = null;
    }
  }

  if (!uri) {
    // This check is important if the app can run in a degraded mode without DB
    throw new Error("MongoDB connection URI is not defined. Cannot connect to database.");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log("Successfully connected to MongoDB Atlas.");
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB Atlas:", error);
    // Explicitly close the client if connection failed partway
    await client.close().catch(closeErr => console.error("Failed to close MongoDB client after connection error:", closeErr));
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function saveAnalysisReport(
  contractIdentifier: string,
  selectedTools: string[],
  vulnerabilities: Vulnerability[]
): Promise<InsertOneResult<AnalysisReportDocument> | null> {
  if (!uri) {
    console.error("Cannot save analysis report: MONGODB_ATLAS_CONNECTION_STRING is not defined.");
    return null;
  }
  try {
    const { db } = await connectToDatabase();
    const collection: Collection<AnalysisReportDocument> = db.collection('analysis_reports');
    
    const reportDocument: AnalysisReportDocument = {
      contractIdentifier,
      analysisTimestamp: new Date(),
      selectedTools,
      vulnerabilities,
    };

    const result = await collection.insertOne(reportDocument);
    console.log(`Analysis report saved with ID: ${result.insertedId} for identifier: ${contractIdentifier}`);
    return result;
  } catch (error) {
    console.error(`Error saving analysis report to MongoDB for identifier ${contractIdentifier}:`, error);
    return null; 
  }
}

// Optional: Function to gracefully close the connection when the app shuts down
export async function closeMongoDBConnection() {
  if (cachedClient) {
    await cachedClient.close();
  }
}