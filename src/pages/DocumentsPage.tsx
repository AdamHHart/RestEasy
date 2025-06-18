import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Trash2, Edit, FileText, Download } from 'lucide-react';
import { AddDocumentModal } from '../components/modals/AddDocumentModal';
import { EditDocumentModal } from '../components/modals/EditDocumentModal';
import { toast } from '../components/ui/toast';

interface Document {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  category: 'legal' | 'financial' | 'health' | 'personal';
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_organization: string | null;
  created_at: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching documents');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: Document['category']) => {
    const colors = {
      legal: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      health: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
    };
    return colors[category];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <Card key={document.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{document.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(document.category)}`}>
                    {document.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEdit(document)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-600"
                  onClick={() => handleDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {document.description && (
              <p className="text-gray-600 text-sm mb-3">{document.description}</p>
            )}

            {document.contact_name && (
              <div className="text-sm mb-2">
                <span className="font-medium">Contact:</span> {document.contact_name}
                {document.contact_organization && ` (${document.contact_organization})`}
              </div>
            )}
            
            <div className="text-xs text-gray-400 mt-4">
              Uploaded {new Date(document.created_at).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No documents uploaded yet</p>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Upload Your First Document
          </Button>
        </Card>
      )}

      <AddDocumentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchDocuments}
      />

      <EditDocumentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchDocuments}
        document={selectedDocument}
      />
    </div>
  );
}