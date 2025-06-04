import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Shield, Download, Globe, Clock, FileText } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('terms');
  const [jurisdiction, setJurisdiction] = useState('us');

  const downloadData = async () => {
    // In a real app, this would trigger a data export
    console.log('Exporting user data...');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal & Privacy</h1>
          <p className="text-gray-500 mt-1">Manage your privacy settings and review legal documents</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
          >
            <option value="us">United States</option>
            <option value="eu">European Union</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
          </select>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={downloadData}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Privacy Settings
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Data Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="prose max-w-none">
                  <h2>1. Introduction</h2>
                  <p>Welcome to Rest Easy. By using our service, you agree to these terms.</p>
                  
                  <h2>2. Service Description</h2>
                  <p>Rest Easy provides end-of-life planning and document management services.</p>
                  
                  <h2>3. User Responsibilities</h2>
                  <p>Users must:</p>
                  <ul>
                    <li>Provide accurate information</li>
                    <li>Maintain account security</li>
                    <li>Comply with applicable laws</li>
                  </ul>
                  
                  <h2>4. Privacy & Data</h2>
                  <p>We protect your privacy as described in our Privacy Policy.</p>
                  
                  <h2>5. Termination</h2>
                  <p>Either party may terminate this agreement with notice.</p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="prose max-w-none">
                  <h2>Data Collection</h2>
                  <p>We collect information you provide and usage data to improve our service.</p>
                  
                  <h2>Data Usage</h2>
                  <p>Your data is used to:</p>
                  <ul>
                    <li>Provide our services</li>
                    <li>Improve user experience</li>
                    <li>Comply with legal requirements</li>
                  </ul>
                  
                  <h2>Data Protection</h2>
                  <p>We use industry-standard encryption and security measures.</p>
                  
                  <h2>Your Rights</h2>
                  <p>You can:</p>
                  <ul>
                    <li>Access your data</li>
                    <li>Request corrections</li>
                    <li>Delete your account</li>
                  </ul>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Essential Data</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Account Information</p>
                      <p className="text-sm text-gray-600">Required for service operation</p>
                    </div>
                    <div className="bg-gray-200 px-3 py-1 rounded text-sm">Required</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Optional Data Collection</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Usage Analytics</p>
                        <p className="text-sm text-gray-600">Help us improve our service</p>
                      </div>
                      <Button variant="outline">Opt Out</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-gray-600">Receive updates and news</p>
                      </div>
                      <Button variant="outline">Opt Out</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Third-party Integrations</p>
                        <p className="text-sm text-gray-600">Connect with other services</p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Active Account Data</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Account Information</p>
                    <p className="text-sm text-gray-600">Retained while account is active</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Documents & Assets</p>
                    <p className="text-sm text-gray-600">Stored until explicitly deleted</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Deleted Account Data</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Account Deletion</p>
                    <p className="text-sm text-gray-600">Data removed within 30 days</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Backup Retention</p>
                    <p className="text-sm text-gray-600">Backups purged after 90 days</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Legal Requirements</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Compliance Records</p>
                    <p className="text-sm text-gray-600">Retained as required by law</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}