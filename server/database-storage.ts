import { 
  users, 
  kycDocuments, 
  bankAccounts, 
  transactions, 
  custodyWallets,
  type User, 
  type InsertUser,
  type KycDocument,
  type InsertKycDocument,
  type BankAccount,
  type InsertBankAccount,
  type Transaction,
  type InsertTransaction,
  type CustodyWallet,
  type InsertCustodyWallet
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // KYC operations
  getKycDocuments(userId: number): Promise<KycDocument[]>;
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  updateKycDocument(id: number, updates: Partial<KycDocument>): Promise<KycDocument | undefined>;
  
  // Bank account operations
  getBankAccounts(userId: number): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined>;
  
  // Transaction operations
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Custody wallet operations
  getCustodyWallets(): Promise<CustodyWallet[]>;
  getCustodyWalletByNetwork(network: string): Promise<CustodyWallet | undefined>;
  createCustodyWallet(wallet: InsertCustodyWallet): Promise<CustodyWallet>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getKycDocuments(userId: number): Promise<KycDocument[]> {
    return await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
  }

  async createKycDocument(insertDocument: InsertKycDocument): Promise<KycDocument> {
    const [document] = await db.insert(kycDocuments).values(insertDocument).returning();
    return document;
  }

  async updateKycDocument(id: number, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const [document] = await db.update(kycDocuments).set(updates).where(eq(kycDocuments.id, id)).returning();
    return document || undefined;
  }

  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values(insertAccount).returning();
    return account;
  }

  async updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [account] = await db.update(bankAccounts).set(updates).where(eq(bankAccounts.id, id)).returning();
    return account || undefined;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return transaction || undefined;
  }

  async getCustodyWallets(): Promise<CustodyWallet[]> {
    return await db.select().from(custodyWallets);
  }

  async getCustodyWalletByNetwork(network: string): Promise<CustodyWallet | undefined> {
    const [wallet] = await db.select().from(custodyWallets).where(eq(custodyWallets.network, network));
    return wallet || undefined;
  }

  async createCustodyWallet(insertWallet: InsertCustodyWallet): Promise<CustodyWallet> {
    const [wallet] = await db.insert(custodyWallets).values(insertWallet).returning();
    return wallet;
  }
}

export const storage = new DatabaseStorage();