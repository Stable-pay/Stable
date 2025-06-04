export function Footer() {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Convert Tokens", href: "/swap" },
        { name: "Withdraw INR", href: "/withdraw" },
        { name: "KYC Verification", href: "/kyc" },
        { name: "Dashboard", href: "/dashboard" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "FAQ", href: "#" },
        { name: "Status", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Compliance", href: "#" },
        { name: "Security", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold">Stable Pay</span>
            </div>
            <p className="text-gray-400 text-sm">
              Seamless multi-chain token conversion to INR with KYC-compliant fiat withdrawals.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Stable Pay. All rights reserved. Built with Reown AppKit.</p>
        </div>
      </div>
    </footer>
  );
}
