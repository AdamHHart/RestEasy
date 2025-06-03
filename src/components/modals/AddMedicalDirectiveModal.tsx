import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddMedicalDirectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMedicalDirectiveModal({ open, onOpenChange, onSuccess }: AddMedicalDirectiveModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    healthcare_wishes: '',
    organ_donation_preference: 'no',
    organ_donation_details: '',
    resuscitation_preference: 'full_code',
    resuscitation_details: '',
    life_support_preference: 'all_measures',
    life_support_details: '',
    emergency_contacts: [] as Array<{
      name: string;
      relationship: string;
      phone: string;
      email: string;
    }>,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('medical_directives').insert([
        {
          user_id: user?.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding medical directive:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergency_contacts: [
        ...formData.emergency_contacts,
        { name: '', relationship: '', phone: '', email: '' },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medical Directives</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Healthcare Wishes</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
              required
              value={formData.healthcare_wishes}
              onChange={(e) => setFormData({ ...formData, healthcare_wishes: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Organ Donation Preference</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.organ_donation_preference}
              onChange={(e) => setFormData({ ...formData, organ_donation_preference: e.target.value })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="specific_organs">Specific Organs</option>
            </select>
          </div>
          
          {formData.organ_donation_preference === 'specific_organs' && (
            <div>
              <label className="block text-sm font-medium mb-1">Organ Donation Details</label>
              <Input
                value={formData.organ_donation_details}
                onChange={(e) => setFormData({ ...formData, organ_donation_details: e.target.value })}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Resuscitation Preference</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.resuscitation_preference}
              onChange={(e) => setFormData({ ...formData, resuscitation_preference: e.target.value })}
            >
              <option value="full_code">Full Code</option>
              <option value="dnr">Do Not Resuscitate</option>
              <option value="specific_conditions">Specific Conditions</option>
            </select>
          </div>
          
          {formData.resuscitation_preference === 'specific_conditions' && (
            <div>
              <label className="block text-sm font-medium mb-1">Resuscitation Details</label>
              <Input
                value={formData.resuscitation_details}
                onChange={(e) => setFormData({ ...formData, resuscitation_details: e.target.value })}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Life Support Preference</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.life_support_preference}
              onChange={(e) => setFormData({ ...formData, life_support_preference: e.target.value })}
            >
              <option value="all_measures">All Measures</option>
              <option value="limited">Limited Intervention</option>
              <option value="comfort_only">Comfort Care Only</option>
            </select>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Emergency Contacts</label>
              <Button type="button" variant="outline" onClick={addEmergencyContact}>
                Add Contact
              </Button>
            </div>
            
            {formData.emergency_contacts.map((contact, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-md mb-4">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => {
                    const newContacts = [...formData.emergency_contacts];
                    newContacts[index].name = e.target.value;
                    setFormData({ ...formData, emergency_contacts: newContacts });
                  }}
                />
                <Input
                  placeholder="Relationship"
                  value={contact.relationship}
                  onChange={(e) => {
                    const newContacts = [...formData.emergency_contacts];
                    newContacts[index].relationship = e.target.value;
                    setFormData({ ...formData, emergency_contacts: newContacts });
                  }}
                />
                <Input
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => {
                    const newContacts = [...formData.emergency_contacts];
                    newContacts[index].phone = e.target.value;
                    setFormData({ ...formData, emergency_contacts: newContacts });
                  }}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => {
                    const newContacts = [...formData.emergency_contacts];
                    newContacts[index].email = e.target.value;
                    setFormData({ ...formData, emergency_contacts: newContacts });
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newContacts = formData.emergency_contacts.filter((_, i) => i !== index);
                    setFormData({ ...formData, emergency_contacts: newContacts });
                  }}
                >
                  Remove Contact
                </Button>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Directives'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}