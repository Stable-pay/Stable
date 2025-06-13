import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced user schema with social login and travel rule compliance
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  walletAddress: text("wallet_address").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  socialProvider: varchar("social_provider"), // google, facebook, twitter, replit
  socialProviderId: varchar("social_provider_id"),
  kycStatus: text("kyc_status").default("pending"), // pending, verified, rejected
  kycTier: integer("kyc_tier").default(1), // 1, 2, 3
  
  // Travel Rule Information (required for transfers >$3000)
  fullLegalName: text("full_legal_name"),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: varchar("nationality"),
  residenceCountry: varchar("residence_country"),
  residenceAddress: text("residence_address"),
  phoneNumber: varchar("phone_number"),
  
  // Originator Information Signature
  originatorSignature: text("originator_signature"), // Wallet signed data
  originatorSignedAt: timestamp("originator_signed_at"),
  
  isWalletCreated: boolean("is_wallet_created").default(false),
  walletType: varchar("wallet_type"), // social, external, custody
  
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

// Travel Rule Compliance Records
export const travelRuleRecords = pgTable("travel_rule_records", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  
  // Originator Information (sender)
  originatorName: text("originator_name").notNull(),
  originatorAddress: text("originator_address").notNull(),
  originatorWalletAddress: text("originator_wallet_address").notNull(),
  originatorSignature: text("originator_signature").notNull(),
  originatorCountry: varchar("originator_country").notNull(),
  originatorDob: timestamp("originator_dob"),
  
  // Beneficiary Information (recipient)
  beneficiaryName: text("beneficiary_name").notNull(),
  beneficiaryAddress: text("beneficiary_address").notNull(),
  beneficiaryCountry: varchar("beneficiary_country").notNull(),
  beneficiaryPhone: varchar("beneficiary_phone"),
  beneficiaryBankDetails: jsonb("beneficiary_bank_details"),
  
  // Travel Rule Compliance
  thresholdAmount: decimal("threshold_amount", { precision: 20, scale: 2 }), // $3000 USD
  isThresholdExceeded: boolean("is_threshold_exceeded").default(false),
  complianceStatus: varchar("compliance_status").default("pending"), // pending, approved, rejected
  vatpId: varchar("vatp_id"), // Virtual Asset Service Provider ID
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Crypto Purchase Orders
export const cryptoPurchaseOrders = pgTable("crypto_purchase_orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  // Purchase Details
  fiatAmount: decimal("fiat_amount", { precision: 20, scale: 2 }).notNull(),
  fiatCurrency: varchar("fiat_currency").default("USD").notNull(),
  cryptoAmount: decimal("crypto_amount", { precision: 20, scale: 8 }).notNull(),
  cryptoToken: varchar("crypto_token").notNull(), // USDT, USDC, ETH
  exchangeRate: decimal("exchange_rate", { precision: 20, scale: 8 }).notNull(),
  
  // Payment Method
  paymentMethod: varchar("payment_method").notNull(), // card, bank, apple_pay, google_pay
  paymentProcessor: varchar("payment_processor"), // stripe, moonpay, transak
  paymentIntentId: varchar("payment_intent_id"),
  
  // Order Status
  status: varchar("status").default("pending"), // pending, processing, completed, failed, refunded
  networkFee: decimal("network_fee", { precision: 20, scale: 8 }),
  processingFee: decimal("processing_fee", { precision: 20, scale: 2 }),
  
  // Blockchain Details
  network: varchar("network").notNull(), // ethereum, polygon, bsc
  txHash: text("tx_hash"),
  walletAddress: text("wallet_address").notNull(),
  
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Social Wallet Creation Records
export const socialWallets = pgTable("social_wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  // Wallet Details
  walletAddress: text("wallet_address").notNull().unique(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(),
  publicKey: text("public_key").notNull(),
  
  // Social Recovery
  socialProvider: varchar("social_provider").notNull(), // google, facebook, twitter
  socialRecoveryEnabled: boolean("social_recovery_enabled").default(true),
  
  // Security
  mnemonic: text("mnemonic"), // Encrypted mnemonic phrase
  derivationPath: varchar("derivation_path").default("m/44'/60'/0'/0/0"),
  
  // Multi-Chain Support
  supportedNetworks: jsonb("supported_networks"), // Array of supported networks
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced transactions with travel rule and purchase integration
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // remittance, purchase, swap, withdrawal
  
  // Transaction Details
  network: text("network").notNull(),
  fromToken: text("from_token"),
  toToken: text("to_token"),
  fromAmount: decimal("from_amount", { precision: 20, scale: 8 }),
  toAmount: decimal("to_amount", { precision: 20, scale: 8 }),
  exchangeRate: decimal("exchange_rate", { precision: 20, scale: 8 }),
  
  // Fees
  networkFee: decimal("network_fee", { precision: 20, scale: 8 }),
  processingFee: decimal("processing_fee", { precision: 20, scale: 8 }),
  
  // Blockchain
  txHash: text("tx_hash"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  
  // Travel Rule Reference
  travelRuleRecordId: integer("travel_rule_record_id"),
  requiresTravelRule: boolean("requires_travel_rule").default(false),
  
  // Purchase Integration
  cryptoPurchaseOrderId: integer("crypto_purchase_order_id"),
  
  // Status and Metadata
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

// Insert Schemas
export const upsertUserSchema = createInsertSchema(users).omit({
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

export const insertTravelRuleRecordSchema = createInsertSchema(travelRuleRecords).omit({
  id: true,
  createdAt: true,
});

export const insertCryptoPurchaseOrderSchema = createInsertSchema(cryptoPurchaseOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertSocialWalletSchema = createInsertSchema(socialWallets).omit({
  id: true,
  createdAt: true,
});

export const insertCustodyWalletSchema = createInsertSchema(custodyWallets).omit({
  id: true,
  createdAt: true,
});

// Type Exports
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTravelRuleRecord = z.infer<typeof insertTravelRuleRecordSchema>;
export type TravelRuleRecord = typeof travelRuleRecords.$inferSelect;
export type InsertCryptoPurchaseOrder = z.infer<typeof insertCryptoPurchaseOrderSchema>;
export type CryptoPurchaseOrder = typeof cryptoPurchaseOrders.$inferSelect;
export type InsertSocialWallet = z.infer<typeof insertSocialWalletSchema>;
export type SocialWallet = typeof socialWallets.$inferSelect;
export type InsertCustodyWallet = z.infer<typeof insertCustodyWalletSchema>;
export type CustodyWallet = typeof custodyWallets.$inferSelect;
