import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAsset } from '@/hooks/assets/useAssets';
import { useMemberDetails } from '@/hooks/useMemberSearch';
import { useGroup } from '@/hooks/useGroups';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AssetDetail() {
  const { assetId = '' } = useParams();
  const { data } = useAsset(assetId);
  const navigate = useNavigate();

  const memberIds = data?.assigned_to_member_id
    ? [data.assigned_to_member_id]
    : [];
  const { data: memberDetails } = useMemberDetails(memberIds);
  const { data: groupDetails } = useGroup(data?.assigned_to_group_id || null);

  if (!data) {
    return (
      <div className="p-2 sm:p-4">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Asset Details</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/assets')}>
            Back to Assets
          </Button>
          <Button onClick={() => navigate(`/assets/${assetId}/edit`)}>
            Edit
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-medium">{data.name}</span>
          {data.status && <Badge variant="secondary">{data.status}</Badge>}
          {data.category && <Badge variant="outline">{data.category}</Badge>}
        </div>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Location</TableCell>
              <TableCell>{data.location || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Purchase Date</TableCell>
              <TableCell>{data.purchase_date || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Assigned To</TableCell>
              <TableCell>
                {data.assigned_to_type === 'member' &&
                data.assigned_to_member_id &&
                memberDetails &&
                memberDetails[0] ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={memberDetails[0].profile_image_url || ''}
                      />
                      <AvatarFallback>
                        {memberDetails[0].full_name ||
                          `${memberDetails[0].first_name} ${memberDetails[0].last_name}`.trim()}
                      </AvatarFallback>
                    </Avatar>
                    {memberDetails[0].full_name ||
                      `${memberDetails[0].first_name} ${memberDetails[0].last_name}`.trim()}
                    {memberDetails[0].membership_id
                      ? ` • ${memberDetails[0].membership_id}`
                      : ''}

                    {memberDetails[0].phone
                      ? ` • ${memberDetails[0].phone}`
                      : ''}
                  </span>
                ) : data.assigned_to_type === 'group' &&
                  data.assigned_to_group_id &&
                  groupDetails ? (
                  <span>{groupDetails.name}</span>
                ) : (
                  <span>-</span>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Description</TableCell>
              <TableCell>{data.description || '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {data.images && data.images.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Images</span>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {data.images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="asset"
                  className="w-full h-24 object-cover rounded-md"
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
