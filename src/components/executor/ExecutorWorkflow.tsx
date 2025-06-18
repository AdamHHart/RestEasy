import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
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
  X,
  AlertTriangle,
  Building,
  User,
  Phone,
  CreditCard,
  Heart,
  Briefcase
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

interface ContactRepresentative {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  type: string;
  documents: Document[];
  assets: Asset[];
  status: 'not_contacted' | 'sent';
}

export default function ExecutorWorkflow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [plannerName, setPlannerName] = useState('');
  const [will, setWill] = useState<Will | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contactRepresentatives, setContactRepresentatives] = useState<ContactRepresentative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editEmailModalOpen, setEditEmailModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRepresentative | null>(null);
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
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not properly configured, using fallback planner name');
          setPlannerName(`Planner ${executorData.planner_id.slice(0, 8)}`);
        } else {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
        generateContactRepresentatives(documentsData, assetsData || []);
      }

    } catch (error) {
      console.error('Error loading workflow data:', error);
    }
  };

  const generateContactRepresentatives = (docs: Document[], assetsList: Asset[]) => {
    const contactMap = new Map<string, ContactRepresentative>();

    // Process documents - group by email AND type
    docs.forEach(doc => {
      if (!doc.contact_email) return;
      
      const type = getContactType(doc.category, doc.contact_organization);
      const key = `${doc.contact_email}-${type}`;
      
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          id: key,
          name: doc.contact_name || 'Unknown Contact',
          organization: doc.contact_organization || '',
          email: doc.contact_email,
          phone: doc.contact_phone || '',
          type: type,
          documents: [],
          assets: [],
          status: 'not_contacted'
        });
      }
      
      contactMap.get(key)!.documents.push(doc);
    });

    // Process assets - group by email AND type
    assetsList.forEach(asset => {
      if (!asset.contact_email) return;
      
      const type = getContactType(asset.type, asset.contact_organization);
      const key = `${asset.contact_email}-${type}`;
      
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          id: key,
          name: asset.contact_name || 'Unknown Contact',
          organization: asset.contact_organization || '',
          email: asset.contact_email,
          phone: asset.contact_phone || '',
          type: type,
          documents: [],
          assets: [],
          status: 'not_contacted'
        });
      }
      
      contactMap.get(key)!.assets.push(asset);
    });

    setContactRepresentatives(Array.from(contactMap.values()));
  };

  const getContactType = (category: string, organization?: string) => {
    if (organization) {
      const orgLower = organization.toLowerCase();
      if (orgLower.includes('bank') || orgLower.includes('credit union')) return 'Bank';
      if (orgLower.includes('insurance')) return 'Insurance';
      if (orgLower.includes('investment') || orgLower.includes('brokerage')) return 'Investment';
      if (orgLower.includes('law') || orgLower.includes('attorney')) return 'Legal';
    }
    
    switch (category) {
      case 'financial': return 'Financial';
      case 'legal': return 'Legal';
      case 'health': return 'Medical';
      case 'personal': return 'Personal';
      default: return 'Other';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Bank':
        return <Building className="h-3 w-3" />;
      case 'Insurance':
        return <Shield className="h-3 w-3" />;
      case 'Investment':
        return <CreditCard className="h-3 w-3" />;
      case 'Legal':
        return <Scale className="h-3 w-3" />;
      case 'Medical':
        return <Heart className="h-3 w-3" />;
      case 'Financial':
        return <Briefcase className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
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

  const editEmail = (contact: ContactRepresentative) => {
    setSelectedContact(contact);
    const subject = generateEmailSubject(contact);
    const content = generateEmailContent(contact);
    setEditingEmail({ subject, content });
    setEditEmailModalOpen(true);
  };

  const generateEmailSubject = (contact: ContactRepresentative) => {
    const itemCount = contact.documents.length + contact.assets.length;
    const firstItem = contact.documents[0]?.name || contact.assets[0]?.name || 'Account';
    
    if (itemCount === 1) {
      return `Notification of Passing - ${firstItem} (${contact.type})`;
    } else {
      return `Notification of Passing - ${contact.type} Accounts (${itemCount} items)`;
    }
  };

  const generateEmailContent = (contact: ContactRepresentative) => {
    const contactName = contact.name || 'Representative';
    const organization = contact.organization ? ` at ${contact.organization}` : '';
    
    let content = `Dear ${contactName},\n\n`;
    content += `I am writing to inform you of the passing of ${plannerName}, who held `;
    
    const totalItems = contact.documents.length + contact.assets.length;
    if (totalItems === 1) {
      const item = contact.documents[0] || contact.assets[0];
      content += `${item.name} with your organization`;
    } else {
      content += `${contact.type.toLowerCase()} accounts and documents with your organization`;
    }
    
    content += `.\n\nAs the designated executor of their estate, I need to notify you of this passing and request information about the following ${contact.type.toLowerCase()} matters:\n\n`;
    
    let itemIndex = 1;
    
    // List documents
    contact.documents.forEach((doc) => {
      content += `${itemIndex}. ${doc.name}`;
      if (doc.description) {
        content += ` - ${doc.description}`;
      }
      content += ` (Document)\n`;
      itemIndex++;
    });
    
    // List assets
    contact.assets.forEach((asset) => {
      content += `${itemIndex}. ${asset.name}`;
      if (asset.description) {
        content += ` - ${asset.description}`;
      }
      content += ` (${asset.type} asset)\n`;
      itemIndex++;
    });
    
    content += `\nPlease let me know what documentation you require to proceed with the necessary account closures, transfers, or other required actions related to these ${contact.type.toLowerCase()} matters. I can provide a certified copy of the death certificate and any other documentation you may need.\n\n`;
    content += `I would appreciate your guidance on the next steps and any forms that need to be completed for these ${contact.type.toLowerCase()} accounts.\n\n`;
    content += `Thank you for your assistance during this difficult time.\n\n`;
    content += `Sincerely,\n[Your Name]\nExecutor of the Estate`;
    
    return content;
  };

  const saveEmailChanges = () => {
    if (!selectedContact) return;

    setEditEmailModalOpen(false);
    setSelectedContact(null);

    toast({
      title: "Success",
      description: "Email updated successfully",
    });
  };

  const sendEmail = async (contact: ContactRepresentative) => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables in the .env file.",
        variant: "destructive"
      });
      return;
    }

    try {
      const subject = generateEmailSubject(contact);
      const content = generateEmailContent(contact);

      // Use the generic send-email function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.email,
          subject: subject,
          text: content
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
      setContactRepresentatives(prev => 
        prev.map(c => 
          c.id === contact.id ? { ...c, status: 'sent' } : c
        )
      );

      toast({
        title: "Email Sent ✅",
        description: `${contact.type} notification sent to ${contact.name} at ${contact.email}`,
      });

    } catch (error) {
      console.error('Error sending email:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to email service. Please verify your Supabase configuration and ensure the send-email Edge Function is deployed.';
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
      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="font-medium text-amber-800">Configuration Required</h3>
                <p className="text-sm text-amber-700">
                  Supabase environment variables are not properly configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                Contact all representatives and organizations that need to be notified of the passing. Each responsibility type will receive a separate, focused notification.
              </div>
              
              {contactRepresentatives.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Name</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Type</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Contact</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Items</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Action</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactRepresentatives.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{contact.name}</div>
                              {contact.organization && (
                                <div className="text-sm text-gray-500">{contact.organization}</div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getTypeIcon(contact.type)}
                              {contact.type}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-gray-900">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-1 text-gray-500 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {contact.documents.length + contact.assets.length} item{contact.documents.length + contact.assets.length !== 1 ? 's' : ''}
                              </div>
                              <div className="text-gray-500">
                                {contact.documents.length > 0 && `${contact.documents.length} doc${contact.documents.length !== 1 ? 's' : ''}`}
                                {contact.documents.length > 0 && contact.assets.length > 0 && ', '}
                                {contact.assets.length > 0 && `${contact.assets.length} asset${contact.assets.length !== 1 ? 's' : ''}`}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => editEmail(contact)}
                                disabled={contact.status === 'sent'}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              {contact.status === 'not_contacted' ? (
                                <Button 
                                  size="sm" 
                                  onClick={() => sendEmail(contact)}
                                  disabled={!isSupabaseConfigured()}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Contact
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Sent
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            {contact.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3" />
                                Sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Mail className="h-3 w-3" />
                                Not Contacted
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Information</h3>
                  <p className="text-gray-500">
                    No contact information found for documents or assets. Please ensure contact details are added to documents and assets.
                  </p>
                </div>
              )}
              
              {contactRepresentatives.every(c => c.status === 'sent') && contactRepresentatives.length > 0 && (
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

      {/* Email Preview Modal */}
      <Dialog open={editEmailModalOpen} onOpenChange={setEditEmailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedContact?.type} Email Preview - {selectedContact?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To:</label>
              <div className="text-sm text-gray-600">{selectedContact?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject:</label>
              <Input
                value={editingEmail.subject}
                onChange={(e) => setEditingEmail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message:</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[400px] font-mono text-sm"
                value={editingEmail.content}
                onChange={(e) => setEditingEmail(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Email content"
              />
            </div>
            
            {selectedContact && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{selectedContact.type} items to be mentioned:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  {selectedContact.documents.map((doc, index) => (
                    <div key={index}>• {doc.name} (Document - {doc.category})</div>
                  ))}
                  {selectedContact.assets.map((asset, index) => (
                    <div key={index}>• {asset.name} (Asset - {asset.type})</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailModalOpen(false)}>
              Close
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