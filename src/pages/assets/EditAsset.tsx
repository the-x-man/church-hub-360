import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AssetForm from '@/components/assets/AssetForm';
import { useAsset, useUpdateAsset } from '@/hooks/assets/useAssets';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function EditAsset() {
  const { assetId = '' } = useParams();
  const { data } = useAsset(assetId);
  const update = useUpdateAsset();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      await update.mutateAsync({ id: assetId, updates: values });
      toast.success('Asset updated');
      navigate(`/assets/${assetId}`);
    } catch (e) {
      toast.error('Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Asset</h2>
        <Button variant="outline" onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
      <Card className="p-3 sm:p-4">
        {data ? (
          <AssetForm initialValues={data} onSubmit={handleSubmit} submitting={submitting} />
        ) : (
          <div>Loading...</div>
        )}
      </Card>
    </div>
  );
}
