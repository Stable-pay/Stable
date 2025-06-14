import { Request, Response } from 'express';
import { z } from 'zod';

// Travel Rule data schema for compliance
const travelRuleSchema = z.object({
  originator: z.object({
    name: z.string().min(1, 'Originator name is required'),
    address: z.string().min(10, 'Full address is required'),
    country: z.string().length(2, 'Country code must be 2 characters'),
    dateOfBirth: z.string().optional(),
    placeOfBirth: z.string().optional(),
    nationalId: z.string().optional(),
    customerNumber: z.string().optional(),
  }),
  beneficiary: z.object({
    name: z.string().min(1, 'Beneficiary name is required'),
    address: z.string().min(10, 'Full address is required'),
    country: z.string().length(2, 'Country code must be 2 characters'),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankAddress: z.string().optional(),
  }),
  transaction: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency code must be 3 characters'),
    purpose: z.string().min(1, 'Transaction purpose is required'),
    date: z.string(),
    reference: z.string().optional(),
  }),
  compliance: z.object({
    jurisdiction: z.string().min(1, 'Jurisdiction is required'),
    threshold: z.number().positive('Threshold must be positive'),
    riskLevel: z.enum(['low', 'medium', 'high']),
    sanctions: z.boolean(),
    pep: z.boolean(), // Politically Exposed Person
    sourceOfFunds: z.string().min(1, 'Source of funds is required'),
  })
});

export type TravelRuleData = z.infer<typeof travelRuleSchema>;

// In-memory storage for travel rule data (replace with database in production)
const travelRuleStore = new Map<string, TravelRuleData>();

export class TravelRuleAPI {
  
  // Submit travel rule information
  async submitTravelRule(req: Request, res: Response) {
    try {
      const { walletAddress, data } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          error: 'Wallet address is required',
          code: 'MISSING_WALLET_ADDRESS'
        });
      }

      // Validate travel rule data
      const validatedData = travelRuleSchema.parse(data);
      
      // Check compliance requirements
      const complianceCheck = this.performComplianceCheck(validatedData);
      
      if (!complianceCheck.approved) {
        return res.status(400).json({
          error: 'Compliance check failed',
          code: 'COMPLIANCE_FAILED',
          details: complianceCheck.reasons
        });
      }

      // Store travel rule data
      const reference = this.generateReference();
      travelRuleStore.set(reference, {
        ...validatedData,
        transaction: {
          ...validatedData.transaction,
          reference
        }
      });

      console.log(`Travel rule data submitted for wallet: ${walletAddress}`);
      
      res.json({
        success: true,
        reference,
        status: 'approved',
        message: 'Travel rule information submitted successfully'
      });

    } catch (error) {
      console.error('Travel rule submission error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid travel rule data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get travel rule information
  async getTravelRule(req: Request, res: Response) {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return res.status(400).json({
          error: 'Reference is required',
          code: 'MISSING_REFERENCE'
        });
      }

      const travelRuleData = travelRuleStore.get(reference);
      
      if (!travelRuleData) {
        return res.status(404).json({
          error: 'Travel rule data not found',
          code: 'NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: travelRuleData
      });

    } catch (error) {
      console.error('Travel rule retrieval error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Validate travel rule for a transaction
  async validateTravelRule(req: Request, res: Response) {
    try {
      const { amount, currency, originatorCountry, beneficiaryCountry } = req.body;
      
      const threshold = this.getThresholdForRoute(originatorCountry, beneficiaryCountry, currency);
      const requiresTravelRule = amount >= threshold;
      
      res.json({
        requiresTravelRule,
        threshold,
        currency,
        originatorCountry,
        beneficiaryCountry,
        complianceRequirements: {
          kycRequired: requiresTravelRule,
          documentsRequired: requiresTravelRule ? ['id', 'proof_of_address', 'source_of_funds'] : [],
          riskAssessment: amount >= threshold * 2 ? 'high' : amount >= threshold ? 'medium' : 'low'
        }
      });

    } catch (error) {
      console.error('Travel rule validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Perform compliance checks
  private performComplianceCheck(data: TravelRuleData) {
    const reasons: string[] = [];
    
    // Check sanctions
    if (data.compliance.sanctions) {
      reasons.push('Originator or beneficiary appears on sanctions list');
    }
    
    // Check PEP status
    if (data.compliance.pep && data.compliance.riskLevel === 'high') {
      reasons.push('High-risk PEP transaction requires additional verification');
    }
    
    // Check amount threshold
    const threshold = this.getThresholdForRoute(
      data.originator.country, 
      data.beneficiary.country, 
      data.transaction.currency
    );
    
    if (data.transaction.amount >= threshold * 10) {
      reasons.push('Transaction amount exceeds maximum limit for this route');
    }
    
    // Check restricted countries
    const restrictedCountries = ['KP', 'IR', 'SY']; // North Korea, Iran, Syria
    if (restrictedCountries.includes(data.originator.country) || 
        restrictedCountries.includes(data.beneficiary.country)) {
      reasons.push('Transaction involves restricted jurisdiction');
    }

    return {
      approved: reasons.length === 0,
      reasons
    };
  }

  // Get threshold based on country route and currency
  private getThresholdForRoute(originatorCountry: string, beneficiaryCountry: string, currency: string): number {
    // Standard FATF threshold is $1000 USD equivalent
    const baseThreshold = 1000;
    
    // Adjust for different currencies
    const currencyMultipliers: Record<string, number> = {
      'USD': 1,
      'EUR': 0.85,
      'GBP': 0.73,
      'INR': 83.25,
      'CAD': 1.35,
      'AUD': 1.52
    };
    
    const multiplier = currencyMultipliers[currency] || 1;
    
    // Lower threshold for high-risk country pairs
    const highRiskCountries = ['AF', 'MM', 'KH', 'LA']; // Afghanistan, Myanmar, Cambodia, Laos
    if (highRiskCountries.includes(originatorCountry) || highRiskCountries.includes(beneficiaryCountry)) {
      return (baseThreshold * multiplier) * 0.5; // 50% of standard threshold
    }
    
    return baseThreshold * multiplier;
  }

  // Generate unique reference number
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TR-${timestamp}-${random}`.toUpperCase();
  }
}

export const travelRuleAPI = new TravelRuleAPI();