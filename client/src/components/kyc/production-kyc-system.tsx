import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Shield, FileText, User, Phone, Mail, MapPin, Calendar, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductionKYCSystemProps {
  onKYCComplete: (data: KYCData) => void;
  onBack: () => void;
}

interface KYCData {
  aadhaarNumber: string;
  panNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  email: string;
  bankAccountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  verificationStatus: {
    aadhaar: 'pending' | 'verified' | 'failed';
    pan: 'pending' | 'verified' | 'failed';
  };
}

export function ProductionKYCSystem({ onKYCComplete, onBack }: ProductionKYCSystemProps) {
  const [currentStep, setCurrentStep] = useState<'aadhaar' | 'pan' | 'personal' | 'bank' | 'complete'>('aadhaar');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [kycData, setKycData] = useState<KYCData>({
    aadhaarNumber: '',
    panNumber: '',
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    email: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    verificationStatus: {
      aadhaar: 'pending',
      pan: 'pending'
    }
  });

  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    aadhaarOtp: '',
    panNumber: '',
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    email: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  // Aadhaar OTP Verification using Surepass eAadhaar API
  const handleAadhaarOTPSend = async () => {
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kyc/aadhaar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaar_number: formData.aadhaarNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setError(null);
      } else {
        setError(data.message || 'Failed to send OTP. Please check your Aadhaar number.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Aadhaar OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAadhaarOTPVerify = async () => {
    if (!formData.aadhaarOtp || formData.aadhaarOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kyc/aadhaar-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaar_number: formData.aadhaarNumber,
          otp: formData.aadhaarOtp
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setOtpVerified(true);
        setKycData(prev => ({
          ...prev,
          aadhaarNumber: formData.aadhaarNumber,
          fullName: data.data.name || '',
          dateOfBirth: data.data.dob || '',
          address: data.data.address || '',
          verificationStatus: {
            ...prev.verificationStatus,
            aadhaar: 'verified'
          }
        }));
        setFormData(prev => ({
          ...prev,
          fullName: data.data.name || '',
          dateOfBirth: data.data.dob || '',
          address: data.data.address || ''
        }));
        setCurrentStep('pan');
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Aadhaar verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // PAN Verification using Surepass PAN Advanced API
  const handlePANVerification = async () => {
    if (!formData.panNumber || formData.panNumber.length !== 10) {
      setError('Please enter a valid 10-character PAN number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kyc/pan-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pan_number: formData.panNumber.toUpperCase(),
          name: formData.fullName
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setKycData(prev => ({
          ...prev,
          panNumber: formData.panNumber.toUpperCase(),
          verificationStatus: {
            ...prev.verificationStatus,
            pan: 'verified'
          }
        }));
        setCurrentStep('personal');
      } else {
        setError(data.message || 'PAN verification failed. Please check your details.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('PAN verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalDetailsSubmit = () => {
    if (!formData.phoneNumber || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setKycData(prev => ({
      ...prev,
      phoneNumber: formData.phoneNumber,
      email: formData.email
    }));
    setCurrentStep('bank');
  };

  const handleBankDetailsSubmit = () => {
    if (!formData.bankAccountNumber || !formData.ifscCode || !formData.accountHolderName) {
      setError('Please fill in all bank details');
      return;
    }

    const finalKycData = {
      ...kycData,
      bankAccountNumber: formData.bankAccountNumber,
      ifscCode: formData.ifscCode.toUpperCase(),
      accountHolderName: formData.accountHolderName
    };

    setKycData(finalKycData);
    setCurrentStep('complete');
    onKYCComplete(finalKycData);
  };

  const renderAadhaarStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-[#6667AB]/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-[#6667AB]" />
        </div>
        <CardTitle className="text-[#6667AB]">Aadhaar Verification</CardTitle>
        <CardDescription>
          Verify your identity using Aadhaar OTP authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6667AB]">Aadhaar Number</label>
              <Input
                type="text"
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, aadhaarNumber: e.target.value.replace(/\D/g, '') }))}
                className="text-center tracking-wider"
              />
            </div>
            <Button 
              onClick={handleAadhaarOTPSend}
              disabled={isLoading || formData.aadhaarNumber.length !== 12}
              className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </>
        ) : (
          <>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-[#6667AB]">OTP sent to your registered mobile number</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6667AB]">Enter OTP</label>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={formData.aadhaarOtp}
                onChange={(e) => setFormData(prev => ({ ...prev, aadhaarOtp: e.target.value.replace(/\D/g, '') }))}
                className="text-center tracking-wider"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOtpSent(false)}
                className="flex-1"
              >
                Resend OTP
              </Button>
              <Button 
                onClick={handleAadhaarOTPVerify}
                disabled={isLoading || formData.aadhaarOtp.length !== 6}
                className="flex-1 bg-[#6667AB] hover:bg-[#6667AB]/90"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderPANStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-[#6667AB]/10 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-6 h-6 text-[#6667AB]" />
        </div>
        <CardTitle className="text-[#6667AB]">PAN Verification</CardTitle>
        <CardDescription>
          Verify your PAN card details for tax compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Aadhaar Verified</span>
          </div>
          <p className="text-xs text-green-600">Name: {formData.fullName}</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">PAN Number</label>
          <Input
            type="text"
            placeholder="Enter 10-character PAN number"
            maxLength={10}
            value={formData.panNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
            className="text-center tracking-wider font-mono"
          />
        </div>
        
        <Button 
          onClick={handlePANVerification}
          disabled={isLoading || formData.panNumber.length !== 10}
          className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
        >
          {isLoading ? 'Verifying PAN...' : 'Verify PAN'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPersonalStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-[#6667AB]/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-[#6667AB]" />
        </div>
        <CardTitle className="text-[#6667AB]">Personal Details</CardTitle>
        <CardDescription>
          Complete your contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aadhaar ✓
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            PAN ✓
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">Full Name</label>
          <Input
            value={formData.fullName}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">Phone Number</label>
          <Input
            type="tel"
            placeholder="Enter mobile number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">Email Address</label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <Button 
          onClick={handlePersonalDetailsSubmit}
          className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
        >
          Continue to Bank Details
        </Button>
      </CardContent>
    </Card>
  );

  const renderBankStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-[#6667AB]/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-[#6667AB]" />
        </div>
        <CardTitle className="text-[#6667AB]">Bank Account Details</CardTitle>
        <CardDescription>
          Add your bank account for INR withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">Account Holder Name</label>
          <Input
            placeholder="Enter account holder name"
            value={formData.accountHolderName}
            onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">Bank Account Number</label>
          <Input
            type="text"
            placeholder="Enter bank account number"
            value={formData.bankAccountNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6667AB]">IFSC Code</label>
          <Input
            placeholder="Enter IFSC code"
            value={formData.ifscCode}
            onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
          />
        </div>

        <Button 
          onClick={handleBankDetailsSubmit}
          className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
        >
          Complete KYC Verification
        </Button>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle className="text-green-600">KYC Verification Complete!</CardTitle>
        <CardDescription>
          Your identity has been successfully verified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Aadhaar</span>
            <Badge className="bg-green-100 text-green-700">Verified</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">PAN</span>
            <Badge className="bg-green-100 text-green-700">Verified</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Bank Account</span>
            <Badge className="bg-green-100 text-green-700">Added</Badge>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            You can now proceed with crypto to INR conversions
          </p>
          <Button 
            onClick={() => onKYCComplete(kycData)}
            className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
          >
            Continue to Conversion
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            KYC Verification
          </h1>
          <p className="text-[#FCFBF4]/80">
            Complete your identity verification to start converting crypto to INR
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: 'aadhaar', label: 'Aadhaar', icon: Shield },
              { key: 'pan', label: 'PAN', icon: CreditCard },
              { key: 'personal', label: 'Personal', icon: User },
              { key: 'bank', label: 'Bank', icon: FileText }
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = ['aadhaar', 'pan', 'personal', 'bank'].indexOf(step.key) < ['aadhaar', 'pan', 'personal', 'bank'].indexOf(currentStep);
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-white border-white text-[#6667AB]' :
                    'border-white/50 text-white/50'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-white font-medium' : 'text-white/70'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-px mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-white/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'aadhaar' && renderAadhaarStep()}
          {currentStep === 'pan' && renderPANStep()}
          {currentStep === 'personal' && renderPersonalStep()}
          {currentStep === 'bank' && renderBankStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            ← Back to Conversion
          </Button>
        </div>
      </div>
    </div>
  );
}