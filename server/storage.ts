import { 
  users, 
  kycDocuments, 
  bankAccounts, 
  transactions, 
  custodyWallets,
  swapOrders,
  balanceUpdates,
  webhookEvents,
  remittanceOrders,
  type User, 
  type InsertUser,
  type KycDocument,
  type InsertKycDocument,
  type BankAccount,
  type InsertBankAccount,
  type Transaction,
  type InsertTransaction,
  type CustodyWallet,
  type InsertCustodyWallet,
  type SwapOrder,
  type InsertSwapOrder,
  type BalanceUpdate,
  type InsertBalanceUpdate,
  type WebhookEvent,
  type InsertWebhookEvent,
  type RemittanceOrder,
  type InsertRemittanceOrder
} from "@shared/schema";

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
  
  // Real-time swap order operations
  getSwapOrders(userId?: number): Promise<SwapOrder[]>;
  getSwapOrder(orderHash: string): Promise<SwapOrder | undefined>;
  createSwapOrder(order: InsertSwapOrder): Promise<SwapOrder>;
  updateSwapOrder(orderHash: string, updates: Partial<SwapOrder>): Promise<SwapOrder | undefined>;
  
  // Real-time balance tracking
  getBalanceUpdates(walletAddress: string): Promise<BalanceUpdate[]>;
  createBalanceUpdate(update: InsertBalanceUpdate): Promise<BalanceUpdate>;
  getLatestBalance(walletAddress: string, tokenAddress: string, chainId: number): Promise<BalanceUpdate | undefined>;
  
  // Webhook event management
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getPendingWebhookEvents(): Promise<WebhookEvent[]>;
  markWebhookProcessed(id: number): Promise<void>;
  
  // Remittance operations
  getRemittanceOrders(userId: number): Promise<RemittanceOrder[]>;
  createRemittanceOrder(order: InsertRemittanceOrder): Promise<RemittanceOrder>;
  updateRemittanceOrder(id: number, updates: Partial<RemittanceOrder>): Promise<RemittanceOrder | undefined>;
}

import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
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

  // KYC operations
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

  // Bank account operations
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

  // Transaction operations
  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
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

  // Custody wallet operations
  async getCustodyWallets(): Promise<CustodyWallet[]> {
    return await db.select().from(custodyWallets).where(eq(custodyWallets.isActive, true));
  }

  async getCustodyWalletByNetwork(network: string): Promise<CustodyWallet | undefined> {
    const [wallet] = await db.select().from(custodyWallets).where(and(eq(custodyWallets.network, network), eq(custodyWallets.isActive, true)));
    return wallet || undefined;
  }

  async createCustodyWallet(insertWallet: InsertCustodyWallet): Promise<CustodyWallet> {
    const [wallet] = await db.insert(custodyWallets).values(insertWallet).returning();
    return wallet;
  }

  // Real-time swap order operations
  async getSwapOrders(userId?: number): Promise<SwapOrder[]> {
    if (userId) {
      return await db.select().from(swapOrders).where(eq(swapOrders.userId, userId)).orderBy(desc(swapOrders.createdAt));
    }
    return await db.select().from(swapOrders).orderBy(desc(swapOrders.createdAt));
  }

  async getSwapOrder(orderHash: string): Promise<SwapOrder | undefined> {
    const [order] = await db.select().from(swapOrders).where(eq(swapOrders.orderHash, orderHash));
    return order || undefined;
  }

  async createSwapOrder(insertOrder: InsertSwapOrder): Promise<SwapOrder> {
    const [order] = await db.insert(swapOrders).values(insertOrder).returning();
    return order;
  }

  async updateSwapOrder(orderHash: string, updates: Partial<SwapOrder>): Promise<SwapOrder | undefined> {
    const [order] = await db.update(swapOrders).set(updates).where(eq(swapOrders.orderHash, orderHash)).returning();
    return order || undefined;
  }

  // Real-time balance tracking
  async getBalanceUpdates(walletAddress: string): Promise<BalanceUpdate[]> {
    return await db.select().from(balanceUpdates).where(eq(balanceUpdates.walletAddress, walletAddress)).orderBy(desc(balanceUpdates.lastUpdated));
  }

  async createBalanceUpdate(insertUpdate: InsertBalanceUpdate): Promise<BalanceUpdate> {
    const [update] = await db.insert(balanceUpdates).values(insertUpdate).returning();
    return update;
  }

  async getLatestBalance(walletAddress: string, tokenAddress: string, chainId: number): Promise<BalanceUpdate | undefined> {
    const [balance] = await db.select().from(balanceUpdates)
      .where(and(
        eq(balanceUpdates.walletAddress, walletAddress),
        eq(balanceUpdates.tokenAddress, tokenAddress),
        eq(balanceUpdates.chainId, chainId)
      ))
      .orderBy(desc(balanceUpdates.lastUpdated))
      .limit(1);
    return balance || undefined;
  }

  // Webhook event management
  async createWebhookEvent(insertEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db.insert(webhookEvents).values(insertEvent).returning();
    return event;
  }

  async getPendingWebhookEvents(): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).where(eq(webhookEvents.processed, false)).orderBy(webhookEvents.createdAt);
  }

  async markWebhookProcessed(id: number): Promise<void> {
    await db.update(webhookEvents).set({ processed: true, processedAt: new Date() }).where(eq(webhookEvents.id, id));
  }

  // Remittance operations
  async getRemittanceOrders(userId: number): Promise<RemittanceOrder[]> {
    return await db.select().from(remittanceOrders).where(eq(remittanceOrders.userId, userId)).orderBy(desc(remittanceOrders.createdAt));
  }

  async createRemittanceOrder(insertOrder: InsertRemittanceOrder): Promise<RemittanceOrder> {
    const [order] = await db.insert(remittanceOrders).values(insertOrder).returning();
    return order;
  }

  async updateRemittanceOrder(id: number, updates: Partial<RemittanceOrder>): Promise<RemittanceOrder | undefined> {
    const [order] = await db.update(remittanceOrders).set(updates).where(eq(remittanceOrders.id, id)).returning();
    return order || undefined;
  }
}

export const storage = new DatabaseStorage();