import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  Scale, 
  FolderClosed, 
  FileText, 
  Mail, 
  ChevronRight, 
  CheckCircle2,
  Send,
  Eye,
  Download,
  Shield,
  Edit,
  X
} from 'lucide-react';
import DeathCertificateUpload from './DeathCertificateUpload';
import { toast } from '../ui/toast';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_organization: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  description: string;
  file_path: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_organization: string;
}

interface Will {
  id: string;
  title: string;
  content: string;
}

interface EmailDraft {
  id: string;
  contact_email: string;
  contact_name: string;
  contact_organization: string;
  subject: string;
  content: string;
  documents: Document[];
  sent: boolean;
}

export default function ExecutorWorkflow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [plannerName, setPlannerName] = useState('');
  const [will, setWill] = useState<Will | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editEmailModalOpen, setEditEmailModalOpen] = useState(false);
  const [selectedEmailDraft, setSelectedEmailDraft] = useState<EmailDraft | null>(null);
  const [editingEmail, setEditingEmail] = useState({ subject: '', content: '' });

  const steps: WorkflowStep[] = [
    {
      id: 'verification',
      title: 'Death Verification',
      description: 'Upload and verify the death certificate',
      completed: isVerified,
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'will',
      title: 'Review Will',
      description: 'Review the deceased\'s last will and testament',
      completed: false,
      icon: <Scale className="h-5 w-5" />
    },
    {
      id: 'assets',
      title: 'Assets Overview',
      description: 'Review all documented assets and their details',
      completed: false,
      icon: <FolderClosed className="h-5 w-5" />
    },
    {
      id: 'documents',
      title: 'Documents Overview',
      description: 'Review all important documents',
      completed: false,
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'notifications',
      title: 'Contact Representatives',
      description: 'Send notifications to document representatives',
      completed: false,
      icon: <Mail className="h-5 w-5" />
    }
  ];

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  useEffect(() => {
    if (isVerified) {
      loadWorkflowData();
    }
  }, [isVerified]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      
      // Get the planner ID from executor relationship
      const { data: executorData } = await supabase
        .from('executors')
        .select('planner_id, id, name')
        .eq('email', user?.email)
        .eq('status', 'active')
        .single();

      if (!executorData) {
        setLoading(false);
        return;
      }

      // Get planner's name using edge function
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error('Missing Supabase environment variables');
          setPlannerName(`Planner ${executorData.planner_id.slice(0, 8)}`);
        } else {
          const response = await fetch(`${supabaseUrl}/functions/v1/get-planner-info`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planner_id: executorData.planner_id
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setPlannerName(result.planner_name);
            } else {
              setPlannerName(`Planner ${executorData.planner_id.slice(0, 8)}`);
            }
          } else {
            setPlannerName(`Planner ${executorData.planner_id.slice(0, 8)}`);
          }
        }
      } catch (error) {
        console.error('Error fetching planner info:', error);
        setPlannerName(`Planner ${executorData.planner_id.slice(0, 8)}`);
      }

      // Check if death has been verified
      const { data: triggerData } = await supabase
        .from('trigger_events')
        .select('triggered')
        .eq('user_id', executorData.planner_id)
        .eq('executor_id', executorData.id)
        .eq('type', 'death')
        .single();

      if (triggerData?.triggered) {
        setIsVerified(true);
        setCurrentStep(1); // Move to next step after verification
      }

    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowData = async () => {
    try {
      // Get the planner ID from executor relationship
      const { data: executorData } = await supabase
        .from('executors')
        .select('planner_id')
        .eq('email', user?.email)
        .eq('status', 'active')
        .single();

      if (!executorData) return;

      const plannerId = executorData.planner_id;

      // Load will
      const { data: willData } = await supabase
        .from('wishes')
        .select('*')
        .eq('user_id', plannerId)
        .eq('type', 'will')
        .single();

      if (willData) setWill(willData);

      // Load assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', plannerId);

      if (assetsData) setAssets(assetsData);

      // Load documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', plannerId);

      if (documentsData) {
        setDocuments(documentsData);
        generateEmailDrafts(documentsData);
      }

    } catch (error) {
      console.error('Error loading workflow data:', error);
    }
  };

  const generateEmailDrafts = (docs: Document[]) => {
    // Group documents by contact email
    const contactGroups = docs.reduce((groups, doc) => {
      if (!doc.contact_email) return groups;
      
      const key = doc.contact_email;
      if (!groups[key]) {
        groups[key] = {
          contact: {
            email: doc.contact_email,
            name: doc.contact_name,
            organization: doc.contact_organization
          },
          documents: []
        };
      }
      groups[key].documents.push(doc);
      return groups;
    }, {} as Record<string, { contact: any; documents: Document[] }>);

    // Generate email drafts for each contact
    const drafts = Object.values(contactGroups).map((group, index) => {
      const { contact, documents } = group;
      const documentTypes = [...new Set(documents.map(d => d.category))];
      
      return {
        id: `draft-${index}`,
        contact_email: contact.email,
        contact_name: contact.name || 'Representative',
        contact_organization: contact.organization || '',
        subject: `Notification of Passing - ${documents[0].name}${documents.length > 1 ? ` and ${documents.length - 1} other document${documents.length > 2 ? 's' : ''}` : ''}`,
        content: generateEmailContent(contact, documents, documentTypes),
        documents,
        sent: false
      };
    });

    setEmailDrafts(drafts);
  };

  const generateEmailContent = (contact: any, documents: Document[], documentTypes: string[]) => {
    const contactName = contact.name || 'Representative';
    const organization = contact.organization ? ` at ${contact.organization}` : '';
    
    let content = `Dear ${contactName},\n\n`;
    content += `I am writing to inform you of the passing of ${plannerName}, who held `;
    
    if (documents.length === 1) {
      content += `${documents[0].category} documentation with your organization`;
    } else {
      content += `multiple accounts and documents with your organization`;
    }
    
    content += `.\n\nAs the designated executor of their estate, I need to notify you of this passing and request information about the following:\n\n`;
    
    documents.forEach((doc, index) => {
      content += `${index + 1}. ${doc.name}`;
      if (doc.description) {
        content += ` - ${doc.description}`;
      }
      content += '\n';
    });
    
    content += `\nPlease let me know what documentation you require to proceed with the necessary account closures, transfers, or other required actions. I can provide a certified copy of the death certificate and any other documentation you may need.\n\n`;
    content += `I would appreciate your guidance on the next steps and any forms that need to be completed.\n\n`;
    content += `Thank you for your assistance during this difficult time.\n\n`;
    content += `Sincerely,\n[Your Name]\nExecutor of the Estate`;
    
    return content;
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setCurrentStep(1);
    loadWorkflowData();
  };

  const markStepCompleted = (stepIndex: number) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].completed = true;
    
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link using proper DOM API
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const previewDocument = (document: Document) => {
    setSelectedDocument(document);
    setPreviewModalOpen(true);
  };

  const editEmail = (draft: EmailDraft) => {
    setSelectedEmailDraft(draft);
    setEditingEmail({
      subject: draft.subject,
      content: draft.content
    });
    setEditEmailModalOpen(true);
  };

  const saveEmailChanges = () => {
    if (!selectedEmailDraft) return;

    setEmailDrafts(prev => 
      prev.map(d => 
        d.id === selectedEmailDraft.id 
          ? { ...d, subject: editingEmail.subject, content: editingEmail.content }
          : d
      )
    );

    setEditEmailModalOpen(false);
    setSelectedEmailDraft(null);

    toast({
      title: "Success",
      description: "Email updated successfully",
    });
  };

  const sendEmail = async (draftId: string) => {
    const draft = emailDrafts.find(d => d.id === draftId);
    if (!draft) return;

    // Validate environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      toast({
        title: "Configuration Error",
        description: "Supabase URL is not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    if (!supabaseKey) {
      toast({
        title: "Configuration Error",
        description: "Supabase API key is not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Send email through edge function with proper error handling
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: draft.contact_email,
          subject: draft.subject,
          html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${draft.content}</pre>`,
          text: draft.content
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Mark as sent
      setEmailDrafts(prev => 
        prev.map(d => 
          d.id === draftId ? { ...d, sent: true } : d
        )
      );

      toast({
        title: "Email Sent ✅",
        description: `Notification sent to ${draft.contact_name} at ${draft.contact_email}`,
      });

    } catch (error) {
      console.error('Error sending email:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to email service. Please check your internet connection and Supabase configuration.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: `Failed to send email: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Executor Workflow</CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, index) => (
          <Card 
            key={step.id}
            className={`cursor-pointer transition-all ${
              index === currentStep ? 'ring-2 ring-calm-500 bg-calm-50' : 
              step.completed ? 'bg-green-50 border-green-200' : 
              index === 0 || isVerified ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => {
              if (index === 0 || isVerified) {
                setCurrentStep(index);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  step.completed ? 'bg-green-100 text-green-600' :
                  index === currentStep ? 'bg-calm-100 text-calm-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <DeathCertificateUpload 
              onVerificationComplete={handleVerificationComplete}
              isVerified={isVerified}
            />
          )}

          {currentStep === 1 && will && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Last Will and Testament</h3>
                <p className="text-sm text-blue-800 mb-3">{will.title}</p>
                {will.content && will.content !== 'Will document uploaded' && (
                  <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{will.content}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => markStepCompleted(1)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Copy
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{asset.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{asset.type}</p>
                    {asset.description && (
                      <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
                    )}
                    {asset.contact_name && (
                      <div className="mt-2 text-xs text-gray-500">
                        Contact: {asset.contact_name}
                        {asset.contact_organization && ` (${asset.contact_organization})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => markStepCompleted(2)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Reviewed
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{doc.category}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => previewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    )}
                    {doc.contact_name && (
                      <div className="mt-2 text-xs text-gray-500">
                        Contact: {doc.contact_name}
                        {doc.contact_organization && ` (${doc.contact_organization})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => markStepCompleted(3)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Reviewed
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Review and send notification emails to document representatives. 
                Each email includes all relevant documents for that contact.
              </div>
              
              {emailDrafts.map((draft) => (
                <Card key={draft.id} className={draft.sent ? 'bg-green-50 border-green-200' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{draft.contact_name}</CardTitle>
                        <p className="text-sm text-gray-500">{draft.contact_organization}</p>
                        <p className="text-sm text-gray-500">{draft.contact_email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editEmail(draft)}
                          disabled={draft.sent}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!draft.sent ? (
                          <Button size="sm" onClick={() => sendEmail(draft.id)}>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Sent ✓</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Subject:</p>
                        <p className="text-sm text-gray-600">{draft.subject}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Documents ({draft.documents.length}):</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {draft.documents.map((doc, index) => (
                            <li key={index}>{doc.name} ({doc.category})</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Message Preview:</p>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">
                            {draft.content.substring(0, 300)}...
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {emailDrafts.every(d => d.sent) && (
                <Button onClick={() => markStepCompleted(4)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Workflow
                </Button>
              )}
            </div>
          )}

          {/* Show access denied message for steps after verification if not verified */}
          {currentStep > 0 && !isVerified && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Required</h3>
              <p className="text-gray-500 mb-4">
                You must complete death certificate verification before accessing this step.
              </p>
              <Button onClick={() => setCurrentStep(0)}>
                Go to Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> {selectedDocument.category}
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> {selectedDocument.contact_name || 'N/A'}
                  </div>
                </div>
                {selectedDocument.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span> {selectedDocument.description}
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-4">
                    Document preview not available. Click download to view the full document.
                  </p>
                  <Button onClick={() => downloadDocument(selectedDocument)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Edit Modal */}
      <Dialog open={editEmailModalOpen} onOpenChange={setEditEmailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Email to {selectedEmailDraft?.contact_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                value={editingEmail.subject}
                onChange={(e) => setEditingEmail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[400px] font-mono text-sm"
                value={editingEmail.content}
                onChange={(e) => setEditingEmail(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Email content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEmailChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}