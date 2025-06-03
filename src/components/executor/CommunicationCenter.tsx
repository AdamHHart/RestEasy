import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, Phone, Users, Copy, CheckCheck } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  usage: string;
}

export default function CommunicationCenter() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  const templates: MessageTemplate[] = [
    {
      id: '1',
      title: 'Initial Notification',
      content: `Dear [Name],

I am writing to inform you that I am serving as the executor of [Deceased's Name]'s estate. As part of this process, I need to [Action Required].

Could you please provide the following information:
- [Required Item 1]
- [Required Item 2]

Thank you for your assistance in this matter.

Best regards,
[Your Name]`,
      usage: 'Use this template when first contacting institutions or individuals regarding estate matters.'
    },
    {
      id: '2',
      title: 'Document Request',
      content: `Dear [Name],

In my capacity as executor of [Deceased's Name]'s estate, I am requesting copies of the following documents:

- [Document 1]
- [Document 2]

Please let me know if you need any additional information from me to process this request.

Thank you for your help.

Best regards,
[Your Name]`,
      usage: 'Use when requesting specific documents from institutions.'
    }
  ];

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'John Smith',
      role: 'Attorney',
      email: 'john@lawfirm.com',
      phone: '555-0123'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Financial Advisor',
      email: 'sarah@finance.com',
      phone: '555-0124'
    }
  ];

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-calm-500" />
              Key Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map(contact => (
              <div key={contact.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.location.href = `mailto:${contact.email}`}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {contact.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = `tel:${contact.phone}`}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{contact.email}</p>
                  {contact.phone && <p>{contact.phone}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-calm-500" />
              Message Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{template.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyTemplate(template.content);
                    }}
                  >
                    {copied ? (
                      <CheckCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">{template.usage}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono bg-gray-50 p-4 rounded-lg">
                {selectedTemplate.content}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}