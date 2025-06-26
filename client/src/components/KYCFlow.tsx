import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, FileText, Camera, User, CheckCircle } from 'lucide-react';

interface KYCFlowProps {
  onComplete: () => void;
}

export function KYCFlow({ onComplete }: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    phoneNumber: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      icon: User,
      description: 'Enter your basic details'
    },
    {
      id: 2,
      title: 'Document Upload',
      icon: FileText,
      description: 'Upload Aadhaar and PAN documents'
    },
    {
      id: 3,
      title: 'Selfie Verification',
      icon: Camera,
      description: 'Take a selfie for identity verification'
    },
    {
      id: 4,
      title: 'Verification Complete',
      icon: CheckCircle,
      description: 'Your KYC is being processed'
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#6667AB]">Full Name</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="border-[#6667AB]/30"
                />
              </div>
              <div>
                <Label className="text-[#6667AB]">Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="border-[#6667AB]/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#6667AB]">Aadhaar Number</Label>
                <Input
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                  placeholder="Enter 12-digit Aadhaar number"
                  className="border-[#6667AB]/30"
                />
              </div>
              <div>
                <Label className="text-[#6667AB]">PAN Number</Label>
                <Input
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange('panNumber', e.target.value)}
                  placeholder="Enter PAN number"
                  className="border-[#6667AB]/30"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#6667AB]">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your full address"
                className="border-[#6667AB]/30"
              />
            </div>
            <div>
              <Label className="text-[#6667AB]">Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="Enter your phone number"
                className="border-[#6667AB]/30"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-[#6667AB]/50" />
              <h3 className="text-lg font-semibold text-[#6667AB] mb-2">Upload Documents</h3>
              <p className="text-[#6667AB]/70">Please upload clear photos of your documents</p>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#6667AB]/30 rounded-lg p-6 text-center">
                <p className="text-[#6667AB]/70 mb-2">Aadhaar Card (Front & Back)</p>
                <Button variant="outline" className="border-[#6667AB]/30 text-[#6667AB]">
                  Choose Files
                </Button>
              </div>
              <div className="border-2 border-dashed border-[#6667AB]/30 rounded-lg p-6 text-center">
                <p className="text-[#6667AB]/70 mb-2">PAN Card</p>
                <Button variant="outline" className="border-[#6667AB]/30 text-[#6667AB]">
                  Choose File
                </Button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-[#6667AB]/50" />
            <h3 className="text-lg font-semibold text-[#6667AB] mb-2">Selfie Verification</h3>
            <p className="text-[#6667AB]/70 mb-6">Take a clear selfie for identity verification</p>
            <div className="bg-[#6667AB]/10 rounded-lg p-6">
              <div className="w-48 h-48 mx-auto bg-[#6667AB]/20 rounded-lg flex items-center justify-center">
                <Camera className="w-12 h-12 text-[#6667AB]/50" />
              </div>
              <Button className="mt-4 bg-[#6667AB] text-[#FCFBF4]">
                Take Photo
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-[#6667AB] mb-2">KYC Submitted Successfully</h3>
            <p className="text-[#6667AB]/70 mb-6">
              Your documents have been submitted for verification. This process typically takes 24-48 hours.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">
                You'll receive an email confirmation once your KYC is approved.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#FCFBF4] border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl text-[#6667AB]">KYC Verification</CardTitle>
        <p className="text-[#6667AB]/70 mt-2">
          Complete your identity verification to proceed
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id
                    ? 'bg-[#6667AB] text-[#FCFBF4]'
                    : 'bg-[#6667AB]/20 text-[#6667AB]/50'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#6667AB]/70 mt-1 text-center max-w-16">
                {step.title}
              </p>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 ${
                    currentStep > step.id ? 'bg-[#6667AB]' : 'bg-[#6667AB]/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            disabled={currentStep === 1}
            variant="outline"
            className="border-[#6667AB]/30 text-[#6667AB]"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
          >
            {currentStep === 4 ? 'Continue to Bank Details' : 'Next Step'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default KYCFlow;