import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Web3PulseLoader, Web3SpinLoader } from '@/components/animations/web3-loader';
import { ModernWalletModal } from '@/components/web3/modern-wallet-modal';

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

export default function AnimatedKYC() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<KYCStep>('connect');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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

  const getStepIndex = (step: KYCStep) => {
    return steps.findIndex(s => s.id === step);
  };

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setShowWalletModal(false);
    setCurrentStep('personal');
    
    toast({
      title: "Wallet Connected!",
      description: "You can now proceed with KYC verification",
    });
  };

  const handlePersonalInfoSubmit = () => {
    const { personalInfo } = formData;
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('documents');
  };

  const handleDocumentUpload = (type: 'idFront' | 'idBack' | 'selfie', file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [type]: file
      }
    }));
    
    toast({
      title: "Document Uploaded",
      description: `${type} uploaded successfully`,
    });
  };

  const handleVerificationSubmit = async () => {
    setIsSubmitting(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setFormData(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          verified: true
        }
      }));
      
      setProgress(100);
      setCurrentStep('review');
      
      toast({
        title: "Verification Complete!",
        description: "Your identity has been verified successfully",
      });
      
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep('completed');
      
      toast({
        title: "KYC Completed!",
        description: "Your account has been verified and is ready for trading",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setCurrentStep('personal');
    }
  }, [isConnected]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const stepVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl font-bold mb-4" 
            style={{ color: '#6667AB' }}
          >
            KYC Verification
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-gray-600"
          >
            Complete your identity verification to access all platform features
          </motion.p>
          
          {/* Progress Steps */}
          <motion.div 
            variants={itemVariants}
            className="mt-8"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              {steps.map((step, index) => {
                const isActive = getStepIndex(currentStep) >= index;
                const isCurrent = steps[getStepIndex(currentStep)]?.id === step.id;
                
                return (
                  <motion.div
                    key={step.id}
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive 
                          ? 'bg-[#6667AB] border-[#6667AB] text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        boxShadow: isCurrent ? '0 0 20px rgba(102, 103, 171, 0.3)' : '0 0 0px rgba(0,0,0,0)'
                      }}
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.div>
                    {index < steps.length - 1 && (
                      <motion.div
                        className={`w-8 h-0.5 mx-2 transition-colors ${
                          getStepIndex(currentStep) > index ? 'bg-[#6667AB]' : 'bg-gray-300'
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: getStepIndex(currentStep) > index ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Badge className="bg-[#6667AB] text-white">
                Step {getStepIndex(currentStep) + 1} of {steps.length}
              </Badge>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Connect Wallet Step */}
          {currentStep === 'connect' && (
            <motion.div
              key="connect"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex justify-center"
            >
              <Card className="w-full max-w-lg shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader className="text-center pb-8 pt-12">
                  <motion.div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: '#6667AB' }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Wallet className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <CardTitle className="text-3xl font-bold mb-3" style={{ color: '#6667AB' }}>
                    Connect Your Wallet
                  </CardTitle>
                  <p className="text-gray-600 text-lg">
                    Connect your wallet to begin the KYC verification process
                  </p>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <Button
                    onClick={() => setShowWalletModal(true)}
                    className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg"
                    size="lg"
                  >
                    <Wallet className="h-5 w-5 mr-3" />
                    Connect Wallet
                  </Button>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Private</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Fast</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Personal Information Step */}
          {currentStep === 'personal' && (
            <motion.div
              key="personal"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <User className="h-6 w-6" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Please provide your personal details for verification
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.personalInfo.firstName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                        }))}
                        className="h-12 border-gray-200 focus:border-[#6667AB]"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.personalInfo.lastName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                        }))}
                        className="h-12 border-gray-200 focus:border-[#6667AB]"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                        }))}
                        className="h-12 border-gray-200 focus:border-[#6667AB]"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="nationality">Nationality</Label>
                      <Select 
                        value={formData.personalInfo.nationality}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, nationality: value }
                        }))}
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-[#6667AB]">
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
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.personalInfo.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, address: e.target.value }
                      }))}
                      className="h-12 border-gray-200 focus:border-[#6667AB]"
                      placeholder="Street address"
                    />
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.personalInfo.city}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, city: e.target.value }
                        }))}
                        className="h-12 border-gray-200 focus:border-[#6667AB]"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.personalInfo.postalCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, postalCode: e.target.value }
                        }))}
                        className="h-12 border-gray-200 focus:border-[#6667AB]"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Label htmlFor="country">Country</Label>
                      <Select 
                        value={formData.personalInfo.country}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, country: value }
                        }))}
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-[#6667AB]">
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
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="flex justify-end pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Button 
                      onClick={handlePersonalInfoSubmit}
                      className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Documents Step */}
          {currentStep === 'documents' && (
            <motion.div
              key="documents"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <FileText className="h-6 w-6" />
                    Document Upload
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Upload clear photos of your identification documents
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* ID Type Selection */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label>Document Type *</Label>
                    <Select 
                      value={formData.documents.idType}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        documents: { ...prev.documents, idType: value }
                      }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-[#6667AB]">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Document Upload Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'idFront', title: 'Front of ID', icon: CreditCard },
                      { key: 'idBack', title: 'Back of ID', icon: CreditCard }
                    ].map((doc, index) => (
                      <motion.div
                        key={doc.key}
                        className="space-y-3"
                        initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Label>{doc.title} *</Label>
                        <motion.div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6667AB] transition-colors cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                handleDocumentUpload(doc.key as 'idFront' | 'idBack', file);
                              }
                            };
                            input.click();
                          }}
                        >
                          {formData.documents[doc.key as keyof typeof formData.documents] ? (
                            <div className="space-y-2">
                              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                              <p className="text-green-600 font-medium">Document uploaded</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                              <p className="text-gray-600">Click to upload {doc.title.toLowerCase()}</p>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Selfie Upload */}
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label>Selfie with ID *</Label>
                    <motion.div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6667AB] transition-colors cursor-pointer max-w-md mx-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleDocumentUpload('selfie', file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {formData.documents.selfie ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                          <p className="text-green-600 font-medium">Selfie uploaded</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-gray-600">Upload a selfie holding your ID</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    className="flex justify-between pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('personal')}
                      className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white px-8"
                      size="lg"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep('verification')}
                      disabled={!formData.documents.idType || !formData.documents.idFront || !formData.documents.idBack || !formData.documents.selfie}
                      className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Verification Step */}
          {currentStep === 'verification' && (
            <motion.div
              key="verification"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <Shield className="h-6 w-6" />
                    Identity Verification
                  </CardTitle>
                  <CardDescription className="text-lg">
                    We're processing your documents for verification
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {!isSubmitting && !formData.verification.verified && (
                    <motion.div 
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div
                        className="w-20 h-20 bg-[#6667AB] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Shield className="h-10 w-10" style={{ color: '#6667AB' }} />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-4" style={{ color: '#6667AB' }}>
                        Ready for Verification
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Click below to start the automated verification process
                      </p>
                      <Button 
                        onClick={handleVerificationSubmit}
                        className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                        size="lg"
                      >
                        Start Verification
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}

                  {isSubmitting && (
                    <motion.div 
                      className="text-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Web3PulseLoader size={80} color="#6667AB" />
                      <p className="text-gray-600 mt-6 text-lg">
                        Verifying your identity...
                      </p>
                      <Progress value={progress} className="mt-4 max-w-md mx-auto" />
                    </motion.div>
                  )}

                  {formData.verification.verified && (
                    <motion.div 
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-4 text-green-600">
                        Verification Complete!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Your identity has been successfully verified
                      </p>
                      <Button 
                        onClick={() => setCurrentStep('review')}
                        className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                        size="lg"
                      >
                        Continue to Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}

                  <motion.div 
                    className="flex justify-start pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('documents')}
                      disabled={isSubmitting}
                      className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white px-8"
                      size="lg"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <motion.div
              key="review"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <CheckCircle className="h-6 w-6" />
                    Review & Submit
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Please review your information before final submission
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" style={{ color: '#6667AB' }} />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Name</p>
                              <p className="font-medium">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date of Birth</p>
                              <p className="font-medium">{formData.personalInfo.dateOfBirth}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Nationality</p>
                              <p className="font-medium">{formData.personalInfo.nationality || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Country</p>
                              <p className="font-medium">{formData.personalInfo.country || 'Not specified'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" style={{ color: '#6667AB' }} />
                            Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Document Type</span>
                              <span className="font-medium">{formData.documents.idType}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Documents Uploaded</span>
                              <div className="flex gap-2">
                                <Badge className="bg-green-100 text-green-700">ID Front</Badge>
                                <Badge className="bg-green-100 text-green-700">ID Back</Badge>
                                <Badge className="bg-green-100 text-green-700">Selfie</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" style={{ color: '#6667AB' }} />
                            Verification Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 font-medium">Identity Verified</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="flex justify-between pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('verification')}
                      className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white px-8"
                      size="lg"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Web3SpinLoader size={16} color="white" />
                          <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        <>
                          Submit KYC
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Completed Step */}
          {currentStep === 'completed' && (
            <motion.div
              key="completed"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0 max-w-2xl mx-auto">
                <CardContent className="p-12">
                  <motion.div
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 1 }}
                  >
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold mb-4" style={{ color: '#6667AB' }}>
                    KYC Verification Complete!
                  </h2>
                  
                  <p className="text-xl text-gray-600 mb-8">
                    Your account has been successfully verified and is now ready for trading. 
                    You have full access to all platform features.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                      <Zap className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium">Gasless Swaps</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                      <Globe className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium">Multi-Chain Access</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium">Full Security</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = '/swap'}
                    className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                    size="lg"
                  >
                    Start Trading
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet Modal */}
      <ModernWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
        isConnecting={isConnecting}
      />
    </div>
  );
}