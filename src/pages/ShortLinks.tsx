"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Link2, 
  Copy, 
  ExternalLink, 
  BarChart3,
  Eye,
  Trash2
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShortLink } from "@shared/schema";

export default function ShortLinks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    originalUrl: "",
    title: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: shortLinks, isLoading } = useQuery<ShortLink[]>({
    queryKey: ["/api/short-links"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newLink) => {
      const response = await apiRequest("POST", "/api/short-links", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/short-links"] });
      toast({
        title: "Short Link Created",
        description: "Your short link has been created successfully.",
      });
      setIsCreateOpen(false);
      setNewLink({ originalUrl: "", title: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/short-links?id=${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/short-links"] });
      toast({
        title: "Short Link Deleted",
        description: "Short link has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.originalUrl) {
      createMutation.mutate(newLink);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Short link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const filteredLinks = shortLinks?.filter(link =>
    link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalClicks = shortLinks?.reduce((sum, link) => sum + (link.clickCount || 0), 0) || 0;
  const averageClicks = shortLinks?.length ? (totalClicks / shortLinks.length).toFixed(1) : 0;
  const topPerformingLink = shortLinks?.reduce((max, link) => 
    (link.clickCount || 0) > (max?.clickCount || 0) ? link : max, shortLinks[0]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-emerald-600 text-xl font-semibold">Loading Short Links...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Short Links</h2>
            <p className="text-slate-600 mt-1">Create and track short links for your SMS campaigns</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Short Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Short Link Dialog</DialogTitle>
              <DialogHeader>
                <DialogTitle>Create New Short Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="original-url">Original URL *</Label>
                  <Input
                    id="original-url"
                    type="url"
                    value={newLink.originalUrl}
                    onChange={(e) => setNewLink(prev => ({ ...prev, originalUrl: e.target.value }))}
                    placeholder="https://example.com/product"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={newLink.title}
                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Black Friday Sale"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Help identify this link in your analytics
                  </p>
                </div>
                
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    {createMutation.isPending ? "Creating..." : "Create Link"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Links</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatNumber(shortLinks?.length || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Link2 className="text-emerald-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Clicks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatNumber(totalClicks)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Avg: {averageClicks} per link
                  </p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-cyan-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Top Performer</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatNumber(topPerformingLink?.clickCount || 0)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 truncate">
                    {topPerformingLink?.shortCode || "No clicks yet"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Eye className="text-orange-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Links Table */}
        <Card>
          <CardContent className="p-0">
            {filteredLinks.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No short links found</p>
                <p className="text-sm text-slate-400">Create your first short link to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Original URL</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{link.shortUrl}</p>
                            <p className="text-sm text-slate-500">{link.shortCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate text-sm text-slate-700">{link.originalUrl}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{formatNumber(link.clickCount || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {formatDate(link.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.shortUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(link.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use Short Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">In SMS Campaigns</h4>
                <p className="text-sm text-slate-600">
                  Short links are automatically created when you include URLs in your campaign messages.
                  This helps track clicks and saves character count in your SMS.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Analytics</h4>
                <p className="text-sm text-slate-600">
                  Track how many people click your links to measure engagement and optimize your campaigns.
                  View detailed analytics for each link including click timestamps and user agents.
                </p>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-2">Best Practices</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Use descriptive titles to easily identify links in your analytics</li>
                <li>• Test your links before sending campaigns</li>
                <li>• Monitor click rates to optimize your messaging</li>
                <li>• Use short links for better SMS deliverability</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
