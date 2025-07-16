import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseCSV } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function ContactUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (contacts: any[]) => {
      const response = await apiRequest("POST", "/api/contacts/upload", { contacts });
      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Upload Complete",
        description: `${result.imported} contacts imported, ${result.skipped} skipped`,
      });
      
      // Reset form
      setFile(null);
      setCsvData([]);
      setShowPreview(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);
        setShowPreview(true);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = () => {
    if (csvData.length > 0) {
      uploadMutation.mutate(csvData);
    }
  };

  const clearFile = () => {
    setFile(null);
    setCsvData([]);
    setShowPreview(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Contacts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="csv-file">CSV File</Label>
          <div className="flex items-center space-x-4 mt-1">
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              className="bg-gray-700 hover:bg-gray-800 text-white font-bold shadow px-6 py-2"
              onClick={() => document.getElementById('csv-file')?.click()}
            >
              {file ? 'Change File' : 'Choose File'}
            </Button>
            {file && <span className="font-medium text-slate-700">{file.name}</span>}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload a CSV file with columns: firstName, lastName, phoneNumber, email, tags
          </p>
        </div>

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>File: {file.name} ({csvData.length} rows)</span>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showPreview && csvData.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-200 p-2 text-left">First Name</th>
                      <th className="border-b border-slate-200 p-2 text-left">Last Name</th>
                      <th className="border-b border-slate-200 p-2 text-left">Phone</th>
                      <th className="border-b border-slate-200 p-2 text-left">Email</th>
                      <th className="border-b border-slate-200 p-2 text-left">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="p-2">{row.firstName || row.first_name || ''}</td>
                        <td className="p-2">{row.lastName || row.last_name || ''}</td>
                        <td className="p-2">{row.phoneNumber || row.phone || ''}</td>
                        <td className="p-2">{row.email || ''}</td>
                        <td className="p-2">{row.tags || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ready to import {csvData.length} contacts</span>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={uploadMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Contacts"}
              </Button>
            </div>
          </div>
        )}

        {!file && (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Choose a CSV file to upload</p>
            <p className="text-sm text-slate-500 mt-1">
              Drag and drop or click to select a file
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
