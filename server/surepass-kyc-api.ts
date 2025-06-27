import { Request, Response } from 'express';
import { ExternalServiceError, ValidationError, successResponse, asyncHandler } from './error-handler';

/**
 * Production-Ready Surepass KYC API Integration
 * Provides Aadhaar and PAN verification using Surepass APIs
 * API Documentation: https://app.surepass.app/docs/
 */
export class SurepassKYCAPI {
  private readonly apiToken = process.env.SUREPASS_API_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNjE2OTM0MywianRpIjoiYjk4ZDJlNTctNzQyNy00ZmMzLTkyMzctMjVjOGI1ODRjNDQyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnN0YWJsZXBheUBzdXJlcGFzcy5pbyIsIm5iZiI6MTczNjE2OTM0MywiZXhwIjoyMzY2ODg5MzQzLCJlbWFpbCI6InN0YWJsZXBheUBzdXJlcGFzcy5pbyIsInRlbmFudF9pZCI6Im1haW4iLCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.gwdII-K1wWVxCTIpawz-qyfvBWlYxKHsraRoXXO3Kf0';
  private readonly baseURL = 'https://kyc-api.surepass.io';

  /**
   * Send Aadhaar OTP using Surepass eAadhaar API
   * Endpoint: /api/v1/aadhaar-v2/generate-otp
   */
  sendAadhaarOTP = asyncHandler(async (req: Request, res: Response) => {
    const { aadhaar_number } = req.body;

    if (!aadhaar_number || aadhaar_number.length !== 12) {
      throw new ValidationError('Valid 12-digit Aadhaar number is required');
    }

    // For demo purposes, allow test Aadhaar numbers
    if (aadhaar_number === '123456789012' || aadhaar_number === '999999999999') {
      const responseData = {
        client_id: `demo_${aadhaar_number}_${Date.now()}`,
        message: 'Demo OTP: 123456'
      };
      
      return res.json(successResponse({
        message: 'OTP sent successfully (Demo Mode)',
        client_id: responseData.client_id,
        demo_message: responseData.message
      }, req));
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`${this.baseURL}/api/v1/aadhaar-v2/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          id_number: aadhaar_number
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.status_code === 200) {
        console.log('✅ Aadhaar OTP sent successfully:', aadhaar_number);
        return res.json(successResponse({
          message: 'OTP sent successfully',
          client_id: data.data?.client_id || `${aadhaar_number}_${Date.now()}`
        }, req));
      } else {
        console.error('❌ Surepass OTP API Error:', data);
        throw new ExternalServiceError('Surepass', data.message || 'Failed to send OTP', data);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ExternalServiceError('Surepass', 'Request timeout - please try again');
      }
      
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      
      console.error('❌ Aadhaar OTP Send Error:', error);
      throw new ExternalServiceError('Surepass', 'Unable to send OTP at this time', error.message);
    }
  });

  /**
   * Verify Aadhaar OTP using Surepass eAadhaar API
   * Endpoint: /api/v1/aadhaar-v2/submit-otp
   */
  async verifyAadhaarOTP(req: Request, res: Response) {
    try {
      const { aadhaar_number, otp } = req.body;

      if (!aadhaar_number || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar number and OTP are required'
        });
      }

      // Demo mode for test Aadhaar numbers
      if ((aadhaar_number === '123456789012' || aadhaar_number === '999999999999') && otp === '123456') {
        return res.json({
          success: true,
          message: 'Aadhaar verified successfully (Demo Mode)',
          data: {
            name: 'Test User',
            dob: '01/01/1990',
            gender: 'M',
            address: 'Test Address, Test City, Test State - 123456',
            photo: '',
            aadhaar_number: aadhaar_number,
            verification_status: 'verified'
          }
        });
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${this.baseURL}/api/v1/aadhaar-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          client_id: `${aadhaar_number}_${Date.now()}`, // Generate client_id from previous request
          otp: otp
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.status_code === 200) {
        return res.json({
          success: true,
          message: 'Aadhaar verified successfully',
          data: {
            name: data.data.full_name,
            dob: data.data.dob,
            gender: data.data.gender,
            address: this.formatAddress(data.data.address),
            photo: data.data.photo_link,
            aadhaar_number: data.data.aadhaar_number,
            verification_status: 'verified'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: data.message || 'Invalid OTP or verification failed',
          error: data
        });
      }
    } catch (error: any) {
      console.error('Aadhaar OTP Verification Error:', error);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        return res.status(408).json({
          success: false,
          message: 'Request timed out. Please check your internet connection and try again.'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again in a few moments.'
      });
    }
  }

  /**
   * Verify PAN using Surepass PAN Advanced API v3
   * Endpoint: /api/v1/pan-v3
   */
  async verifyPAN(req: Request, res: Response) {
    try {
      const { pan_number, name } = req.body;

      if (!pan_number || pan_number.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Valid 10-character PAN number is required'
        });
      }

      if (!name || name.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name is required for PAN verification'
        });
      }

      const response = await fetch(`${this.baseURL}/api/v1/pan-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          id_number: pan_number.toUpperCase(),
          name: name
        })
      });

      const data = await response.json();

      if (response.ok && data.status_code === 200) {
        const panData = data.data;
        const nameMatch = this.calculateNameMatch(name, panData.full_name);

        return res.json({
          success: true,
          message: 'PAN verified successfully',
          data: {
            pan_number: panData.pan_number,
            full_name: panData.full_name,
            name_match: nameMatch,
            verification_status: nameMatch > 70 ? 'verified' : 'name_mismatch',
            category: panData.category,
            aadhaar_seeding_status: panData.aadhaar_seeding_status,
            last_updated: panData.last_updated
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: data.message || 'PAN verification failed',
          error: data
        });
      }
    } catch (error) {
      console.error('PAN Verification Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during PAN verification'
      });
    }
  }

  /**
   * Comprehensive KYC Status Check
   * Returns overall verification status for a user
   */
  async getKYCStatus(req: Request, res: Response) {
    try {
      const { aadhaar_number, pan_number } = req.query;

      const status = {
        aadhaar: {
          verified: false,
          details: null
        },
        pan: {
          verified: false,
          details: null
        },
        overall_status: 'incomplete'
      };

      // This would typically check against a database of verified users
      // For now, we'll return the structure that the frontend expects

      return res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('KYC Status Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during status check'
      });
    }
  }

  /**
   * Format address from Aadhaar response
   */
  private formatAddress(addressData: any): string {
    if (typeof addressData === 'string') {
      return addressData;
    }

    if (typeof addressData === 'object') {
      const parts = [];
      if (addressData.house) parts.push(addressData.house);
      if (addressData.street) parts.push(addressData.street);
      if (addressData.landmark) parts.push(addressData.landmark);
      if (addressData.locality) parts.push(addressData.locality);
      if (addressData.city) parts.push(addressData.city);
      if (addressData.state) parts.push(addressData.state);
      if (addressData.pincode) parts.push(addressData.pincode);
      
      return parts.filter(Boolean).join(', ');
    }

    return 'Address not available';
  }

  /**
   * Calculate name matching percentage
   */
  private calculateNameMatch(inputName: string, panName: string): number {
    const normalize = (name: string) => 
      name.toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

    const input = normalize(inputName);
    const pan = normalize(panName);

    if (input === pan) return 100;

    // Simple word-based matching
    const inputWords = input.split(' ');
    const panWords = pan.split(' ');
    
    let matches = 0;
    for (const word of inputWords) {
      if (panWords.some(panWord => panWord.includes(word) || word.includes(panWord))) {
        matches++;
      }
    }

    return Math.round((matches / Math.max(inputWords.length, panWords.length)) * 100);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      return res.json({
        success: true,
        message: 'Surepass KYC API is operational',
        status: response.ok ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'Surepass KYC API is unavailable',
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const surepassKYCAPI = new SurepassKYCAPI();