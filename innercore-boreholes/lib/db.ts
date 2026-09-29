import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Reuse the connection across hot reloads in dev and across invocations in serverless.
const globalForMongoose = globalThis as unknown as { mongoose?: Cache };
const cache: Cache = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cache;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");

  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, dbName: process.env.MONGODB_DB || undefined });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
