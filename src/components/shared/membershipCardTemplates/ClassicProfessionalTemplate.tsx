import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { format } from 'date-fns';
import { type CardTemplateProps } from '@/types/membershipCardTemplates';

export function ClassicProfessionalTemplate({ member, organization }: CardTemplateProps) {
  const formatGender = (gender?: string | null) => {
    if (!gender) return 'N/A';
    return gender.toLowerCase() === 'male'
      ? 'M'
      : gender.toLowerCase() === 'female'
      ? 'F'
      : gender.charAt(0).toUpperCase();
  };

  const issueDate = member.date_joined
    ? format(new Date(member.date_joined), 'MMM yyyy')
    : format(new Date(), 'MMM yyyy');

  // Always use light theme colors for consistent printing
  const brandColors = organization.brand_colors;
  const colorScheme = brandColors?.light;
  
  const primaryColor = colorScheme?.primary || '#1e40af';
  const primaryTextColor = colorScheme?.primaryForeground || '#ffffff';
  const secondaryColor = colorScheme?.secondary || '#64748b';

  return (
    <div className="w-[400px] h-[250px] bg-white rounded-lg shadow-lg border-2 relative overflow-hidden"
         style={{ borderColor: primaryColor }}>
      
      {/* Header Section */}
      <div 
        className="h-16 flex items-center justify-center relative"
        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
      >
        <div className="flex items-center space-x-3">
          <OrganizationLogo
            src={organization.logo}
            fallback={organization.name?.charAt(0) || 'C'}
            size="sm"
            className="rounded-full border-2 border-white"
          />
          <div>
            <p className="font-semibold max-w-[320px] leading-5">
              {organization.name || 'ChurchHub360'}
            </p>
            <p className="text-xs font-medium tracking-wider opacity-90">
              MEMBERSHIP CARD
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex gap-4">
        {/* Left Side - Profile Image */}
        <div className="flex flex-col items-center">
          <Avatar className="w-20 h-20 rounded-lg" style={{ borderColor: secondaryColor }}>
            <AvatarImage
              src={member.profile_image_url || ''}
              alt={`${member.first_name} ${member.last_name}`}
              className="object-cover"
            />
            <AvatarFallback 
              className="text-xl font-bold rounded-lg"
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              {member.first_name[0]}
              {member.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="mt-2 text-center">
            <p className="text-xs font-medium" style={{ color: primaryColor }}>
              ID: {member.membership_id}
            </p>
          </div>
        </div>

        {/* Right Side - Member Information */}
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-xl font-bold text-gray-900 leading-tight">
              {member.first_name} {member.last_name}
            </h4>
          </div>

          {member.email && (
              <div className='flex gap-1 items-center'>
                <span className="text-gray-600 font-medium text-sm">Email:</span>
                <p className="text-gray-900 text-sm">{member.email}</p>
              </div>
            )}

          <div className="grid grid-cols-2 gap-2 text-sm">
           
            {member.date_of_birth && (
              <div>
                <span className="text-gray-600 font-medium text-sm">DOB:</span>
                <p className="text-gray-900 text-xs">
                  {format(new Date(member.date_of_birth), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            
            <div>
              <span className="text-gray-600 font-medium text-sm">Gender:</span>
              <p className="text-gray-900 text-xs">{formatGender(member.gender)}</p>
            </div>
            
            <div>
              <span className="text-gray-600 font-medium">Issued:</span>
              <p className="text-gray-900 text-xs">{issueDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: primaryColor }}
      />
    </div>
  );
}