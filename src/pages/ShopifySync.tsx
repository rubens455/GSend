"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingBag, 
  Download, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function ShopifySync() {
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async (data: { shopDomain: string; accessToken: string }) => {
      const response = await apiRequest("POST", "/api/shopify/sync", data);
      return response.json();
    },
    onSuccess: (result: SyncResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSyncResult(result);
      toast({
        title: "Sync Complete",
        description: `${result.imported} contacts imported, ${result.updated} updated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopDomain && accessToken) {
      setIsConfigured(true);
      syncMutation.mutate({ shopDomain, accessToken });
    }
  };

  const resetForm = () => {
    setShopDomain("");
    setAccessToken("");
    setIsConfigured(false);
    setSyncResult(null);
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Shopify Sync</h2>
            <p className="text-slate-600 mt-1">Import and sync customers from your Shopify store</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => window.open('https://help.shopify.com/en/manual/apps/private-apps', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Setup Guide
            </Button>
            {isConfigured && (
              <Button variant="outline" onClick={resetForm}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Sync
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Setup Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To sync customers from Shopify, you'll need to create a private app in your Shopify admin. 
            The app needs read access to customers and their contact information.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Shopify Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConfigured ? (
                <form onSubmit={handleSync} className="space-y-4">
                  <div>
                    <Label htmlFor="shop-domain">Shop Domain *</Label>
                    <Input
                      id="shop-domain"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      placeholder="your-shop-name"
                      required
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Enter just the shop name (without .myshopify.com)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="access-token">Private App Access Token *</Label>
                    <Input
                      id="access-token"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="shppa_xxxxxxxxxx"
                      required
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Found in your Shopify private app settings
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={syncMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {syncMutation.isPending ? (
                      <>
                        <Download className="h-4 w-4 mr-2 animate-spin" />
                        Syncing Customers...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Connected to Shopify</p>
                      <p className="text-sm text-green-600">{shopDomain}.myshopify.com</p>
                    </div>
                  </div>
                  
                  {syncMutation.isPending && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Importing customers...</span>
                        <span>Please wait</span>
                      </div>
                      <Progress value={undefined} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Results */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
            </CardHeader>
            <CardContent>
              {syncResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{syncResult.imported}</p>
                      <p className="text-sm text-green-700">New Contacts</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{syncResult.updated}</p>
                      <p className="text-sm text-blue-700">Updated</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{syncResult.skipped}</p>
                      <p className="text-sm text-yellow-700">Skipped</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{syncResult.errors.length}</p>
                      <p className="text-sm text-red-700">Errors</p>
                    </div>
                  </div>

                  {syncResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Sync completed with errors:</p>
                        <ul className="text-sm space-y-1">
                          {syncResult.errors.slice(0, 3).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {syncResult.errors.length > 3 && (
                            <li>• And {syncResult.errors.length - 3} more errors...</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No sync data yet</p>
                  <p className="text-sm text-slate-400">Connect to Shopify to see sync results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">1. Create a Private App in Shopify</h4>
                <ol className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• Go to your Shopify Admin → Apps → App and sales channel settings</li>
                  <li>• Click "Develop apps" → "Create an app"</li>
                  <li>• Name your app (e.g., "SMS Marketing Integration")</li>
                  <li>• Configure Admin API scopes: Enable "read_customers"</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">2. Get Your Credentials</h4>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• Copy the "Admin API access token" from your private app</li>
                  <li>• Your shop name is the part before ".myshopify.com" in your store URL</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">3. What Gets Synced</h4>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• Customer first and last names</li>
                  <li>• Phone numbers (only customers with phone numbers)</li>
                  <li>• Email addresses</li>
                  <li>• Marketing consent status</li>
                  <li>• Customer tags</li>
                </ul>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacy Note:</strong> We only import customers who have phone numbers and respect their marketing preferences.
                  Customers who haven't opted in to marketing will require double opt-in before receiving SMS messages.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Sync Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Automatic Sync (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">Automatic syncing is not yet available</p>
              <p className="text-sm text-slate-400">
                Currently, you need to manually sync customers. We're working on automatic daily syncing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
