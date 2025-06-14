import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, FileText, Shield, Globe } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TravelRuleData {
  originator: {
    name: string;
    address: string;
    country: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    nationalId?: string;
    customerNumber?: string;
  };
  beneficiary: {
    name: string;
    address: string;
    country: string;
    accountNumber?: string;
    bankName?: string;
    bankAddress?: string;
  };
  transaction: {
    amount: number;
    currency: string;
    purpose: string;
    date: string;
    reference?: string;
  };
  compliance: {
    jurisdiction: string;
    threshold: number;
    riskLevel: 'low' | 'medium' | 'high';
    sanctions: boolean;
    pep: boolean;
    sourceOfFunds: string;
  };
}

interface TravelRuleComplianceProps {
  walletAddress: string;
  transactionAmount: number;
  currency: string;
  onComplianceComplete: (reference: string) => void;
  isVisible: boolean;
}

export function TravelRuleCompliance({
  walletAddress,
  transactionAmount,
  currency,
  onComplianceComplete,
  isVisible
}: TravelRuleComplianceProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<TravelRuleData>({
    originator: {
      name: '',
      address: '',
      country: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationalId: '',
      customerNumber: ''
    },
    beneficiary: {
      name: '',
      address: '',
      country: 'IN', // Default to India for remittance
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    },
    transaction: {
      amount: transactionAmount,
      currency: currency,
      purpose: '',
      date: new Date().toISOString().split('T')[0]
    },
    compliance: {
      jurisdiction: 'US',
      threshold: 1000,
      riskLevel: 'low',
      sanctions: false,
      pep: false,
      sourceOfFunds: ''
    }
  });

  const [currentStep, setCurrentStep] = useState<'validation' | 'originator' | 'beneficiary' | 'compliance' | 'review'>('validation');

  // Validate if travel rule is required
  const { data: validationData, isLoading: isValidating } = useQuery({
    queryKey: ['travel-rule-validation', transactionAmount, currency, 'US', 'IN'],
    queryFn: async () => {
      const response = await fetch('/api/travel-rule/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transactionAmount,
          currency: currency,
          originatorCountry: 'US',
          beneficiaryCountry: 'IN'
        })
      });
      return response.json();
    },
    enabled: isVisible && transactionAmount > 0
  });

  // Submit travel rule data
  const submitTravelRule = useMutation({
    mutationFn: async (data: TravelRuleData) => {
      const response = await fetch('/api/travel-rule/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          data
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Travel rule submission failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onComplianceComplete(data.reference);
    }
  });

  const updateFormData = (section: keyof TravelRuleData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'EU', name: 'European Union' }
  ];

  const transactionPurposes = [
    'Family support',
    'Education expenses',
    'Medical expenses',
    'Business operations',
    'Investment',
    'Property purchase',
    'Personal expenses',
    'Other'
  ];

  const sourceOfFundsOptions = [
    'Employment income',
    'Business profits',
    'Investment returns',
    'Savings',
    'Gift',
    'Inheritance',
    'Property sale',
    'Other'
  ];

  if (!isVisible) return null;

  if (isValidating) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Validating compliance requirements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validationData?.requiresTravelRule) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">No Additional Compliance Required</h3>
              <p className="text-sm">Transaction amount is below the travel rule threshold.</p>
            </div>
          </div>
          <Button 
            onClick={() => onComplianceComplete('no-compliance-required')}
            className="mt-4 w-full"
          >
            Continue Transaction
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderValidationStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-primary" />
          <span>Travel Rule Compliance Required</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your transaction of {transactionAmount} {currency} exceeds the regulatory threshold of {validationData.threshold} {currency}. 
            Travel Rule compliance information is required to proceed.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Amount</Label>
            <Badge variant="outline">{transactionAmount} {currency}</Badge>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Risk Level</Label>
            <Badge variant={validationData.complianceRequirements.riskAssessment === 'high' ? 'destructive' : 
                           validationData.complianceRequirements.riskAssessment === 'medium' ? 'default' : 'secondary'}>
              {validationData.complianceRequirements.riskAssessment.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Required Information</Label>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Originator (sender) details</li>
            <li>• Beneficiary (recipient) details</li>
            <li>• Transaction purpose and source of funds</li>
            <li>• Compliance declarations</li>
          </ul>
        </div>

        <Button 
          onClick={() => setCurrentStep('originator')}
          className="w-full"
        >
          Begin Compliance Process
        </Button>
      </CardContent>
    </Card>
  );

  const renderOriginatorStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-primary" />
          <span>Originator Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="originator-name">Full Name *</Label>
            <Input
              id="originator-name"
              value={formData.originator.name}
              onChange={(e) => updateFormData('originator', 'name', e.target.value)}
              placeholder="Enter your full legal name"
            />
          </div>
          <div>
            <Label htmlFor="originator-country">Country *</Label>
            <Select 
              value={formData.originator.country} 
              onValueChange={(value) => updateFormData('originator', 'country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="originator-address">Full Address *</Label>
          <Textarea
            id="originator-address"
            value={formData.originator.address}
            onChange={(e) => updateFormData('originator', 'address', e.target.value)}
            placeholder="Enter your complete residential address"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="originator-dob">Date of Birth</Label>
            <Input
              id="originator-dob"
              type="date"
              value={formData.originator.dateOfBirth}
              onChange={(e) => updateFormData('originator', 'dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="originator-national-id">National ID</Label>
            <Input
              id="originator-national-id"
              value={formData.originator.nationalId}
              onChange={(e) => updateFormData('originator', 'nationalId', e.target.value)}
              placeholder="SSN, Passport, etc."
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('validation')}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep('beneficiary')}
            disabled={!formData.originator.name || !formData.originator.address || !formData.originator.country}
            className="flex-1"
          >
            Next: Beneficiary
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderBeneficiaryStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-6 h-6 text-primary" />
          <span>Beneficiary Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="beneficiary-name">Recipient Name *</Label>
            <Input
              id="beneficiary-name"
              value={formData.beneficiary.name}
              onChange={(e) => updateFormData('beneficiary', 'name', e.target.value)}
              placeholder="Recipient's full legal name"
            />
          </div>
          <div>
            <Label htmlFor="beneficiary-country">Country *</Label>
            <Select 
              value={formData.beneficiary.country} 
              onValueChange={(value) => updateFormData('beneficiary', 'country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="beneficiary-address">Recipient Address *</Label>
          <Textarea
            id="beneficiary-address"
            value={formData.beneficiary.address}
            onChange={(e) => updateFormData('beneficiary', 'address', e.target.value)}
            placeholder="Recipient's complete address"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="beneficiary-bank">Bank Name</Label>
            <Input
              id="beneficiary-bank"
              value={formData.beneficiary.bankName}
              onChange={(e) => updateFormData('beneficiary', 'bankName', e.target.value)}
              placeholder="Recipient's bank name"
            />
          </div>
          <div>
            <Label htmlFor="beneficiary-account">Account Number</Label>
            <Input
              id="beneficiary-account"
              value={formData.beneficiary.accountNumber}
              onChange={(e) => updateFormData('beneficiary', 'accountNumber', e.target.value)}
              placeholder="Bank account number"
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('originator')}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep('compliance')}
            disabled={!formData.beneficiary.name || !formData.beneficiary.address || !formData.beneficiary.country}
            className="flex-1"
          >
            Next: Compliance
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderComplianceStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-primary" />
          <span>Compliance Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transaction-purpose">Transaction Purpose *</Label>
            <Select 
              value={formData.transaction.purpose} 
              onValueChange={(value) => updateFormData('transaction', 'purpose', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {transactionPurposes.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="source-of-funds">Source of Funds *</Label>
            <Select 
              value={formData.compliance.sourceOfFunds} 
              onValueChange={(value) => updateFormData('compliance', 'sourceOfFunds', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOfFundsOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Compliance Declarations</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sanctions-check"
                checked={!formData.compliance.sanctions}
                onChange={(e) => updateFormData('compliance', 'sanctions', !e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sanctions-check" className="text-sm">
                I confirm that neither the originator nor beneficiary appears on any sanctions list
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pep-check"
                checked={!formData.compliance.pep}
                onChange={(e) => updateFormData('compliance', 'pep', !e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pep-check" className="text-sm">
                I confirm that neither party is a Politically Exposed Person (PEP)
              </Label>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('beneficiary')}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep('review')}
            disabled={!formData.transaction.purpose || !formData.compliance.sourceOfFunds}
            className="flex-1"
          >
            Review & Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Review Travel Rule Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">ORIGINATOR</h4>
            <div className="bg-muted p-3 rounded space-y-1 text-sm">
              <p><strong>Name:</strong> {formData.originator.name}</p>
              <p><strong>Country:</strong> {countries.find(c => c.code === formData.originator.country)?.name}</p>
              <p><strong>Address:</strong> {formData.originator.address}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">BENEFICIARY</h4>
            <div className="bg-muted p-3 rounded space-y-1 text-sm">
              <p><strong>Name:</strong> {formData.beneficiary.name}</p>
              <p><strong>Country:</strong> {countries.find(c => c.code === formData.beneficiary.country)?.name}</p>
              <p><strong>Address:</strong> {formData.beneficiary.address}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">TRANSACTION</h4>
            <div className="bg-muted p-3 rounded space-y-1 text-sm">
              <p><strong>Amount:</strong> {formData.transaction.amount} {formData.transaction.currency}</p>
              <p><strong>Purpose:</strong> {formData.transaction.purpose}</p>
              <p><strong>Source of Funds:</strong> {formData.compliance.sourceOfFunds}</p>
            </div>
          </div>
        </div>

        {submitTravelRule.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {submitTravelRule.error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('compliance')}
            disabled={submitTravelRule.isPending}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={() => submitTravelRule.mutate(formData)}
            disabled={submitTravelRule.isPending}
            className="flex-1"
          >
            {submitTravelRule.isPending ? 'Submitting...' : 'Submit Compliance Information'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const steps = {
    validation: renderValidationStep,
    originator: renderOriginatorStep,
    beneficiary: renderBeneficiaryStep,
    compliance: renderComplianceStep,
    review: renderReviewStep
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {steps[currentStep]()}
    </div>
  );
}