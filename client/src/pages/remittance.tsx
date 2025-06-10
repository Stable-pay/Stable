import { ParticleRemittanceFlow } from '@/components/remittance/particle-remittance-flow';

export default function Remittance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Crypto to Fiat Remittance
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Convert your crypto to fiat currency with gasless transactions powered by Particle Network's Account Abstraction
          </p>
        </div>
        <ParticleRemittanceFlow />
      </div>
    </div>
  );
}