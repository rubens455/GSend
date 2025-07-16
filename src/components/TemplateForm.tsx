import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Tag } from "lucide-react";
import { extractMergeTags } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema";

interface TemplateFormProps {
  template?: Template;
  onSuccess?: () => void;
}

export default function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const [name, setName] = useState(template?.name || "");
  const [content, setContent] = useState(template?.content || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = !!template;
  const mergeTags = extractMergeTags(content);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      const url = isEditing ? `/api/templates?id=${template.id}` : "/api/templates";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: isEditing ? "Template Updated" : "Template Created",
        description: "Your SMS template has been saved successfully.",
      });
      
      if (!isEditing) {
        // Reset form for new template
        setName("");
        setContent("");
      }
      
      onSuccess?.();
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
    if (name.trim() && content.trim()) {
      mutation.mutate({ name: name.trim(), content: content.trim() });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{isEditing ? "Edit Template" : "Create Template"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Message, Promotional Offer"
              required
            />
          </div>

          <div>
            <Label htmlFor="template-content">Message Content</Label>
            <Textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hi {{first_name}}, welcome to our SMS list! Reply STOP to unsubscribe."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-sm text-slate-500 mt-1">
              Use merge tags like {'{{first_name}}'}, {'{{last_name}}'}, {'{{phone_number}}'} to personalize messages.
            </p>
          </div>

          {mergeTags.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Merge Tags Found:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {mergeTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-slate-500">
              Character count: {content.length}/160 
              {content.length > 160 && (
                <span className="text-amber-600 ml-1">
                  (Will be sent as {Math.ceil(content.length / 160)} messages)
                </span>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={!name.trim() || !content.trim() || mutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {mutation.isPending ? (
                isEditing ? "Updating..." : "Creating..."
              ) : (
                <>
                  {isEditing ? "Update" : <Plus className="h-4 w-4 mr-1" />}
                  {isEditing ? "Template" : "Create Template"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
