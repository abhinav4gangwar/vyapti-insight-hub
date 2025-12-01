import CatalogueTab from "@/components/dgtr-components/Cataloguetab";
import TriggersTab from "@/components/dgtr-components/TriggersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";


export default function DGTRDashboard() {
  const [activeTab, setActiveTab] = useState("catalogue");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DGTR Anti-Dumping Investigations</h1>
          <p className="text-gray-600 mt-2">
            Track and monitor anti-dumping investigations from the Directorate General of Trade Remedies
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogue" className="mt-8">
            <CatalogueTab />
          </TabsContent>

          <TabsContent value="triggers" className="mt-8">
            <TriggersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}