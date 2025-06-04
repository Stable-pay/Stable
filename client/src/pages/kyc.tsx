import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { KYC_DOCUMENT_TYPES } from "@/lib/constants";
import { Check, Upload, Camera, FileText } from "lucide-react";

export default function KYC() {
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (documentType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simulate file upload
        setTimeout(() => {
          setUploadedDocs(prev => new Set(prev).add(documentType));
          toast({
            title: "Document Uploaded",
            description: `${file.name} has been uploaded successfully`,
          });
        }, 1000);
      }
    };
    input.click();
  };

  const handleSelfieCapture = () => {
    // Simulate selfie capture
    setTimeout(() => {
      setUploadedDocs(prev => new Set(prev).add('selfie'));
      toast({
        title: "Selfie Captured",
        description: "Live selfie has been captured successfully",
      });
    }, 2000);
  };

  const handleSubmitKYC = async () => {
    if (uploadedDocs.size < 3) {
      toast({
        title: "Incomplete Documentation",
        description: "Please upload all required documents before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate KYC submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setKycStatus("verified");
      toast({
        title: "KYC Submitted",
        description: "Your documents have been submitted for verification",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      verified: { label: "Verified", variant: "default" as const, color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    };
    
    return statusConfig[kycStatus];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">KYC Verification</h1>
        <p className="text-gray-600">Complete your verification to enable INR withdrawals</p>
      </div>

      {/* KYC Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Status</CardTitle>
            <Badge className={getStatusBadge().color}>
              {getStatusBadge().label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* KYC Steps */}
            {KYC_DOCUMENT_TYPES.map((docType, index) => {
              const isUploaded = uploadedDocs.has(docType.id);
              
              return (
                <div
                  key={docType.id}
                  className={`flex items-start space-x-4 p-4 border rounded-xl transition-colors ${
                    isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUploaded ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {isUploaded ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className={`${docType.icon} text-gray-600`}></i>
                      <h4 className="font-semibold text-gray-900">{docType.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{docType.description}</p>
                    
                    {!isUploaded ? (
                      <div>
                        {docType.id === 'selfie' ? (
                          <Button
                            onClick={handleSelfieCapture}
                            variant="outline"
                            className="w-full border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
                          >
                            <Camera className="h-5 w-5 mr-2 text-gray-400" />
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Take Live Selfie</p>
                              <p className="text-xs text-gray-500 mt-1">Ensure good lighting</p>
                            </div>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleFileUpload(docType.id)}
                            variant="outline"
                            className="w-full border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
                          >
                            <Upload className="h-5 w-5 mr-2 text-gray-400" />
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Click to upload {docType.name}</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 5MB</p>
                            </div>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-green-600">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Document uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleSubmitKYC}
                disabled={uploadedDocs.size < 3 || isSubmitting || kycStatus === "verified"}
                className="w-full py-3 font-semibold"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting for Verification...
                  </>
                ) : kycStatus === "verified" ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Verification Complete
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Verification typically takes 2-4 business hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-blue-500 mt-1"></i>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All documents must be clear and readable</li>
                <li>• Ensure your face is clearly visible in the selfie</li>
                <li>• Documents must be valid and not expired</li>
                <li>• Processing time is typically 2-4 business hours</li>
                <li>• You'll be notified via email once verification is complete</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
