import * as React from "react";
import { useData } from "@/context/data-context";
import collectionData from "@/data/collection_data.json";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FileSpreadsheet, Users } from "lucide-react";

export function AppSidebar() {
  const { cleanedClaims, filters, setFilters } = useData();

  const providers = React.useMemo(() => {
    const claimProviders = cleanedClaims.map((c: any) => c.doctorName as string);
    
    const collectionProviders = new Set<string>();
    collectionData.forEach((row: any) => {
      Object.keys(row).forEach((key) => {
        if (key !== "__EMPTY" && key !== "Total") {
          // Clean up some keys to match claim style if possible, or just add them
          let niceName = key;
          if (key === "Bruce J Buckman,DPT") niceName = "Bruce J Buckman - PT";
          else if (key === "Peter J Berger,DC") niceName = "Peter J Berger - Chiro";
          else if (key === "Madison Smith") niceName = "Madison Lynn Smith - OT";
          else if (key === "Christian Gartner") niceName = "Christian S Gartner - PT";
          else if (key === "Jay Brecker") niceName = "Jay E Brecker - Chiro";
          else if (key === "Monroe Castro") niceName = "Monreo Castro - PT";
          else if (key === "BILLY FORD,MD") niceName = "Billy Ford - Pain Mgmt";
          else if (key === "DAVID ADIN,DO - PAIN MGMT") niceName = "David Adin - Pain Mgmt";
          else if (key === "SRIDHAR YALAMANCHILI,PT") niceName = "Sridhar Yalamanchili - PT";
          else if (key === "ANDY KOSER,PT") niceName = "Andy Koser - PT";
          else if (key === "MARIANNE DECASTRO,PT") niceName = "Marianne Decastro - PT";
          else if (key === "Micheal Kelly") niceName = "Michael Kelly - Chiro";
          collectionProviders.add(niceName);
        }
      });
    });

    return Array.from(new Set([...claimProviders, ...Array.from(collectionProviders)]))
      .filter(Boolean)
      .sort();
  }, [cleanedClaims]);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center px-2 py-3">
          <span className="text-lg font-bold">Provider Collection</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Providers Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Providers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filters.provider.length === 0}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, provider: [] }))
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span>All Providers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {providers.map((provider) => {
                const isActive =
                  filters.provider.length === 1 &&
                  filters.provider[0] === provider;
                return (
                  <SidebarMenuItem key={provider}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          provider: [provider],
                        }))
                      }
                    >
                      <span>{provider}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
