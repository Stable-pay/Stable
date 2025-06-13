import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  email: text("email"),
  kycStatus: text("kyc_status").default("pending"), // pending, verified, rejected
  kycTier: integer("kyc_tier").default(1), // 1, 2, 3
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(), // aadhaar, pan, selfie
  documentUrl: text("document_url").notNull(),
  status: text("status").default("pending"), // pending, verified, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  bankName: text("bank_name").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // swap, withdrawal
  network: text("network").notNull(),
  fromToken: text("from_token"),
  toToken: text("to_token"),
  fromAmount: decimal("from_amount", { precision: 20, scale: 8 }),
  toAmount: decimal("to_amount", { precision: 20, scale: 8 }),
  exchangeRate: decimal("exchange_rate", { precision: 20, scale: 8 }),
  networkFee: decimal("network_fee", { precision: 20, scale: 8 }),
  processingFee: decimal("processing_fee", { precision: 20, scale: 8 }),
  txHash: text("tx_hash"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const custodyWallets = pgTable("custody_wallets", {
  id: serial("id").primaryKey(),
  network: text("network").notNull().unique(),
  address: text("address").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustodyWalletSchema = createInsertSchema(custodyWallets).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertCustodyWallet = z.infer<typeof insertCustodyWalletSchema>;
export type CustodyWallet = typeof custodyWallets.$inferSelect;
