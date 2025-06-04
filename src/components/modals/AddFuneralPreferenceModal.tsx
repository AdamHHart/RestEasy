import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddFuneralPreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFuneralPreferenceModal({ open, onOpenChange, onSuccess }: AddFuneralPreferenceModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_type: 'traditional',
    disposition_method: 'burial',
    location_preference: '',
    music_preferences: [] as string[],
    readings_preferences: [] as string[],
    flowers_preference: 'yes',
    flowers_details: '',
    other_wishes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('funeral_preferences').insert([
        {
          user_id: user?.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding funeral preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMusicPreference = () => {
    setFormData({
      ...formData,
      music_preferences: [...formData.music_preferences, ''],
    });
  };

  const addReadingPreference = () => {
    setFormData({
      ...formData,
      readings_preferences: [...formData.readings_preferences, ''],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Funeral Preferences</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            >
              <option value="traditional">Traditional Service</option>
              <option value="celebration_of_life">Celebration of Life</option>
              <option value="memorial">Memorial Service</option>
              <option value="private">Private Service</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Disposition Method</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.disposition_method}
              onChange={(e) => setFormData({ ...formData, disposition_method: e.target.value })}
            >
              <option value="burial">Burial</option>
              <option value="cremation">Cremation</option>
              <option value="green_burial">Green Burial</option>
              <option value="donation">Body Donation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location Preference</label>
            <Input
              value={formData.location_preference}
              onChange={(e) => setFormData({ ...formData, location_preference: e.target.value })}
              placeholder="Preferred location for service"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Music Selections</label>
              <Button type="button" variant="outline" onClick={addMusicPreference}>
                Add Music
              </Button>
            </div>
            {formData.music_preferences.map((music, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={music}
                  onChange={(e) => {
                    const newMusic = [...formData.music_preferences];
                    newMusic[index] = e.target.value;
                    setFormData({ ...formData, music_preferences: newMusic });
                  }}
                  placeholder="Song or type of music"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newMusic = formData.music_preferences.filter((_, i) => i !== index);
                    setFormData({ ...formData, music_preferences: newMusic });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Readings</label>
              <Button type="button" variant="outline" onClick={addReadingPreference}>
                Add Reading
              </Button>
            </div>
            {formData.readings_preferences.map((reading, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={reading}
                  onChange={(e) => {
                    const newReadings = [...formData.readings_preferences];
                    newReadings[index] = e.target.value;
                    setFormData({ ...formData, readings_preferences: newReadings });
                  }}
                  placeholder="Reading or poem"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newReadings = formData.readings_preferences.filter((_, i) => i !== index);
                    setFormData({ ...formData, readings_preferences: newReadings });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Flowers Preference</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.flowers_preference}
              onChange={(e) => setFormData({ ...formData, flowers_preference: e.target.value })}
            >
              <option value="yes">Yes, I would like flowers</option>
              <option value="no">No flowers, please</option>
              <option value="specific">Specific flowers only</option>
            </select>
          </div>

          {formData.flowers_preference === 'specific' && (
            <div>
              <label className="block text-sm font-medium mb-1">Flower Details</label>
              <Input
                value={formData.flowers_details}
                onChange={(e) => setFormData({ ...formData, flowers_details: e.target.value })}
                placeholder="Specify flower preferences"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Additional Wishes</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
              value={formData.other_wishes}
              onChange={(e) => setFormData({ ...formData, other_wishes: e.target.value })}
              placeholder="Any other specific wishes or requests"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}