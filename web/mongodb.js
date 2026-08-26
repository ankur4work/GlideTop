import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "glidetop";

// Must match the collection MongoDBSessionStorage writes to.
const collectionName = "shopify_sessions";

let clientPromise;

/**
 * Returns the shared sessions collection, connecting on first use.
 *
 * The connect() promise itself is memoised (rather than the resolved client)
 * so that concurrent callers during cold start share one connection attempt
 * instead of racing to open several.
 */
export const connectToMongoDB = async () => {
  if (!clientPromise) {
    clientPromise = new MongoClient(uri)
      .connect()
      .then((client) => {
        console.log("Connected to MongoDB for session storage");
        return client;
      })
      .catch((error) => {
        // Clear the memo so the next request can retry instead of being stuck
        // with a permanently rejected promise.
        clientPromise = undefined;
        throw error;
      });
  }

  const client = await clientPromise;
  return client.db(dbName).collection(collectionName);
};
