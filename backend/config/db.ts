import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Trip, User } from '../../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Define TypeScript interfaces for our DB schemas
interface DbUserSchema extends User {
  passwordHash: string;
  salt: string;
}

interface DbSchema {
  users: DbUserSchema[];
  trips: Trip[];
}

// --------------------------------------------------------
// LOCAL FILE FALLBACK DATABASE (db.json)
// --------------------------------------------------------
function initLocalDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const freshDb: DbSchema = { users: [], trips: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf-8');
    return freshDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading db.json, returning recovery DB...', error);
    const freshDb: DbSchema = { users: [], trips: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf-8');
    return freshDb;
  }
}

const dbInMemory = initLocalDb();

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInMemory, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write db.json:', error);
  }
}

// --------------------------------------------------------
// MONGOOSE SCHEMAS & MODELS ENGINES
// --------------------------------------------------------
const MongoUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const MongoTripSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalEstimatedBudget: { type: Number, required: true },
  itinerary: { type: Array, default: [] },
  packingChecklist: { type: Array, default: [] },
  comments: { type: Array, default: [] },
  createdAt: { type: String, required: true },
  fileAttached: { type: Boolean, default: false },
  fileName: { type: String }
});

const MongoUserModel: any = mongoose.models.User || mongoose.model('User', MongoUserSchema);
const MongoTripModel: any = mongoose.models.Trip || mongoose.model('Trip', MongoTripSchema);

// Connection Status Monitor State
let isMongoConnecting = false;
let isMongoConnected = false;
let mongoConnectionError = '';

// Lazy initialization of MongoDB Connection
export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] MONGODB_URI is not set. Operating in Local File (db.json) mode.');
    return;
  }

  if (isMongoConnected || isMongoConnecting) return;

  isMongoConnecting = true;
  console.log('[Database] Connecting to MongoDB...');

  try {
    // Configure mongoose options for a smooth cloud native container connection
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    isMongoConnected = true;
    isMongoConnecting = false;
    console.log('[Database] Successfully connected to MongoDB Atlas!');

    // Programmatically drop legacy conflicting unique indexes like shareId_1
    try {
      const dbInstance = mongoose.connection.db;
      if (dbInstance) {
        const collections = await dbInstance.listCollections({ name: 'trips' }).toArray();
        if (collections.length > 0) {
          await dbInstance.collection('trips').dropIndex('shareId_1');
          console.log('[Database] Successfully dropped legacy unique index "shareId_1" from collection.');
        }
      }
    } catch (indexDropError: any) {
      // Legacy index might not exist or already be dropped, which is completely fine
      console.log('[Database] Legacy "shareId_1" index drop status: already deleted or not found.', indexDropError.message || indexDropError);
    }

    // Trigger automatic import/migration of older db.json data if present
    await runDataMigration();
  } catch (err: any) {
    isMongoConnecting = false;
    isMongoConnected = false;
    mongoConnectionError = err?.message || String(err);
    console.error('[Database] MongoDB Connection failed. Proceeding with Local File database safety backup.', err);
  }
}

// Automatic Data Migrator to export local JSON profiles to Cloud live MongoDB
async function runDataMigration() {
  try {
    console.log('[Migration] Checking for db.json contents to migrate to MongoDB...');
    
    // 1. Migrate Users
    let usersMigratedCount = 0;
    for (const localUser of dbInMemory.users) {
      const exists = await MongoUserModel.findOne({ email: localUser.email });
      if (!exists) {
        await MongoUserModel.create({
          id: localUser.id,
          email: localUser.email,
          passwordHash: localUser.passwordHash,
          salt: localUser.salt,
          createdAt: localUser.createdAt
        });
        usersMigratedCount++;
      }
    }

    // 2. Migrate Trips
    let tripsMigratedCount = 0;
    for (const localTrip of dbInMemory.trips) {
      const exists = await MongoTripModel.findOne({ id: localTrip.id });
      if (!exists) {
        await MongoTripModel.create({
          id: localTrip.id,
          userId: localTrip.userId,
          destination: localTrip.destination,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
          totalEstimatedBudget: localTrip.totalEstimatedBudget,
          itinerary: localTrip.itinerary || [],
          packingChecklist: localTrip.packingChecklist || [],
          comments: localTrip.comments || [],
          createdAt: localTrip.createdAt,
          fileAttached: localTrip.fileAttached,
          fileName: localTrip.fileName
        });
        tripsMigratedCount++;
      }
    }

    if (usersMigratedCount > 0 || tripsMigratedCount > 0) {
      console.log(`[Migration] SUCCESS! Copied ${usersMigratedCount} users and ${tripsMigratedCount} trips from db.json into MongoDB.`);
    } else {
      console.log('[Migration] Migration step evaluated: No new local records to copy. MongoDB is in sync.');
    }
  } catch (error) {
    console.error('[Migration] Error during background data migration to MongoDB:', error);
  }
}

// Expose API connection status telemetry metrics
export const getDatabaseInfo = () => {
  return {
    mode: isMongoConnected ? 'MongoDB Cloud Atlas' : 'Local File Storage (db.json)',
    isMongoDB: isMongoConnected,
    isConnecting: isMongoConnecting,
    error: mongoConnectionError || null,
    counters: {
      localUsers: dbInMemory.users.length,
      localTrips: dbInMemory.trips.length
    }
  };
};

// --------------------------------------------------------
// PASSWORD ENVELOPE SECURITIES
// --------------------------------------------------------
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt || typeof salt !== 'string' || typeof hash !== 'string') {
    return false;
  }
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return verifyHash === hash;
  } catch (error) {
    console.error('Password verification failed mechanically:', error);
    return false;
  }
}

// --------------------------------------------------------
// UNIVERSAL ASYNCHRONOUS DATA WRAPPER
// --------------------------------------------------------
export const db = {
  users: {
    findOne: async (email: string): Promise<DbUserSchema | null> => {
      if (isMongoConnected) {
        try {
          const doc = await MongoUserModel.findOne({ email: email.toLowerCase() });
          if (!doc) return null;
          return {
            id: doc.id || '',
            email: doc.email || '',
            passwordHash: doc.passwordHash || '',
            salt: doc.salt || '',
            createdAt: doc.createdAt || ''
          };
        } catch (error) {
          console.error('[Database] MongoDB findOne user failed, using local fallback:', error);
        }
      }
      // Local db fallback
      const u = dbInMemory.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return null;
      return {
        id: u.id || '',
        email: u.email || '',
        passwordHash: u.passwordHash || '',
        salt: u.salt || '',
        createdAt: u.createdAt || ''
      };
    },
    findById: async (id: string): Promise<DbUserSchema | null> => {
      if (isMongoConnected) {
        try {
          const doc = await MongoUserModel.findOne({ id });
          if (!doc) return null;
          return {
            id: doc.id || '',
            email: doc.email || '',
            passwordHash: doc.passwordHash || '',
            salt: doc.salt || '',
            createdAt: doc.createdAt || ''
          };
        } catch (error) {
          console.error('[Database] MongoDB findById user failed, using local fallback:', error);
        }
      }
      // Local db fallback
      const u = dbInMemory.users.find(x => x.id === id);
      if (!u) return null;
      return {
        id: u.id || '',
        email: u.email || '',
        passwordHash: u.passwordHash || '',
        salt: u.salt || '',
        createdAt: u.createdAt || ''
      };
    },
    create: async (email: string, passwordHash: string, salt: string): Promise<DbUserSchema> => {
      const newUser: DbUserSchema = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        passwordHash,
        salt,
        createdAt: new Date().toISOString()
      };

      if (isMongoConnected) {
        try {
          await MongoUserModel.create(newUser);
          return newUser;
        } catch (error) {
          console.error('[Database] MongoDB user create failure, saving to local database...', error);
        }
      }

      dbInMemory.users.push(newUser);
      saveLocalDb();
      return newUser;
    }
  },
  trips: {
    findMany: async (query?: { userId?: string }): Promise<Trip[]> => {
      if (isMongoConnected) {
        try {
          const docs = query?.userId 
            ? await MongoTripModel.find({ userId: query.userId }).sort({ createdAt: -1 })
            : await MongoTripModel.find({}).sort({ createdAt: -1 });
          
          return docs.map(doc => ({
            id: doc.id,
            userId: doc.userId,
            destination: doc.destination,
            startDate: doc.startDate,
            endDate: doc.endDate,
            totalEstimatedBudget: doc.totalEstimatedBudget,
            itinerary: doc.itinerary,
            packingChecklist: doc.packingChecklist,
            comments: doc.comments,
            createdAt: doc.createdAt,
            fileAttached: doc.fileAttached,
            fileName: doc.fileName
          }));
        } catch (error) {
          console.error('[Database] MongoDB trips findMany query failed, listing local records:', error);
        }
      }

      // Local db fallback
      if (query?.userId) {
        return [...dbInMemory.trips].filter(t => t.userId === query.userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      }
      return [...dbInMemory.trips].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    },
    findById: async (id: string): Promise<Trip | null> => {
      if (isMongoConnected) {
        try {
          const doc = await MongoTripModel.findOne({ id });
          if (!doc) return null;
          return {
            id: doc.id,
            userId: doc.userId,
            destination: doc.destination,
            startDate: doc.startDate,
            endDate: doc.endDate,
            totalEstimatedBudget: doc.totalEstimatedBudget,
            itinerary: doc.itinerary,
            packingChecklist: doc.packingChecklist,
            comments: doc.comments,
            createdAt: doc.createdAt,
            fileAttached: doc.fileAttached,
            fileName: doc.fileName
          };
        } catch (error) {
          console.error('[Database] MongoDB trip findById failed, searching local fallback:', error);
        }
      }

      // Local db fallback
      const t = dbInMemory.trips.find(x => x.id === id);
      return t || null;
    },
    create: async (tripRaw: Omit<Trip, 'id' | 'createdAt' | 'comments'>): Promise<Trip> => {
      const newTrip: Trip = {
        ...tripRaw,
        id: crypto.randomUUID(),
        comments: [],
        createdAt: new Date().toISOString()
      };

      if (isMongoConnected) {
        try {
          await MongoTripModel.create(newTrip);
          return newTrip;
        } catch (error) {
          console.error('[Database] MongoDB create trip failure, registering locally...', error);
        }
      }

      dbInMemory.trips.push(newTrip);
      saveLocalDb();
      return newTrip;
    },
    update: async (id: string, updates: Partial<Trip>): Promise<Trip | null> => {
      if (isMongoConnected) {
        try {
          const doc = await MongoTripModel.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true }
          );
          if (doc) {
            return {
              id: doc.id,
              userId: doc.userId,
              destination: doc.destination,
              startDate: doc.startDate,
              endDate: doc.endDate,
              totalEstimatedBudget: doc.totalEstimatedBudget,
              itinerary: doc.itinerary,
              packingChecklist: doc.packingChecklist,
              comments: doc.comments,
              createdAt: doc.createdAt,
              fileAttached: doc.fileAttached,
              fileName: doc.fileName
            };
          }
        } catch (error) {
          console.error('[Database] MongoDB update trip failed, writing local backup...', error);
        }
      }

      // Local db fallback
      const idx = dbInMemory.trips.findIndex(t => t.id === id);
      if (idx !== -1) {
        dbInMemory.trips[idx] = {
          ...dbInMemory.trips[idx],
          ...updates
        };
        saveLocalDb();
        return dbInMemory.trips[idx];
      }
      return null;
    }
  }
};
