import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  HeartHandshake, 
  FileText, 
  Mail, 
  Edit, 
  Trash2, 
  PlusCircle,
  AlertCircle,
  Check,
  X,
  Scale
} from 'lucide-react';
import { AddMedicalDirectiveModal } from '../components/modals/AddMedicalDirectiveModal';
import { AddFuneralPreferenceModal } from '../components/modals/AddFuneralPreferenceModal';
import { AddMessageModal } from '../components/modals/AddMessageModal';
import { AddWillModal } from '../components/modals/AddWillModal';

interface MedicalDirective {
  id: string;
  healthcare_wishes: string;
  organ_donation_preference: 'yes' | 'no' | 'specific_organs';
  resuscitation_preference: 'full_code' | 'dnr' | 'specific_conditions';
  life_support_preference: 'all_measures' | 'limited' | 'comfort_only';
  emergency_contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }>;
}

interface FuneralPreference {
  id: string;
  service_type: 'traditional' | 'celebration_of_life' | 'memorial' | 'private' | 'other';
  disposition_method: 'burial' | 'cremation' | 'green_burial' | 'donation' | 'other';
  location_preference: string;
  music_preferences: string[];
  readings_preferences: string[];
  other_wishes: string;
}

interface PersonalMessage {
  id: string;
  recipient_name: string;
  recipient_email: string;
  relationship: string;
  subject: string;
  content: string;
  draft: boolean;
}

interface Will {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function WishesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'will' | 'medical' | 'funeral' | 'messages'>('will');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [will, setWill] = useState<Will | null>(null);
  const [medicalDirectives, setMedicalDirectives] = useState<MedicalDirective | null>(null);
  const [funeralPreferences, setFuneralPreferences] = useState<FuneralPreference | null>(null);
  const [personalMessages, setPersonalMessages] = useState<PersonalMessage[]>([]);

  const [isWillModalOpen, setIsWillModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isFuneralModalOpen, setIsFuneralModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'will':
          const { data: willData, error: willError } = await supabase
            .from('wishes')
            .select('*')
            .eq('user_id', user?.id)
            .eq('type', 'will')
            .limit(1);
          
          if (willError) throw willError;
          setWill(willData?.[0] || null);
          break;

        case 'medical':
          const { data: medicalData, error: medicalError } = await supabase
            .from('medical_directives')
            .select('*')
            .eq('user_id', user?.id)
            .limit(1);
          
          if (medicalError) throw medicalError;
          setMedicalDirectives(medicalData?.[0] || null);
          break;

        case 'funeral':
          const { data: funeralData, error: funeralError } = await supabase
            .from('funeral_preferences')
            .select('*')
            .eq('user_id', user?.id)
            .limit(1);
          
          if (funeralError) throw funeralError;
          setFuneralPreferences(funeralData?.[0] || null);
          break;

        case 'messages':
          const { data: messagesData, error: messagesError } = await supabase
            .from('personal_messages')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });
          
          if (messagesError) throw messagesError;
          setPersonalMessages(messagesData || []);
          break;
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = () => {
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wishes & Directives</h1>
          <p className="text-gray-500 mt-1">Document your preferences and messages for loved ones</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === 'will' ? 'default' : 'outline'}
            onClick={() => setActiveTab('will')}
            className="flex items-center gap-2"
          >
            <Scale className="h-4 w-4" />
            Will
          </Button>
          <Button
            variant={activeTab === 'medical' ? 'default' : 'outline'}
            onClick={() => setActiveTab('medical')}
            className="flex items-center gap-2"
          >
            <HeartHandshake className="h-4 w-4" />
            Medical
          </Button>
          <Button
            variant={activeTab === 'funeral' ? 'default' : 'outline'}
            onClick={() => setActiveTab('funeral')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Funeral
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'default' : 'outline'}
            onClick={() => setActiveTab('messages')}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Messages
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 text-red-600 py-4">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400" />
        </div>
      ) : (
        <>
          {activeTab === 'will' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Last Will and Testament</CardTitle>
                  <CardDescription>
                    Your legal will document outlining asset distribution and final wishes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {will ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <h3 className="font-medium text-green-900">Will Documented</h3>
                        </div>
                        <p className="text-sm text-green-800">
                          Your will has been saved and will be presented to your executor when needed.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Document Title</h3>
                        <p className="text-gray-600">{will.title}</p>
                      </div>

                      {will.content && will.content !== 'Will document uploaded' && (
                        <div>
                          <h3 className="font-medium mb-2">Will Content Preview</h3>
                          <div className="p-4 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                            <p className="text-gray-600 whitespace-pre-wrap text-sm">
                              {will.content.substring(0, 500)}
                              {will.content.length > 500 && '...'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Created {new Date(will.created_at).toLocaleDateString()}
                      </div>

                      <Button className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Update Will
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No will documented yet</p>
                      <p className="text-sm text-gray-400 mb-6">
                        Your will is one of the most important documents for your executor. 
                        It provides clear instructions on how to distribute your assets.
                      </p>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsWillModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Your Will
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Directives</CardTitle>
                  <CardDescription>
                    Document your healthcare wishes and emergency contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalDirectives ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Healthcare Wishes</h3>
                        <p className="text-gray-600">{medicalDirectives.healthcare_wishes}</p>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">Organ Donation</p>
                            <p className="text-gray-600 capitalize">
                              {medicalDirectives.organ_donation_preference.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">Resuscitation</p>
                            <p className="text-gray-600 capitalize">
                              {medicalDirectives.resuscitation_preference.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">Life Support</p>
                            <p className="text-gray-600 capitalize">
                              {medicalDirectives.life_support_preference.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Emergency Contacts</h3>
                        <div className="space-y-3">
                          {medicalDirectives.emergency_contacts.map((contact, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{contact.name}</p>
                                  <p className="text-gray-500">{contact.relationship}</p>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <p>{contact.phone}</p>
                                  <p>{contact.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Update Directives
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No medical directives documented yet</p>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsMedicalModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Medical Directives
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'funeral' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Funeral & Memorial Preferences</CardTitle>
                  <CardDescription>
                    Document your wishes for final arrangements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {funeralPreferences ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium mb-2">Service Preferences</h3>
                          <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium">Service Type</p>
                              <p className="text-gray-600 capitalize">
                                {funeralPreferences.service_type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium">Disposition Method</p>
                              <p className="text-gray-600 capitalize">
                                {funeralPreferences.disposition_method.replace('_', ' ')}
                              </p>
                            </div>
                            {funeralPreferences.location_preference && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium">Location Preference</p>
                                <p className="text-gray-600">{funeralPreferences.location_preference}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Music & Readings</h3>
                          <div className="space-y-3">
                            {funeralPreferences.music_preferences.length > 0 && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium">Music Selections</p>
                                <ul className="list-disc list-inside text-gray-600">
                                  {funeralPreferences.music_preferences.map((song, index) => (
                                    <li key={index}>{song}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {funeralPreferences.readings_preferences.length > 0 && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium">Readings</p>
                                <ul className="list-disc list-inside text-gray-600">
                                  {funeralPreferences.readings_preferences.map((reading, index) => (
                                    <li key={index}>{reading}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {funeralPreferences.other_wishes && (
                        <div>
                          <h3 className="font-medium mb-2">Additional Wishes</h3>
                          <p className="text-gray-600">{funeralPreferences.other_wishes}</p>
                        </div>
                      )}

                      <Button className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Update Preferences
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No funeral preferences documented yet</p>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsFuneralModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Funeral Preferences
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setIsMessageModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Message
                </Button>
              </div>

              {personalMessages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personalMessages.map((message) => (
                    <Card key={message.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">{message.subject}</h3>
                            <p className="text-sm text-gray-500">To: {message.recipient_name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {message.draft ? (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                Draft
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Ready
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {message.content}
                        </p>

                        <div className="flex justify-between items-center">
                          <Button variant="outline" size="sm">
                            Preview
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 mb-4">No personal messages created yet</p>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => setIsMessageModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Your First Message
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      <AddWillModal
        open={isWillModalOpen}
        onOpenChange={setIsWillModalOpen}
        onSuccess={handleSuccess}
      />

      <AddMedicalDirectiveModal
        open={isMedicalModalOpen}
        onOpenChange={setIsMedicalModalOpen}
        onSuccess={handleSuccess}
      />

      <AddFuneralPreferenceModal
        open={isFuneralModalOpen}
        onOpenChange={setIsFuneralModalOpen}
        onSuccess={handleSuccess}
      />

      <AddMessageModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}