import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { AddAssetModal } from '../components/modals/AddAssetModal';
import { EditAssetModal } from '../components/modals/EditAssetModal';
import { toast } from '../components/ui/toast';

interface Asset {
  id: string;
  type: 'financial' | 'physical' | 'digital';
  name: string;
  description: string | null;
  location: string | null;
  account_number: string | null;
  access_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_organization: string | null;
  created_at: string;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching assets');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });

      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive"
      });
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="h-5 w-5" />
          Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{asset.type}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEdit(asset)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-600"
                  onClick={() => handleDelete(asset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {asset.description && (
              <p className="text-gray-600 text-sm mb-3">{asset.description}</p>
            )}
            
            {asset.location && (
              <div className="text-sm mb-2">
                <span className="font-medium">Location:</span> {asset.location}
              </div>
            )}
            
            {asset.account_number && (
              <div className="text-sm mb-2">
                <span className="font-medium">Account Number:</span> {asset.account_number}
              </div>
            )}

            {asset.contact_name && (
              <div className="text-sm mb-2">
                <span className="font-medium">Contact:</span> {asset.contact_name}
                {asset.contact_organization && ` (${asset.contact_organization})`}
              </div>
            )}
            
            <div className="text-xs text-gray-400 mt-4">
              Added {new Date(asset.created_at).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {assets.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No assets added yet</p>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Add Your First Asset
          </Button>
        </Card>
      )}

      <AddAssetModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchAssets}
      />

      <EditAssetModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchAssets}
        asset={selectedAsset}
      />
    </div>
  );
}