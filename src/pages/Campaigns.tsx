"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Calendar, Search, Edit, Trash2, Clock, Users } from "lucide-react";
import { formatDateTime, getStatusColor, extractMergeTags } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Template } from "@shared/schema";
import { SendTestDialog } from "@/components/SendTestDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from "next/navigation";

export default function Campaigns() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignData, setCampaignData] = useState({
    name: "",
    content: "",
    templateId: "",
    scheduledAt: "",
    tags: "",
    status: "draft" as const,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Open new campaign form if ?new=1 is present
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsFormOpen(true);
      // Optionally, remove the query param from the URL after opening
      router.replace("/campaigns", { scroll: false });
    }
  }, [searchParams, router]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof campaignData) => {
      const payload = {
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        templateId: data.templateId ? parseInt(data.templateId) : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      };
      const response = await apiRequest("POST", "/api/campaigns", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<typeof campaignData>) => {
      const { id, ...updateData } = data;
      const payload = {
        ...updateData,
        tags: updateData.tags?.split(',').map(t => t.trim()).filter(Boolean),
        templateId: updateData.templateId ? parseInt(updateData.templateId) : undefined,
        scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : undefined,
      };
      const response = await apiRequest("PUT", `/api/campaigns?id=${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully.",
      });
      setIsFormOpen(false);
      setEditingCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Sent",
        description: "Your campaign is being sent to contacts.",
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

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("DELETE", `/api/campaigns?id=${campaignId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been successfully deleted.",
      });
      setIsConfirmDeleteOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = (campaign: Campaign | null = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignData({
        name: campaign.name,
        content: campaign.content,
        templateId: campaign.templateId?.toString() || "",
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().substring(0, 16) : "",
        tags: campaign.tags?.join(", ") || "",
        status: campaign.status as "draft" | "scheduled",
      });
    } else {
      setEditingCampaign(null);
      setCampaignData({
        name: "",
        content: "",
        templateId: "",
        scheduledAt: "",
        tags: "",
        status: "draft",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCampaign(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === parseInt(templateId));
    if (template) {
      setCampaignData(prev => ({
        ...prev,
        templateId,
        content: template.content,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (campaignData.name && campaignData.content) {
      if (editingCampaign) {
        updateMutation.mutate({ id: editingCampaign.id, ...campaignData });
      } else {
        createMutation.mutate(campaignData);
      }
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete.id);
    }
  };

  const filteredCampaigns = campaigns?.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const mergeTags = extractMergeTags(campaignData.content);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Campaigns</h2>
            <p className="text-slate-600 mt-1">Create and manage your SMS campaigns</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full sm:max-w-2xl">
              <DialogTitle>Campaign Dialog</DialogTitle>
              <DialogHeader>
                <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Black Friday Sale"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-select">Template (Optional)</Label>
                    <Select value={campaignData.templateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="campaign-content">Message Content</Label>
                  <Textarea
                    id="campaign-content"
                    value={campaignData.content}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Hi {{first_name}}, don't miss our Black Friday sale! Get 50% off. Reply STOP to unsubscribe."
                    rows={4}
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-slate-500">
                      Character count: {campaignData.content.length}/160
                    </p>
                    {mergeTags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-slate-500">Tags:</span>
                        {mergeTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-tags">Target Tags (Optional)</Label>
                    <Input
                      id="campaign-tags"
                      value={campaignData.tags}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="vip, black-friday, customers"
                    />
                    <p className="text-sm text-slate-500 mt-1">Comma-separated tags to target specific contacts</p>
                  </div>
                  <div>
                    <Label htmlFor="scheduled-at">Schedule (Optional)</Label>
                    <Input
                      id="scheduled-at"
                      type="datetime-local"
                      value={campaignData.scheduledAt}
                      onChange={(e) => setCampaignData(prev => ({ 
                        ...prev, 
                        scheduledAt: e.target.value,
                        status: e.target.value ? 'scheduled' : 'draft'
                      }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseForm} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                    {createMutation.isPending || updateMutation.isPending
                      ? (editingCampaign ? "Saving..." : "Creating...")
                      : (editingCampaign ? "Save Changes" : "Create Campaign")}
                  </Button>
                </div>

                {/* Only show SendTestDialog when editing an existing campaign */}
                {editingCampaign && (
                  <div className="flex justify-end">
                    <SendTestDialog campaign={editingCampaign} />
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full max-w-full sm:max-w-md"
            />
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaignsLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Send className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No campaigns found</p>
                <p className="text-sm text-slate-400">Create your first campaign to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      {/* Left side: Details */}
                      <div className="md:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 space-y-1 sm:space-y-0">
                          <h3 className="text-xl font-semibold text-slate-900">{campaign.name}</h3>
                          <Badge variant={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        </div>
                        <p className="text-slate-600 mb-4">{campaign.content}</p>
                        <div className="flex flex-col sm:flex-row text-sm text-slate-500 space-y-1 sm:space-y-0 sm:space-x-6">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{campaign.contactsCount || 0} contacts</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Created: {formatDateTime(campaign.createdAt)}</span>
                          </div>
                          {campaign.scheduledAt && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Scheduled: {formatDateTime(campaign.scheduledAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Right side: Actions */}
                      <div className="flex flex-row sm:flex-col items-end justify-between space-x-2 sm:space-x-0 sm:space-y-3">
                        <div className="flex items-center space-x-2">
                          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg" onClick={() => sendMutation.mutate(campaign.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800" onClick={() => handleOpenForm(campaign)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteClick(campaign)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign
              "{campaignToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
