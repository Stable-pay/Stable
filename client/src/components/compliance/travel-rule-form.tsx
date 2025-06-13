import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, User, Building, MapPin, FileText, AlertTriangle } from 'lucide-react';

interface TravelRuleData {
  // Originator Information (Sender)
  originatorName: string;
  originatorAddress: string;
  originatorCity: string;
  originatorCountry: string;
  originatorAccountNumber: string;
  originatorIdType: string;
  originatorIdNumber: string;
  
  // Beneficiary Information (Receiver)
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryCity: string;
  beneficiaryCountry: string;
  beneficiaryAccountNumber: string;
  beneficiaryBankName: string;
  beneficiaryBankCode: string;
  
  // Transaction Purpose
  transactionPurpose: string;
  sourceOfFunds: string;
  relationshipToBeneficiary: string;
  
  // Compliance Declarations
  sanctionsCheck: boolean;
  pepCheck: boolean;
  complianceDeclaration: boolean;
}

interface TravelRuleFormProps {
  onSubmit: (data: TravelRuleData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  amount: string;
  currency: string;
}

export function TravelRuleForm({ onSubmit, onBack, isSubmitting = false, amount, currency }: TravelRuleFormProps) {
  const [formData, setFormData] = useState<TravelRuleData>({
    originatorName: '',
    originatorAddress: '',
    originatorCity: '',
    originatorCountry: '',
    originatorAccountNumber: '',
    originatorIdType: '',
    originatorIdNumber: '',
    beneficiaryName: '',
    beneficiaryAddress: '',
    beneficiaryCity: '',
    beneficiaryCountry: 'India',
    beneficiaryAccountNumber: '',
    beneficiaryBankName: '',
    beneficiaryBankCode: '',
    transactionPurpose: '',
    sourceOfFunds: '',
    relationshipToBeneficiary: '',
    sanctionsCheck: false,
    pepCheck: false,
    complianceDeclaration: false
  });

  const [currentStep, setCurrentStep] = useState(1);

  const updateField = (field: keyof TravelRuleData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onSubmit(formData);
  };

  const isFormValid = () => {
    return formData.originatorName && 
           formData.beneficiaryName && 
           formData.beneficiaryAccountNumber &&
           formData.transactionPurpose &&
           formData.sanctionsCheck &&
           formData.pepCheck &&
           formData.complianceDeclaration;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-border">
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Shield className="w-7 h-7" />
              Travel Rule Compliance
            </CardTitle>
            <p className="text-primary-foreground/90">
              Required information for international transfers of {amount} {currency}
            </p>
          </CardHeader>
        </Card>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-secondary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Originator Information */}
        {currentStep === 1 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-secondary" />
                Sender Information (Originator)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="originatorName" className="text-foreground font-medium">Full Legal Name *</Label>
                  <Input
                    id="originatorName"
                    value={formData.originatorName}
                    onChange={(e) => updateField('originatorName', e.target.value)}
                    placeholder="Enter your full legal name"
                    className="mt-1 bg-background border-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="originatorCountry" className="text-foreground font-medium">Country *</Label>
                  <Select value={formData.originatorCountry} onValueChange={(value) => updateField('originatorCountry', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="AE">UAE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="originatorAddress" className="text-foreground font-medium">Residential Address *</Label>
                  <Textarea
                    id="originatorAddress"
                    value={formData.originatorAddress}
                    onChange={(e) => updateField('originatorAddress', e.target.value)}
                    placeholder="Enter your complete residential address"
                    className="mt-1 bg-background border-border"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="originatorCity" className="text-foreground font-medium">City *</Label>
                  <Input
                    id="originatorCity"
                    value={formData.originatorCity}
                    onChange={(e) => updateField('originatorCity', e.target.value)}
                    placeholder="Enter your city"
                    className="mt-1 bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="originatorIdType" className="text-foreground font-medium">ID Document Type *</Label>
                  <Select value={formData.originatorIdType} onValueChange={(value) => updateField('originatorIdType', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="other">Other Government ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="originatorIdNumber" className="text-foreground font-medium">ID Document Number *</Label>
                  <Input
                    id="originatorIdNumber"
                    value={formData.originatorIdNumber}
                    onChange={(e) => updateField('originatorIdNumber', e.target.value)}
                    placeholder="Enter your ID document number"
                    className="mt-1 bg-background border-border"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.originatorName || !formData.originatorAddress}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8"
                >
                  Continue to Beneficiary Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Beneficiary Information */}
        {currentStep === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building className="w-5 h-5 text-secondary" />
                Recipient Information (Beneficiary)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="beneficiaryName" className="text-foreground font-medium">Recipient Full Name *</Label>
                  <Input
                    id="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={(e) => updateField('beneficiaryName', e.target.value)}
                    placeholder="Enter recipient's full name"
                    className="mt-1 bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryCountry" className="text-foreground font-medium">Recipient Country *</Label>
                  <Select value={formData.beneficiaryCountry} onValueChange={(value) => updateField('beneficiaryCountry', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="beneficiaryAddress" className="text-foreground font-medium">Recipient Address *</Label>
                  <Textarea
                    id="beneficiaryAddress"
                    value={formData.beneficiaryAddress}
                    onChange={(e) => updateField('beneficiaryAddress', e.target.value)}
                    placeholder="Enter recipient's complete address in India"
                    className="mt-1 bg-background border-border"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryBankName" className="text-foreground font-medium">Bank Name *</Label>
                  <Input
                    id="beneficiaryBankName"
                    value={formData.beneficiaryBankName}
                    onChange={(e) => updateField('beneficiaryBankName', e.target.value)}
                    placeholder="e.g., State Bank of India"
                    className="mt-1 bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryAccountNumber" className="text-foreground font-medium">Account Number *</Label>
                  <Input
                    id="beneficiaryAccountNumber"
                    value={formData.beneficiaryAccountNumber}
                    onChange={(e) => updateField('beneficiaryAccountNumber', e.target.value)}
                    placeholder="Enter bank account number"
                    className="mt-1 bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryBankCode" className="text-foreground font-medium">IFSC Code *</Label>
                  <Input
                    id="beneficiaryBankCode"
                    value={formData.beneficiaryBankCode}
                    onChange={(e) => updateField('beneficiaryBankCode', e.target.value)}
                    placeholder="e.g., SBIN0001234"
                    className="mt-1 bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="relationshipToBeneficiary" className="text-foreground font-medium">Relationship to Recipient *</Label>
                  <Select value={formData.relationshipToBeneficiary} onValueChange={(value) => updateField('relationshipToBeneficiary', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="business">Business Partner</SelectItem>
                      <SelectItem value="self">Myself</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                >
                  Back to Sender Details
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!formData.beneficiaryName || !formData.beneficiaryAccountNumber || !formData.beneficiaryBankName}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8"
                >
                  Continue to Transaction Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Transaction Purpose & Compliance */}
        {currentStep === 3 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="w-5 h-5 text-secondary" />
                Transaction Details & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="transactionPurpose" className="text-foreground font-medium">Purpose of Transfer *</Label>
                  <Select value={formData.transactionPurpose} onValueChange={(value) => updateField('transactionPurpose', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family_support">Family Support</SelectItem>
                      <SelectItem value="education">Education Expenses</SelectItem>
                      <SelectItem value="medical">Medical Expenses</SelectItem>
                      <SelectItem value="business">Business Payment</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sourceOfFunds" className="text-foreground font-medium">Source of Funds *</Label>
                  <Select value={formData.sourceOfFunds} onValueChange={(value) => updateField('sourceOfFunds', value)}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary/Employment</SelectItem>
                      <SelectItem value="business_income">Business Income</SelectItem>
                      <SelectItem value="savings">Personal Savings</SelectItem>
                      <SelectItem value="investment_returns">Investment Returns</SelectItem>
                      <SelectItem value="gift_received">Gift Received</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Compliance Declarations */}
              <div className="mt-8 p-6 bg-muted rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Required Compliance Declarations
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="sanctionsCheck"
                      checked={formData.sanctionsCheck}
                      onCheckedChange={(checked) => updateField('sanctionsCheck', !!checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="sanctionsCheck" className="text-sm text-foreground leading-relaxed">
                      I confirm that neither I nor the beneficiary appear on any sanctions lists maintained by OFAC, EU, UN, or other regulatory authorities.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="pepCheck"
                      checked={formData.pepCheck}
                      onCheckedChange={(checked) => updateField('pepCheck', !!checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="pepCheck" className="text-sm text-foreground leading-relaxed">
                      I confirm that neither I nor the beneficiary are Politically Exposed Persons (PEPs) unless previously disclosed and approved.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="complianceDeclaration"
                      checked={formData.complianceDeclaration}
                      onCheckedChange={(checked) => updateField('complianceDeclaration', !!checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="complianceDeclaration" className="text-sm text-foreground leading-relaxed">
                      I declare that all information provided is true and accurate. I understand that providing false information may result in transaction rejection and potential legal consequences.
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                >
                  Back to Recipient Details
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8"
                >
                  {isSubmitting ? 'Processing...' : 'Complete Compliance Check'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Previous Step */}
        <div className="text-center mt-6">
          <Button 
            onClick={onBack}
            variant="link"
            className="text-muted-foreground hover:text-foreground"
          >
            Return to Previous Step
          </Button>
        </div>
      </div>
    </div>
  );
}