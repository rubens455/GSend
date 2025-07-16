import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Send, 
  Phone, 
  Mail, 
  Tag, 
  ArrowLeft,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, formatDateTime } from "@/lib/utils";
import type { Contact } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  contactId: number;
  campaignId: number;
  phoneNumber: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

interface ContactMessagesProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactMessages({ contact, isOpen, onClose }: ContactMessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/contacts", contact?.id, "messages"],
    queryFn: async () => {
      if (!contact?.id) return [];
      const res = await fetch(`/api/contacts/${contact.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!contact?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/contacts/${contact?.id}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contact?.id, "messages"] });
      setNewMessage("");
      setSendError(null);
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      setSendError("Message failed to send.");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scroll to the last message or sending bubble when messages or sending state changes
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sendMessageMutation.isPending]);

  // NOTE: If you see a linter error for '@shared/schema', ensure your tsconfig paths are correct and the module exists.

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && contact) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-emerald-500" />;
      case 'failed':
        return <Check className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-slate-400" />;
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 h-[600px] flex flex-col bg-green-200 rounded-2xl shadow-xl">
        <DialogTitle><span className="sr-only">Contact Messages</span></DialogTitle>
        {/* Minimal Header */}
        <div className="bg-green-200 px-6 py-2 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-bold text-lg text-green-900">{contact.firstName} {contact.lastName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-green-900 hover:text-green-700 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Messages Area */}
        {/* Adjust mt-[-24px] to control how much the message area overlaps upward. Increase the absolute value to move it higher. */}
        <div className="flex-1 min-h-[430px] mt-[-12px] overflow-y-auto px-6 py-8 space-y-6 bg-green-50 rounded-xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-emerald-600 text-lg font-semibold">Loading Messages...</p>
            </div>
          ) : Array.isArray(messages) && messages.length > 0 ? (
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  ref={idx === messages.length - 1 && !sendMessageMutation.isPending ? lastMessageRef : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-end"
                >
                  <div className="max-w-xs px-5 py-3 rounded-2xl bg-blue-500 text-white text-lg shadow-md">
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {sendMessageMutation.isPending && (
                <motion.div
                  key="sending-message"
                  ref={lastMessageRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-end"
                >
                  <div className="max-w-xs px-5 py-3 rounded-2xl bg-gray-300 text-gray-700 text-lg shadow-md flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending message...
                  </div>
                </motion.div>
              )}
              {sendError && (
                <motion.div
                  key="send-error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-end"
                >
                  <div className="max-w-xs px-5 py-3 rounded-2xl bg-red-500 text-white text-lg shadow-md">
                    Message failed to send.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-blue-200 mx-auto mb-4" />
              <p className="text-blue-400 text-lg">No messages yet</p>
            </div>
          )}
        </div>
        {/* Message Input */}
        <div className="px-4 py-4 bg-transparent">
          <form onSubmit={handleSendMessage} className="flex items-center bg-white rounded-full shadow px-4 py-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border-none focus:ring-0 bg-transparent text-green-900 placeholder-green-400 text-lg"
              disabled={sendMessageMutation.isPending}
              style={{ boxShadow: 'none' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="ml-2 bg-green-400 hover:bg-green-500 text-white rounded-full p-2 transition-colors disabled:opacity-50"
              style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.10)' }}
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 