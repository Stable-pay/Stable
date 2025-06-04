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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private kycDocuments: Map<number, KycDocument>;
  private bankAccounts: Map<number, BankAccount>;
  private transactions: Map<number, Transaction>;
  private custodyWallets: Map<number, CustodyWallet>;
  private currentUserId: number;
  private currentKycDocumentId: number;
  private currentBankAccountId: number;
  private currentTransactionId: number;
  private currentCustodyWalletId: number;

  constructor() {
    this.users = new Map();
    this.kycDocuments = new Map();
    this.bankAccounts = new Map();
    this.transactions = new Map();
    this.custodyWallets = new Map();
    this.currentUserId = 1;
    this.currentKycDocumentId = 1;
    this.currentBankAccountId = 1;
    this.currentTransactionId = 1;
    this.currentCustodyWalletId = 1;
    
    // Initialize default custody wallets
    this.initializeCustodyWallets();
  }

  private async initializeCustodyWallets() {
    const networks = [
      { network: 'ethereum', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F8e' },
      { network: 'polygon', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F8f' },
      { network: 'solana', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
      { network: 'bnb', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F90' },
      { network: 'base', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F91' },
      { network: 'avalanche', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F92' },
      { network: 'arbitrum', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F93' },
      { network: 'optimism', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F94' },
      { network: 'zksync', address: '0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F95' }
    ];

    for (const wallet of networks) {
      await this.createCustodyWallet(wallet);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getKycDocuments(userId: number): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values()).filter(doc => doc.userId === userId);
  }

  async createKycDocument(insertDocument: InsertKycDocument): Promise<KycDocument> {
    const id = this.currentKycDocumentId++;
    const document: KycDocument = {
      ...insertDocument,
      id,
      createdAt: new Date()
    };
    this.kycDocuments.set(id, document);
    return document;
  }

  async updateKycDocument(id: number, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const document = this.kycDocuments.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.kycDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values()).filter(account => account.userId === userId);
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const id = this.currentBankAccountId++;
    const account: BankAccount = {
      ...insertAccount,
      id,
      createdAt: new Date()
    };
    this.bankAccounts.set(id, account);
    return account;
  }

  async updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const account = this.bankAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...updates };
    this.bankAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async getCustodyWallets(): Promise<CustodyWallet[]> {
    return Array.from(this.custodyWallets.values()).filter(wallet => wallet.isActive);
  }

  async getCustodyWalletByNetwork(network: string): Promise<CustodyWallet | undefined> {
    return Array.from(this.custodyWallets.values()).find(
      wallet => wallet.network === network && wallet.isActive
    );
  }

  async createCustodyWallet(insertWallet: InsertCustodyWallet): Promise<CustodyWallet> {
    const id = this.currentCustodyWalletId++;
    const wallet: CustodyWallet = {
      ...insertWallet,
      id,
      createdAt: new Date()
    };
    this.custodyWallets.set(id, wallet);
    return wallet;
  }
}

export const storage = new MemStorage();
