"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Upload, 
  Users, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Tag,
  Check,
  X,
  Filter,
  Download,
  MessageSquare
} from "lucide-react";
import ContactUpload from "@/components/ContactUpload";
import { ContactMessages } from "@/components/ContactMessages";
import { formatPhoneNumber, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";
import clsx from "clsx";

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    tags: "",
  });
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsMessagesOpen(true);
  };

  const handleCloseMessages = () => {
    setIsMessagesOpen(false);
    setSelectedContact(null);
  };

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newContact) => {
      const payload = {
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const response = await apiRequest("POST", "/api/contacts", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Contact Created",
        description: "Contact has been added successfully.",
      });
      setIsCreateOpen(false);
      resetForm();
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
    mutationFn: async ({ id, data }: { id: number, data: Partial<Contact> }) => {
      const response = await apiRequest("PUT", `/api/contacts?id=${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact Updated",
        description: "Contact has been updated successfully.",
      });
      setEditingContact(null);
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
      const response = await apiRequest("DELETE", `/api/contacts?id=${id}`, {});
      return response.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSelectedContactIds((prev) => prev.filter((cid) => cid !== id));
      toast({
        title: "Contact Deleted",
        description: "Contact has been removed successfully.",
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      console.log('[FRONTEND] Bulk delete called with IDs:', ids);
      const payload = { ids };
      console.log('[FRONTEND] Sending payload:', payload);
      const response = await apiRequest("DELETE", "/api/contacts/bulk", payload);
      console.log('[FRONTEND] Response received:', response);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[FRONTEND] Bulk delete success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setSelectedContactIds([]);
      toast({
        title: "Contacts Deleted",
        description: "Selected contacts have been removed successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[FRONTEND] Bulk delete error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewContact({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      tags: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.phoneNumber) {
      createMutation.mutate(newContact);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      tags: contact.tags?.join(', ') || "",
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact && newContact.phoneNumber) {
      const updateData = {
        ...newContact,
        tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      updateMutation.mutate({ id: editingContact.id, data: updateData });
    }
  };

  const filteredContacts = contacts?.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(searchLower) ||
      contact.lastName?.toLowerCase().includes(searchLower) ||
      contact.phoneNumber.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }) || [];

  const optedInContacts = filteredContacts.filter(c => c.isOptedIn);
  const unsubscribedContacts = filteredContacts.filter(c => c.isUnsubscribed);
  const pendingOptIn = filteredContacts.filter(c => !c.isOptedIn && !c.isUnsubscribed);

  // When selectionMode is turned off, clear selectedContactIds
  useEffect(() => {
    if (!selectionMode) setSelectedContactIds([]);
  }, [selectionMode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-emerald-600 text-xl font-semibold">Loading Contacts...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contacts</h2>
          <p className="text-slate-500 mt-1 text-base">Manage your SMS marketing contacts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button variant="outline" onClick={() => window.open("/api/contacts/export", "_blank")} className="font-semibold px-5 py-2">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-semibold px-5 py-2">
                <Upload className="h-4 w-4 mr-2" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-2xl p-8">
              <DialogTitle>Upload Contacts</DialogTitle>
              <ContactUpload />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow px-6 py-2 rounded-lg">
                <Plus className="h-4 w-4 mr-2" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-2xl p-8">
              <DialogTitle>Add New Contact</DialogTitle>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={newContact.firstName} onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))} placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={newContact.lastName} onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Smith" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input id="phoneNumber" value={newContact.phoneNumber} onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="+1 (555) 123-4567" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={newContact.email} onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} placeholder="john@example.com" />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" value={newContact.tags} onChange={(e) => setNewContact(prev => ({ ...prev, tags: e.target.value }))} placeholder="vip, customer, black-friday" />
                  <p className="text-sm text-slate-500 mt-1">Comma-separated tags</p>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{createMutation.isPending ? "Adding..." : "Add Contact"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="overflow-x-auto min-w-0 w-full">
              <TabsList className="flex gap-2 bg-slate-100 rounded-full p-1 w-full min-w-0">
                <TabsTrigger value="all" className="rounded-full px-4 py-2 text-base data-[state=active]:bg-white data-[state=active]:shadow">All Contacts ({filteredContacts.length})</TabsTrigger>
                <TabsTrigger value="opted-in" className="rounded-full px-4 py-2 text-base data-[state=active]:bg-white data-[state=active]:shadow">Opted In ({optedInContacts.length})</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-full px-4 py-2 text-base data-[state=active]:bg-white data-[state=active]:shadow">Pending Opt-in ({pendingOptIn.length})</TabsTrigger>
                <TabsTrigger value="unsubscribed" className="rounded-full px-4 py-2 text-base data-[state=active]:bg-white data-[state=active]:shadow">Unsubscribed ({unsubscribedContacts.length})</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant={selectionMode ? "secondary" : "outline"}
                className="rounded-full font-semibold"
                onClick={() => setSelectionMode((v) => !v)}
              >
                {selectionMode ? "Cancel Selection" : "Select"}
              </Button>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full md:w-64 rounded-full border-slate-300" />
              </div>
              <Button variant="outline" size="sm" className="rounded-full font-semibold">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>
          </div>
          {/* Bulk Delete Button */}
          {selectedContactIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Button
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold shadow px-6 py-2 rounded-lg"
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedContactIds)}
                disabled={bulkDeleteMutation.isPending}
              >
                Delete Selected ({selectedContactIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedContactIds([])}
                disabled={bulkDeleteMutation.isPending}
              >
                Clear Selection
              </Button>
            </div>
          )}
          <TabsContent value="all" className="space-y-4">
            <div className="w-full min-w-0 overflow-x-auto rounded-2xl shadow bg-white">
              <ContactTable
                contacts={filteredContacts}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
                selectedContactIds={selectedContactIds}
                setSelectedContactIds={setSelectedContactIds}
                selectionMode={selectionMode}
                onContactClick={handleContactClick}
              />
            </div>
          </TabsContent>
          <TabsContent value="opted-in" className="space-y-4">
            <div className="w-full min-w-0 overflow-x-auto rounded-2xl shadow bg-white">
              <ContactTable
                contacts={optedInContacts}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
                selectedContactIds={selectedContactIds}
                setSelectedContactIds={setSelectedContactIds}
                selectionMode={selectionMode}
                onContactClick={handleContactClick}
              />
            </div>
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            <div className="w-full min-w-0 overflow-x-auto rounded-2xl shadow bg-white">
              <ContactTable
                contacts={pendingOptIn}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
                selectedContactIds={selectedContactIds}
                setSelectedContactIds={setSelectedContactIds}
                selectionMode={selectionMode}
                onContactClick={handleContactClick}
              />
            </div>
          </TabsContent>
          <TabsContent value="unsubscribed" className="space-y-4">
            <div className="w-full min-w-0 overflow-x-auto rounded-2xl shadow bg-white">
              <ContactTable
                contacts={unsubscribedContacts}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
                selectedContactIds={selectedContactIds}
                setSelectedContactIds={setSelectedContactIds}
                selectionMode={selectionMode}
                onContactClick={handleContactClick}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      {editingContact && (
        <Dialog open={true} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-xl rounded-2xl p-8 bg-white">
            <DialogTitle>Edit Contact</DialogTitle>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input id="edit-firstName" value={newContact.firstName} onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))} placeholder="John" />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input id="edit-lastName" value={newContact.lastName} onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Smith" />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                <Input id="edit-phoneNumber" value={newContact.phoneNumber} onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="+1 (555) 123-4567" required />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={newContact.email} onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <Input id="edit-tags" value={newContact.tags} onChange={(e) => setNewContact(prev => ({ ...prev, tags: e.target.value }))} placeholder="vip, customer, black-friday" />
                <p className="text-sm text-slate-500 mt-1">Comma-separated tags</p>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact Messages Dialog */}
      {selectedContact && (
        <ContactMessages
          contact={selectedContact}
          isOpen={isMessagesOpen}
          onClose={handleCloseMessages}
        />
      )}
    </div>
  );
}

interface ContactTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  selectedContactIds: number[];
  setSelectedContactIds: (ids: number[]) => void;
  selectionMode: boolean;
  onContactClick: (contact: Contact) => void;
}

function ContactTable({ contacts, isLoading, onEdit, onDelete, isDeleting, selectedContactIds, setSelectedContactIds, selectionMode, onContactClick }: ContactTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No contacts found</p>
          <p className="text-sm text-slate-400">Add contacts or adjust your search criteria</p>
        </CardContent>
      </Card>
    );
  }

  // Multi-select logic
  const allSelected = contacts.length > 0 && contacts.every(c => selectedContactIds.includes(c.id));
  const toggleAll = () => {
    if (allSelected) setSelectedContactIds([]);
    else setSelectedContactIds(contacts.map(c => c.id));
  };
  const toggleOne = (id: number) => {
    setSelectedContactIds(selectedContactIds.includes(id)
      ? selectedContactIds.filter(cid => cid !== id)
      : [...selectedContactIds, id]);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table className="w-full min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead>
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all contacts"
                  />
                )}
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className={selectedContactIds.includes(contact.id) ? "bg-emerald-50" : ""}>
                <TableCell>
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleOne(contact.id)}
                      aria-label={`Select contact ${contact.firstName} ${contact.lastName}`}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-medium text-sm">
                        {(contact.firstName?.[0] || contact.lastName?.[0] || 'C').toUpperCase()}
                      </span>
                    </div>
                    <div 
                      className="cursor-pointer hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-200 group flex items-center space-x-2"
                      onClick={() => onContactClick(contact)}
                    >
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.shopifyCustomerId && (
                          <p className="text-xs text-slate-500">Shopify Customer</p>
                        )}
                      </div>
                      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 border border-green-200">
                        <MessageSquare className="h-4 w-4 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{formatPhoneNumber(contact.phoneNumber)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.isUnsubscribed ? (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" />
                      Unsubscribed
                    </Badge>
                  ) : contact.isOptedIn ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Opted In
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {contact.tags && contact.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-500">
                    {formatDate(contact.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(contact)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(contact.id)}
                      disabled={isDeleting}
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
      </CardContent>
    </Card>
  );
}
