import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_NETWORKS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";

export function NetworkSelector() {
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);

  const handleNetworkChange = (network: typeof SUPPORTED_NETWORKS[0]) => {
    setSelectedNetwork(network);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <div className={`w-6 h-6 bg-gradient-to-r ${selectedNetwork.color} rounded-full flex items-center justify-center`}>
            <i className={`${selectedNetwork.icon} text-white text-xs`}></i>
          </div>
          <span className="hidden sm:inline">{selectedNetwork.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => handleNetworkChange(network)}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className={`w-6 h-6 bg-gradient-to-r ${network.color} rounded-full flex items-center justify-center`}>
              <i className={`${network.icon} text-white text-xs`}></i>
            </div>
            <div>
              <div className="font-medium">{network.name}</div>
              <div className="text-xs text-gray-500">{network.standard}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
