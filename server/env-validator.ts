/**
 * Environment Variable Validation and Startup Checks
 * Ensures all critical environment variables are present before server startup
 */

interface EnvConfig {
  // Required environment variables
  required: string[];
  // Optional environment variables with defaults
  optional: { [key: string]: string };
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'VITE_WALLETCONNECT_PROJECT_ID',
    'VITE_DOMAIN_VERIFICATION_ID'
  ],
  optional: {
    'ZEROX_API_KEY': '12be1743-8f3e-4867-a82b-501263f3c4b6',
    'SUREPASS_API_TOKEN': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNjE2OTM0MywianRpIjoiYjk4ZDJlNTctNzQyNy00ZmMzLTkyMzctMjVjOGI1ODRjNDQyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnN0YWJsZXBheUBzdXJlcGFzcy5pbyIsIm5iZiI6MTczNjE2OTM0MywiZXhwIjoyMzY2ODg5MzQzLCJlbWFpbCI6InN0YWJsZXBheUBzdXJlcGFzcy5pbyIsInRlbmFudF9pZCI6Im1haW4iLCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.gwdII-K1wWVxCTIpawz-qyfvBWlYxKHsraRoXXO3Kf0',
    'NODE_ENV': 'development',
    'PORT': '5000'
  }
};

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validationErrors: string[] = [];
  private warnings: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate all environment variables at startup
   * @returns true if validation passes, false if critical errors found
   */
  public validateEnvironment(): boolean {
    this.validationErrors = [];
    this.warnings = [];

    console.log('🔍 Validating environment configuration...');

    // Check required environment variables
    for (const envVar of ENV_CONFIG.required) {
      if (!process.env[envVar]) {
        this.validationErrors.push(`❌ Missing required environment variable: ${envVar}`);
      } else {
        console.log(`✅ ${envVar}: Found`);
      }
    }

    // Check optional environment variables and set defaults
    for (const [envVar, defaultValue] of Object.entries(ENV_CONFIG.optional)) {
      if (!process.env[envVar]) {
        process.env[envVar] = defaultValue;
        this.warnings.push(`⚠️  Using default value for ${envVar}`);
        console.log(`🔧 ${envVar}: Using default value`);
      } else {
        console.log(`✅ ${envVar}: Found`);
      }
    }

    // Log any warnings
    if (this.warnings.length > 0) {
      console.warn('\n⚠️  Environment Warnings:');
      this.warnings.forEach(warning => console.warn(warning));
    }

    // Log any errors
    if (this.validationErrors.length > 0) {
      console.error('\n❌ Environment Validation Errors:');
      this.validationErrors.forEach(error => console.error(error));
      
      console.error('\n📋 To fix these errors:');
      console.error('1. Create a .env file in the project root');
      console.error('2. Add the missing environment variables');
      console.error('3. Restart the server');
      
      return false;
    }

    console.log('✅ Environment validation passed!\n');
    return true;
  }

  /**
   * Get specific environment variable with validation
   */
  public getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key];
    if (!value && !fallback) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || fallback || '';
  }

  /**
   * Log current environment status
   */
  public logEnvironmentStatus(): void {
    const env = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || '5000';
    
    console.log('🌍 Environment Status:');
    console.log(`   NODE_ENV: ${env}`);
    console.log(`   PORT: ${port}`);
    console.log(`   WalletConnect Project ID: ${process.env.VITE_WALLETCONNECT_PROJECT_ID ? 'Set' : 'Missing'}`);
    console.log(`   0x API Key: ${process.env.ZEROX_API_KEY ? 'Set' : 'Using default'}`);
    console.log(`   Surepass API Token: ${process.env.SUREPASS_API_TOKEN ? 'Set' : 'Using default'}`);
  }
}

/**
 * Convenience function to validate environment at startup
 */
export function validateEnvironmentOnStartup(): boolean {
  const validator = EnvironmentValidator.getInstance();
  const isValid = validator.validateEnvironment();
  
  if (isValid) {
    validator.logEnvironmentStatus();
  }
  
  return isValid;
}