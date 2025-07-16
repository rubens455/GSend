"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Tag,
  Copy,
  Eye
} from "lucide-react";
import TemplateForm from "@/components/TemplateForm";
import { formatDate, extractMergeTags } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/templates?id=${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template Deleted",
        description: "Template has been removed successfully.",
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

  const duplicateMutation = useMutation({
    mutationFn: async (template: Template) => {
      const response = await apiRequest("POST", "/api/templates", {
        name: `${template.name} (Copy)`,
        content: template.content,
        isActive: template.isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template Duplicated",
        description: "Template has been duplicated successfully.",
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

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeTemplates = filteredTemplates.filter(t => t.isActive);
  const inactiveTemplates = filteredTemplates.filter(t => !t.isActive);

  useEffect(() => {
    if (!selectionMode) setSelectedTemplateIds([]);
  }, [selectionMode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-emerald-600 text-xl font-semibold">Loading Templates...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Templates</h2>
            <p className="text-slate-600 mt-1">Create and manage reusable SMS templates</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogTitle>Create New Template</DialogTitle>
              <TemplateForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Search */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            className="font-semibold rounded-full"
            onClick={() => setSelectionMode((v) => !v)}
          >
            {selectionMode ? "Cancel Selection" : "Select"}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md rounded-full border-slate-300"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-6">
          {/* Active Templates */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Active Templates ({activeTemplates.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : activeTemplates.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">No active templates found</p>
                    <p className="text-sm text-slate-400">Create your first template to get started</p>
                  </CardContent>
                </Card>
              ) : (
                activeTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => setEditingTemplate(template)}
                    onDelete={() => deleteMutation.mutate(template.id)}
                    onDuplicate={() => duplicateMutation.mutate(template)}
                    onPreview={() => setPreviewTemplate(template)}
                    isDeleting={deleteMutation.isPending}
                    isDuplicating={duplicateMutation.isPending}
                    selectionMode={selectionMode}
                    selected={selectedTemplateIds.includes(template.id)}
                    onSelectChange={(checked) => {
                      setSelectedTemplateIds((prev) =>
                        checked
                          ? [...prev, template.id]
                          : prev.filter((id) => id !== template.id)
                      );
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Inactive Templates */}
          {inactiveTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Inactive Templates ({inactiveTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactiveTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => setEditingTemplate(template)}
                    onDelete={() => deleteMutation.mutate(template.id)}
                    onDuplicate={() => duplicateMutation.mutate(template)}
                    onPreview={() => setPreviewTemplate(template)}
                    isDeleting={deleteMutation.isPending}
                    isDuplicating={duplicateMutation.isPending}
                    selectionMode={selectionMode}
                    selected={selectedTemplateIds.includes(template.id)}
                    onSelectChange={(checked) => {
                      setSelectedTemplateIds((prev) =>
                        checked
                          ? [...prev, template.id]
                          : prev.filter((id) => id !== template.id)
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={true} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>Edit Template</DialogTitle>
            <TemplateForm 
              template={editingTemplate} 
              onSuccess={() => setEditingTemplate(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={true} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogTitle>Template Preview</DialogTitle>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">{previewTemplate.name}</h4>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {previewTemplate.content}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Character count: {previewTemplate.content.length}/160</span>
                {previewTemplate.content.length > 160 && (
                  <span className="text-amber-600">
                    ({Math.ceil(previewTemplate.content.length / 160)} messages)
                  </span>
                )}
              </div>

              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Merge Tags:</h5>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  isDeleting: boolean;
  isDuplicating: boolean;
  selectionMode: boolean;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
}

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onPreview,
  isDeleting,
  isDuplicating,
  selectionMode,
  selected,
  onSelectChange
}: TemplateCardProps) {
  const mergeTags = extractMergeTags(template.content);

  return (
    <Card className={`${!template.isActive ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectionMode && (
              <input
                type="checkbox"
                checked={selected}
                onChange={e => onSelectChange(e.target.checked)}
                aria-label={`Select template ${template.name}`}
              />
            )}
            <CardTitle className="text-lg truncate">{template.name}</CardTitle>
          </div>
          <Badge variant={template.isActive ? "default" : "secondary"}>
            {template.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-sm text-slate-700 line-clamp-3">
            {template.content}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Created {formatDate(template.createdAt)}</span>
          <span>{template.content.length} chars</span>
        </div>

        {mergeTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mergeTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {mergeTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{mergeTags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onDuplicate} disabled={isDuplicating}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
