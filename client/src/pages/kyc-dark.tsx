import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Shield, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Wallet,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

interface KYCFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  documents: {
    idType: string;
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  };
  verification: {
    phoneNumber: string;
    email: string;
    verified: boolean;
  };
}

type KYCStep = 'connect' | 'personal' | 'documents' | 'verification' | 'review' | 'completed';

export default function KYCDark() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<KYCStep>('connect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState<KYCFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    documents: {
      idType: '',
      idFront: null,
      idBack: null,
      selfie: null
    },
    verification: {
      phoneNumber: '',
      email: '',
      verified: false
    }
  });

  const steps = [
    { id: 'connect', title: 'Connect Wallet', icon: Wallet },
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'documents', title: 'Documents', icon: FileText },
    { id: 'verification', title: 'Verification', icon: Shield },
    { id: 'review', title: 'Review', icon: CheckCircle }
  ];

  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setCurrentStep('personal');
      setProgress(20);
    }
  }, [isConnected, currentStep]);

  const handleFileUpload = (field: keyof typeof formData.documents, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file }
    }));
  };

  const submitKYC = async () => {
    if (!address) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit KYC data
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          ...formData
        })
      });

      if (response.ok) {
        setCurrentStep('completed');
        setProgress(100);
        toast({
          title: "KYC Submitted",
          description: "Your verification is being processed",
        });
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit KYC verification",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const stepOrder: KYCStep[] = ['connect', 'personal', 'documents', 'verification', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      setProgress((currentIndex + 2) * 20);
    }
  };

  const prevStep = () => {
    const stepOrder: KYCStep[] = ['connect', 'personal', 'documents', 'verification', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      setProgress(currentIndex * 20);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            KYC Verification
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete your identity verification to unlock full platform features
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`mt-2 text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'connect' && (
              <Card className="max-w-md mx-auto bg-card border-border">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl text-foreground">
                    <Wallet className="h-8 w-8" />
                    Connect Your Wallet
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Connect your wallet to start the KYC verification process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isConnected ? (
                    <Button 
                      onClick={() => open()}
                      className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <div>
                          <p className="font-medium text-foreground">Wallet Connected</p>
                          <p className="text-sm text-muted-foreground">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={nextStep}
                        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 'personal' && (
              <Card className="max-w-4xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <User className="h-6 w-6" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Please provide your personal details for verification
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.personalInfo.firstName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                        }))}
                        className="h-12 bg-input border-border text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.personalInfo.lastName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                        }))}
                        className="h-12 bg-input border-border text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-foreground">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                        }))}
                        className="h-12 bg-input border-border text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nationality" className="text-foreground">Nationality</Label>
                      <Select 
                        value={formData.personalInfo.nationality}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, nationality: value }
                        }))}
                      >
                        <SelectTrigger className="h-12 bg-input border-border text-foreground">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-foreground">Address *</Label>
                    <Input
                      id="address"
                      value={formData.personalInfo.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, address: e.target.value }
                      }))}
                      className="h-12 bg-input border-border text-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">City *</Label>
                      <Input
                        id="city"
                        value={formData.personalInfo.city}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, city: e.target.value }
                        }))}
                        className="h-12 bg-input border-border text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-foreground">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.personalInfo.postalCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, postalCode: e.target.value }
                        }))}
                        className="h-12 bg-input border-border text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-foreground">Country *</Label>
                      <Select 
                        value={formData.personalInfo.country}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, country: value }
                        }))}
                      >
                        <SelectTrigger className="h-12 bg-input border-border text-foreground">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={nextStep}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!formData.personalInfo.firstName || !formData.personalInfo.lastName}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'documents' && (
              <Card className="max-w-4xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <FileText className="h-6 w-6" />
                    Document Upload
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Upload your identity documents for verification
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-foreground">Document Type *</Label>
                    <Select 
                      value={formData.documents.idType}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        documents: { ...prev.documents, idType: value }
                      }))}
                    >
                      <SelectTrigger className="h-12 bg-input border-border text-foreground">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driver_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-foreground">Document Front *</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-input">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Click to upload front of document</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload('idFront', e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-foreground">Document Back *</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-input">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Click to upload back of document</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload('idBack', e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">Selfie with Document *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-input">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Upload a selfie holding your document</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => handleFileUpload('selfie', e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={nextStep}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'verification' && (
              <Card className="max-w-2xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <Shield className="h-6 w-6" />
                    Contact Verification
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Verify your contact information
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.verification.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, email: e.target.value }
                      }))}
                      className="h-12 bg-input border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.verification.phoneNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, phoneNumber: e.target.value }
                      }))}
                      className="h-12 bg-input border-border text-foreground"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={nextStep}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Review <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'review' && (
              <Card className="max-w-4xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <CheckCircle className="h-6 w-6" />
                    Review & Submit
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Please review your information before submitting
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
                        <p><span className="text-muted-foreground">Date of Birth:</span> {formData.personalInfo.dateOfBirth}</p>
                        <p><span className="text-muted-foreground">Nationality:</span> {formData.personalInfo.nationality}</p>
                        <p><span className="text-muted-foreground">Address:</span> {formData.personalInfo.address}</p>
                        <p><span className="text-muted-foreground">City:</span> {formData.personalInfo.city}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Email:</span> {formData.verification.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {formData.verification.phoneNumber}</p>
                        <p><span className="text-muted-foreground">Document Type:</span> {formData.documents.idType}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={submitKYC}
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit KYC'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'completed' && (
              <Card className="max-w-md mx-auto bg-card border-border">
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-20 w-20 mx-auto mb-6 text-green-500" />
                  <h2 className="text-2xl font-bold mb-4 text-foreground">KYC Submitted Successfully!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your verification is being processed. You'll receive an email update within 24-48 hours.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}