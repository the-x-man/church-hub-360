import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { format } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationLogo } from '@/components/shared/OrganizationLogo';

interface MemberData {
  first_name: string;
  last_name: string;
  email?: string | null;
  membership_id: string;
  date_of_birth?: string | null;
  gender?: string | null;
  profile_image_url?: string | null;
  date_joined?: string | null;
}

interface MembershipCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberData;
}

export function MembershipCardModal({
  isOpen,
  onClose,
  member,
}: MembershipCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { currentOrganization } = useOrganization();

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Membership Card - ${member.first_name} ${member.last_name}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  });

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;

      // Create a comprehensive style replacement for oklch and other modern color functions
      const createCompatibleStyles = (clonedDoc: Document) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          /* Override all potential oklch colors with compatible equivalents */
          * {
            /* Reset any oklch colors to safe defaults */
            color: inherit !important;
            background-color: inherit !important;
            border-color: inherit !important;
          }
          
          /* Card container with explicit gradient */
          .bg-gradient-to-br {
            background: linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #1e40af 100%) !important;
            color: #ffffff !important;
          }
          
          /* Text colors */
          .text-white, .text-white * {
            color: #ffffff !important;
          }
          
          /* Background colors */
          .bg-white\\/20 {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          /* Border colors */
          .border-white {
            border-color: #ffffff !important;
          }
          .border-white\\/30 {
            border-color: rgba(255, 255, 255, 0.3) !important;
          }
          
          /* Opacity classes */
          .opacity-10 { opacity: 0.1 !important; }
          .opacity-75 { opacity: 0.75 !important; }
          .opacity-90 { opacity: 0.9 !important; }
          
          /* Ensure rounded corners work */
          .rounded-xl { border-radius: 0.75rem !important; }
          .rounded-full { border-radius: 9999px !important; }
          
          /* Font weights and sizes */
          .font-bold { font-weight: 700 !important; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important; }
          .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
          .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
          .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
          
          /* Layout */
          .leading-tight { line-height: 1.25 !important; }
          .truncate { 
            overflow: hidden !important; 
            text-overflow: ellipsis !important; 
            white-space: nowrap !important; 
          }
          .max-w-\\[180px\\] { max-width: 180px !important; }
          .block { display: block !important; }
        `;
        clonedDoc.head.appendChild(style);
      };

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false, // Disable to avoid SVG issues
        logging: false, // Disable logging to reduce console noise
        onclone: createCompatibleStyles,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `membership-card-${member.first_name}-${member.last_name}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      // Show success message
      import('sonner').then(({ toast }) => {
        toast.success('Membership card saved successfully!');
      });
    } catch (error) {
      console.error('Primary save method failed:', error);

      // Fallback: Try with minimal configuration and DOM manipulation
      try {
        const html2canvas = (await import('html2canvas')).default;

        // Temporarily replace problematic styles in the actual DOM
        const originalStyles = new Map<Element, string>();
        const elementsToFix = cardRef.current!.querySelectorAll('*');

        elementsToFix.forEach((el: Element) => {
          const computedStyle = window.getComputedStyle(el);
          const element = el as HTMLElement;

          // Check for oklch in various properties
          ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
            const value = (computedStyle as any)[prop];
            if (value && value.includes('oklch(')) {
              if (!originalStyles.has(element)) {
                originalStyles.set(element, element.style.cssText);
              }
              // Set safe fallback colors
              if (prop === 'color') element.style.color = '#ffffff';
              if (prop === 'backgroundColor')
                element.style.backgroundColor = 'transparent';
              if (prop === 'borderColor') element.style.borderColor = '#ffffff';
            }
          });
        });

        // Render with cleaned DOM
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#ffffff',
          scale: 1,
          logging: false,
          useCORS: false,
          allowTaint: false,
        });

        // Restore original styles
        originalStyles.forEach((cssText, element) => {
          (element as HTMLElement).style.cssText = cssText;
        });

        const link = document.createElement('a');
        link.download = `membership-card-${member.first_name}-${member.last_name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        import('sonner').then(({ toast }) => {
          toast.success('Membership card saved successfully!');
        });
      } catch (fallbackError) {
        console.error('All save methods failed:', fallbackError);
        import('sonner').then(({ toast }) => {
          toast.error(
            'Unable to save image. This may be due to browser compatibility issues. Please try printing instead.'
          );
        });
      }
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Membership Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 border-2 rounded-md px-2 py-4">
          {/* Card Preview */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className="w-[400px] h-[250px] bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl shadow-lg p-4 text-white relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-center mb-6 space-x-2">
                  {/* Organization Logo */}
                  <OrganizationLogo
                    src={currentOrganization?.logo}
                    fallback={currentOrganization?.name?.charAt(0) || 'C'}
                    size="xs"
                    className="flex-shrink-0 shadow-lg rounded-full"
                  />

                  {/* Organization Name and Card Type */}
                  <div>
                    <h3 className="text-md font-bold leading-tight mb-1">
                      {currentOrganization?.name || 'ChurchHub360'}
                    </h3>
                    <p className="text-sm opacity-90 font-semibold tracking-widest">
                      MEMBERSHIP CARD
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex justify-between gap-4">
                  {/* Left Side -  Profile Image */}
                  <div className="ml-2">
                    <Avatar className="w-20 h-20 border-2 border-white/30 rounded-xl">
                      <AvatarImage
                        src={member.profile_image_url || ''}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                        {member.first_name[0]}
                        {member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Right Side - Member Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-lg font-bold leading-tight">
                        {member.first_name} {member.last_name}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="opacity-75">ID:</span>{' '}
                        <span className="font-mono">
                          {member.membership_id}
                        </span>
                      </div>
                      {member.email && (
                        <div>
                          <span className="opacity-75">Email:</span>{' '}
                          <span className="truncate block max-w-[180px]">
                            {member.email}
                          </span>
                        </div>
                      )}
                      {member.date_of_birth && (
                        <div>
                          <span className="opacity-75">DOB:</span>{' '}
                          <span>
                            {format(
                              new Date(member.date_of_birth),
                              'MMM d, yyyy'
                            )}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="opacity-75">Gender:</span>{' '}
                        <span>{formatGender(member.gender)}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Issued:</span>{' '}
                        <span>{issueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Card
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save as Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
