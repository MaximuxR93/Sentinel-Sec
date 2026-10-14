import { MongoClient, Db, Collection } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface UserDoc {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SessionDoc {
  id: string;
  token: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
  active: boolean;
}

export interface AuditLogDoc {
  id: string;
  userId?: string;
  userEmail?: string;
  action: 'login_success' | 'login_failed' | 'register_success' | 'logout' | 'session_validated';
  timestamp: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// In-memory fallback store when MongoDB Atlas is not yet connected
const inMemoryUsers: Map<string, UserDoc> = new Map();
const inMemorySessions: Map<string, SessionDoc> = new Map();
const inMemoryLogs: AuditLogDoc[] = [];

// Seed default users
const defaultSeedUsers = [
  {
    id: 'usr_sarah_chen',
    email: 'analyst@sentinelflow.io',
    password: 'Password123!',
    name: 'Sarah Chen',
    role: 'Senior AppSec Analyst',
    department: 'Application Security',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_marcus_vance',
    email: 'commander@sentinelflow.io',
    password: 'Commander2026!',
    name: 'Marcus Vance',
    role: 'Lead Incident Commander',
    department: 'Security Operations',
    createdAt: new Date().toISOString(),
  },
];

for (const seed of defaultSeedUsers) {
  const hash = bcrypt.hashSync(seed.password, 10);
  inMemoryUsers.set(seed.email.toLowerCase(), {
    id: seed.id,
    email: seed.email.toLowerCase(),
    passwordHash: hash,
    name: seed.name,
    role: seed.role,
    department: seed.department,
    createdAt: seed.createdAt,
  });
}

class AuthDatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private clusterInfo = '';
  private lastPingMs = 0;
  private connectionError: string | null = null;
  private activeMongoUri: string = '';

  constructor() {
    // If environment variable is present at boot, connect automatically
    const envUri = process.env.MONGODB_URI?.trim();
    if (envUri) {
      this.connect(envUri).catch((err) => {
        console.warn('Initial MongoDB Atlas connection attempt failed:', err.message);
      });
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'mongodb_atlas' : 'in_memory_buffer',
      cluster: this.clusterInfo || (this.isConnected ? 'MongoDB Atlas Cluster' : 'Local Memory Buffer'),
      lastPingMs: this.lastPingMs,
      error: this.connectionError,
      hasUriConfigured: Boolean(this.activeMongoUri),
      stats: {
        totalUsers: this.isConnected ? -1 : inMemoryUsers.size,
        activeSessions: this.isConnected ? -1 : Array.from(inMemorySessions.values()).filter(s => s.active).length,
      },
    };
  }

  public async connect(uri: string): Promise<{ success: boolean; message: string; cluster?: string }> {
    try {
      this.connectionError = null;
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore close error
        }
        this.client = null;
        this.db = null;
        this.isConnected = false;
      }

      // Sanitize and validate URI format
      const trimmed = uri.trim();
      if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
        throw new Error('URI must start with mongodb:// or mongodb+srv://');
      }

      // Mask password for safe display
      let safeCluster = 'MongoDB Atlas';
      try {
        const atIndex = trimmed.indexOf('@');
        const slashIndex = trimmed.indexOf('/', atIndex);
        if (atIndex !== -1 && slashIndex !== -1) {
          safeCluster = trimmed.substring(atIndex + 1, slashIndex);
        } else if (atIndex !== -1) {
          safeCluster = trimmed.substring(atIndex + 1);
        }
      } catch {
        safeCluster = 'MongoDB Atlas Cluster';
      }

      const client = new MongoClient(trimmed, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      const start = Date.now();
      await client.connect();
      const pingResult = await client.db('admin').command({ ping: 1 });
      this.lastPingMs = Date.now() - start;

      if (!pingResult || pingResult.ok !== 1) {
        throw new Error('MongoDB ping check did not return ok=1');
      }

      this.client = client;
      // Use default database or 'sentinelflow_auth'
      this.db = client.db('sentinelflow_auth');
      this.isConnected = true;
      this.clusterInfo = safeCluster;
      this.activeMongoUri = trimmed;

      // Initialize indexes and seed data
      await this.initDatabase();

      return {
        success: true,
        message: `Connected successfully to MongoDB Atlas (${safeCluster}) in ${this.lastPingMs}ms`,
        cluster: safeCluster,
      };
    } catch (err: any) {
      this.isConnected = false;
      this.connectionError = err.message || 'Failed to connect to MongoDB Atlas';
      throw new Error(this.connectionError || 'Connection failed');
    }
  }

  private async initDatabase() {
    if (!this.db) return;
    try {
      const usersCol = this.db.collection<UserDoc>('users');
      const sessionsCol = this.db.collection<SessionDoc>('sessions');
      const auditCol = this.db.collection<AuditLogDoc>('audit_logs');

      await usersCol.createIndex({ email: 1 }, { unique: true });
      await sessionsCol.createIndex({ token: 1 }, { unique: true });
      await sessionsCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup
      await auditCol.createIndex({ timestamp: -1 });

      // Seed default accounts if missing in Atlas
      for (const [_, memUser] of inMemoryUsers) {
        const existing = await usersCol.findOne({ email: memUser.email });
        if (!existing) {
          await usersCol.insertOne({ ...memUser });
        }
      }
    } catch (err) {
      console.warn('MongoDB collection init note:', err);
    }
  }

  // User queries
  public async findUserByEmail(email: string): Promise<UserDoc | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isConnected && this.db) {
      return await this.db.collection<UserDoc>('users').findOne({ email: cleanEmail });
    }
    return inMemoryUsers.get(cleanEmail) || null;
  }

  public async createUser(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department?: string;
  }): Promise<UserDoc> {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An analyst account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const id = `usr_${crypto.randomBytes(8).toString('hex')}`;

    const newUser: UserDoc = {
      id,
      email: cleanEmail,
      passwordHash,
      name: data.name.trim(),
      role: data.role || 'Senior AppSec Analyst',
      department: data.department || 'Application Security',
      createdAt: new Date().toISOString(),
    };

    if (this.isConnected && this.db) {
      await this.db.collection<UserDoc>('users').insertOne(newUser);
    } else {
      inMemoryUsers.set(cleanEmail, newUser);
    }

    return newUser;
  }

  public async verifyPassword(user: UserDoc, plain: string): Promise<boolean> {
    return await bcrypt.compare(plain, user.passwordHash);
  }

  // Session & Token Management
  public async createSession(
    user: UserDoc,
    ip = '127.0.0.1',
    userAgent = 'SentinelFlow-Console/1.0'
  ): Promise<SessionDoc> {
    const sessionId = `sfl_sess_${crypto.randomBytes(12).toString('hex')}`;
    const token = `sfl_tok_${crypto.randomBytes(32).toString('hex')}`;
    
    // 24 hours expiry
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const session: SessionDoc = {
      id: sessionId,
      token,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      ip,
      userAgent,
      active: true,
    };

    if (this.isConnected && this.db) {
      await this.db.collection<SessionDoc>('sessions').insertOne(session);
      await this.db.collection<UserDoc>('users').updateOne(
        { email: user.email },
        { $set: { lastLoginAt: now.toISOString() } }
      );
      await this.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'login_success',
        timestamp: now.toISOString(),
        ip,
        userAgent,
      });
    } else {
      inMemorySessions.set(token, session);
      const memUser = inMemoryUsers.get(user.email);
      if (memUser) memUser.lastLoginAt = now.toISOString();
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'login_success',
        timestamp: now.toISOString(),
        ip,
        userAgent,
      });
    }

    return session;
  }

  public async validateToken(token: string): Promise<{ session: SessionDoc; user: UserDoc } | null> {
    if (!token) return null;

    let session: SessionDoc | null = null;
    if (this.isConnected && this.db) {
      session = await this.db.collection<SessionDoc>('sessions').findOne({ token, active: true });
    } else {
      session = inMemorySessions.get(token) || null;
    }

    if (!session || !session.active) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await this.invalidateSession(token);
      return null;
    }

    const user = await this.findUserByEmail(session.userEmail);
    if (!user) return null;

    return { session, user };
  }

  public async invalidateSession(token: string): Promise<boolean> {
    if (!token) return false;

    if (this.isConnected && this.db) {
      await this.db.collection<SessionDoc>('sessions').updateOne(
        { token },
        { $set: { active: false } }
      );
    } else {
      const mem = inMemorySessions.get(token);
      if (mem) mem.active = false;
    }
    return true;
  }

  public async logAudit(entry: Omit<AuditLogDoc, 'id'>) {
    const doc: AuditLogDoc = {
      id: `aud_${crypto.randomBytes(8).toString('hex')}`,
      ...entry,
    };
    if (this.isConnected && this.db) {
      try {
        await this.db.collection<AuditLogDoc>('audit_logs').insertOne(doc);
      } catch {
        // silent
      }
    } else {
      inMemoryLogs.unshift(doc);
      if (inMemoryLogs.length > 500) inMemoryLogs.pop();
    }
  }

  public async getRecentAuditLogs(): Promise<AuditLogDoc[]> {
    if (this.isConnected && this.db) {
      return await this.db.collection<AuditLogDoc>('audit_logs').find().sort({ timestamp: -1 }).limit(25).toArray();
    }
    return inMemoryLogs.slice(0, 25);
  }
}

export const authDb = new AuthDatabaseManager();
