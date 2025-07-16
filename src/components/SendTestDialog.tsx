import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";

interface SendTestDialogProps {
  campaign: Campaign;
}

export function SendTestDialog({ campaign }: SendTestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();

  const sendTestMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaign.id}/test`, {
        phoneNumber: phone,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test message.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: `Test message sent to ${phoneNumber}.`,
      });
      setIsOpen(false);
      setPhoneNumber("");
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
    if (phoneNumber) {
      sendTestMutation.mutate(phoneNumber);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" />
          Send Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Send Test Dialog</DialogTitle>
        <DialogHeader>
          <DialogTitle>Send Test Campaign</DialogTitle>
          <DialogDescription>
            Enter a phone number below to send a test version of this campaign. Merge tags will be replaced with sample data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-slate-600">
              Sending test for campaign: <span className="font-semibold">{campaign.name}</span>
            </p>
          </div>
          <div>
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter a phone number with country code"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={sendTestMutation.isPending}>
              {sendTestMutation.isPending ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 