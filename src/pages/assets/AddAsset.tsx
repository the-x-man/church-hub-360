import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AssetForm from '@/components/assets/AssetForm';
import { useCreateAsset } from '@/hooks/assets/useAssets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AddAsset() {
  const create = useCreateAsset();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const res = await create.mutateAsync(values);
      toast.success('Asset created');
      navigate(`/assets/${res.id}`);
    } catch (e) {
      toast.error('Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Add Asset</h2>
        <Button variant="outline" onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
      <Card className="p-3 sm:p-4">
        <AssetForm onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
