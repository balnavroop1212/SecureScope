import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  User,
  StoredUserRecord,
  UsersJsonSchema,
  SignupDTO,
  LoginDTO,
  AuthResponse,
  UserSession,
  UserPlan,
} from '@shared/types';
import { PasswordHasher } from './PasswordHasher';

export interface IAuthRepository {
  register(data: SignupDTO): Promise<AuthResponse>;
  login(data: LoginDTO): Promise<AuthResponse>;
  getCurrentUser(): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateProfile(id: string, updates: { firstName?: string; lastName?: string }): Promise<User>;
  updatePlan(id: string, plan: UserPlan): Promise<User>;
  saveSession(session: UserSession): Promise<void>;
  getCurrentSession(): Promise<UserSession | null>;
  clearSession(): Promise<void>;
}

export class LocalAuthRepository implements IAuthRepository {
  private readonly dataDir: string;
  private readonly usersFilePath: string;
  private readonly sessionFilePath: string;

  constructor(customDataDir?: string) {
    if (customDataDir) {
      this.dataDir = customDataDir;
    } else {
      // In Electron runtime, use app.getPath('userData')
      let userData = '';
      try {
        const { app } = require('electron');
        userData = app.getPath('userData');
      } catch {
        userData = path.join(process.env.APPDATA || process.cwd(), 'SecureScope');
      }
      this.dataDir = path.join(userData, 'data');
    }

    this.usersFilePath = path.join(this.dataDir, 'users.json');
    this.sessionFilePath = path.join(this.dataDir, 'session.json');
  }

  /**
   * Ensures the data directory and initial users.json schema exist.
   */
  public async initialize(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      await fs.promises.mkdir(this.dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.usersFilePath)) {
      const initialSchema: UsersJsonSchema = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        users: [],
      };
      await this.atomicWriteJson(this.usersFilePath, initialSchema);
    }
  }

  /**
   * Registers a new user with email uniqueness check and secure password hashing.
   */
  public async register(data: SignupDTO): Promise<AuthResponse> {
    await this.initialize();
    const schema = await this.readUsersSchema();

    const normalizedEmail = data.email.trim().toLowerCase();

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Invalid email address format' };
    }

    // 2. Email uniqueness check
    const existing = schema.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      return { success: false, error: 'An account with this email address already exists' };
    }

    // 3. Password strength check
    const passwordValidation = this.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.message };
    }

    // 4. Secure password hash
    const passwordHash = await PasswordHasher.hashPassword(data.password);

    // 5. Build user record
    const now = new Date().toISOString();
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;

    const newRecord: StoredUserRecord = {
      id: userId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      plan: 'free',
      subscription: {
        status: 'inactive',
        planId: 'free',
        startedAt: null,
        expiresAt: null,
        priceInr: 0,
        currency: 'INR',
      },
      avatar: null,
      createdAt: now,
      updatedAt: now,
    };

    schema.users.push(newRecord);
    schema.updatedAt = now;

    await this.atomicWriteJson(this.usersFilePath, schema);

    const sanitized = this.sanitizeUser(newRecord);
    return { success: true, user: sanitized };
  }

  /**
   * Authenticates user credentials with constant-time Scrypt verification.
   */
  public async login(data: LoginDTO): Promise<AuthResponse> {
    await this.initialize();
    const schema = await this.readUsersSchema();

    const normalizedEmail = data.email.trim().toLowerCase();
    const userRecord = schema.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!userRecord) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isMatch = await PasswordHasher.verifyPassword(
      data.password,
      userRecord.passwordHash
    );

    if (!isMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Save active session
    const session: UserSession = {
      userId: userRecord.id,
      email: userRecord.email,
      rememberMe: !!data.rememberMe,
      createdAt: new Date().toISOString(),
    };
    await this.saveSession(session);

    return {
      success: true,
      user: this.sanitizeUser(userRecord),
    };
  }

  /**
   * Retrieves the currently active user based on saved session.
   */
  public async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();
    if (!session) return null;
    return this.getUserById(session.userId);
  }

  public async getUserById(id: string): Promise<User | null> {
    await this.initialize();
    const schema = await this.readUsersSchema();
    const user = schema.users.find((u) => u.id === id);
    return user ? this.sanitizeUser(user) : null;
  }

  public async updateProfile(
    id: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<User> {
    await this.initialize();
    const schema = await this.readUsersSchema();
    const user = schema.users.find((u) => u.id === id);

    if (!user) {
      throw new Error('User not found');
    }

    if (updates.firstName !== undefined) user.firstName = updates.firstName.trim();
    if (updates.lastName !== undefined) user.lastName = updates.lastName.trim();
    user.updatedAt = new Date().toISOString();
    schema.updatedAt = user.updatedAt;

    await this.atomicWriteJson(this.usersFilePath, schema);
    return this.sanitizeUser(user);
  }

  public async updatePlan(id: string, plan: UserPlan): Promise<User> {
    await this.initialize();
    const schema = await this.readUsersSchema();
    const user = schema.users.find((u) => u.id === id);

    if (!user) {
      throw new Error('User not found');
    }

    user.plan = plan;
    const now = new Date().toISOString();
    user.updatedAt = now;

    if (plan === 'premium') {
      user.subscription = {
        status: 'active',
        planId: 'premium',
        startedAt: now,
        expiresAt: null, // Configurable duration per architectural guidelines
        priceInr: 299,
        currency: 'INR',
      };
    } else {
      user.subscription = {
        status: 'inactive',
        planId: 'free',
        startedAt: null,
        expiresAt: null,
        priceInr: 0,
        currency: 'INR',
      };
    }

    schema.updatedAt = now;
    await this.atomicWriteJson(this.usersFilePath, schema);
    return this.sanitizeUser(user);
  }

  public async saveSession(session: UserSession): Promise<void> {
    await this.initialize();
    await this.atomicWriteJson(this.sessionFilePath, session);
  }

  public async getCurrentSession(): Promise<UserSession | null> {
    await this.initialize();
    if (!fs.existsSync(this.sessionFilePath)) {
      return null;
    }
    try {
      const content = await fs.promises.readFile(this.sessionFilePath, 'utf-8');
      return JSON.parse(content) as UserSession;
    } catch {
      return null;
    }
  }

  public async clearSession(): Promise<void> {
    if (fs.existsSync(this.sessionFilePath)) {
      await fs.promises.unlink(this.sessionFilePath);
    }
  }

  // Helper: validate password complexity
  private validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one numeric digit' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true, message: '' };
  }

  // Helper: strip password hash
  private sanitizeUser(stored: StoredUserRecord): User {
    const { passwordHash, ...user } = stored;
    return user;
  }

  private async readUsersSchema(): Promise<UsersJsonSchema> {
    const content = await fs.promises.readFile(this.usersFilePath, 'utf-8');
    return JSON.parse(content) as UsersJsonSchema;
  }

  // Atomic file write using temporary file and atomic rename
  private async atomicWriteJson(filePath: string, data: unknown): Promise<void> {
    const tmpPath = `${filePath}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tmpPath, jsonString, 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  }
}
