import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LottieWrapper } from '@/components/animations/lottie-wrapper';
import { successCheckAnimation, loadingSpinnerAnimation } from '@/components/animations/lottie-animations';
import { 
  Upload, 
  FileText, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onKYCComplete: (status: 'verified' | 'pending') => void;
}

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'voter_id', label: 'Voter ID Card' },
  { value: 'aadhaar', label: 'Aadhaar Card' }
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

export function KYCVerificationModal({ isOpen, onClose, walletAddress, onKYCComplete }: KYCVerificationModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Indian',
    
    // Contact Information
    email: '',
    phone: '',
    
    // Address Information
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    
    // Document Information
    documentType: '',
    documentNumber: '',
    
    // Bank Information for INR withdrawals
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    
    // Files
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
    bankStatement: null as File | null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && 
                 formData.email && formData.phone);
      case 2:
        return !!(formData.addressLine1 && formData.city && formData.state && formData.pincode);
      case 3:
        return !!(formData.documentType && formData.documentNumber && 
                 formData.documentFront && formData.selfie);
      case 4:
        return !!(formData.bankName && formData.accountNumber && formData.ifscCode && 
                 formData.accountHolderName && formData.bankStatement);
      default:
        return false;
    }
  };

  const submitKYC = async () => {
    setIsSubmitting(true);
    
    try {
      const formDataToSubmit = new FormData();
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          formDataToSubmit.append(key, value);
        }
      });
      
      // Add wallet address
      formDataToSubmit.append('walletAddress', walletAddress);
      
      // Add files
      if (formData.documentFront) formDataToSubmit.append('documentFront', formData.documentFront);
      if (formData.documentBack) formDataToSubmit.append('documentBack', formData.documentBack);
      if (formData.selfie) formDataToSubmit.append('selfie', formData.selfie);
      if (formData.bankStatement) formDataToSubmit.append('bankStatement', formData.bankStatement);
      
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formDataToSubmit
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "KYC Submitted Successfully",
          description: "Your KYC documents are under review. You'll be notified within 24-48 hours.",
        });
        
        onKYCComplete('pending');
        setStep(5); // Success step
        
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error('KYC submission failed');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Address Information</h3>
            </div>
            
            <div>
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                placeholder="House/Flat number, Building name"
              />
            </div>
            
            <div>
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                placeholder="Street, Area, Landmark"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pincode">PIN Code *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="XXXXXX"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Document Verification</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(doc => (
                      <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Document Number *</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  placeholder="Enter document number"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Document Front Side *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('documentFront', e.target.files?.[0] || null)}
                    className="hidden"
                    id="documentFront"
                  />
                  <label htmlFor="documentFront" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.documentFront ? formData.documentFront.name : 'Click to upload document front'}
                    </p>
                  </label>
                </div>
              </div>
              
              {formData.documentType !== 'passport' && (
                <div>
                  <Label>Document Back Side</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('documentBack', e.target.files?.[0] || null)}
                      className="hidden"
                      id="documentBack"
                    />
                    <label htmlFor="documentBack" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {formData.documentBack ? formData.documentBack.name : 'Click to upload document back'}
                      </p>
                    </label>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Selfie with Document *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('selfie', e.target.files?.[0] || null)}
                    className="hidden"
                    id="selfie"
                  />
                  <label htmlFor="selfie" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.selfie ? formData.selfie.name : 'Click to upload selfie with document'}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Bank Details for INR Withdrawal</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  placeholder="As per bank records"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="XXXX0000000"
                />
              </div>
            </div>
            
            <div>
              <Label>Bank Statement (Last 3 months) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('bankStatement', e.target.files?.[0] || null)}
                  className="hidden"
                  id="bankStatement"
                />
                <label htmlFor="bankStatement" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData.bankStatement ? formData.bankStatement.name : 'Click to upload bank statement (PDF only)'}
                  </p>
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-4">
            <div className="h-24 w-24 mx-auto">
              <LottieWrapper
                animationData={successCheckAnimation}
                loop={false}
                className="h-24 w-24"
              />
            </div>
            <h3 className="text-xl font-semibold text-green-600">KYC Submitted Successfully!</h3>
            <p className="text-gray-600">
              Your KYC documents are under review. You'll receive an email notification 
              within 24-48 hours once the verification is complete.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You'll be able to send transfers and withdraw funds 
                to your registered bank account once KYC is verified.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Complete KYC Verification
          </DialogTitle>
        </DialogHeader>
        
        {step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of 4</span>
              <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
        
        {step < 5 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>
            
            <Button
              onClick={() => {
                if (step === 4) {
                  submitKYC();
                } else if (validateStep(step)) {
                  setStep(step + 1);
                }
              }}
              disabled={!validateStep(step) || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4">
                    <LottieWrapper
                      animationData={loadingSpinnerAnimation}
                      className="h-4 w-4"
                    />
                  </div>
                  Submitting...
                </div>
              ) : step === 4 ? (
                'Submit KYC'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}