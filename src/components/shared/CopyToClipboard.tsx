import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CopyToClipboardProps {
  text: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'default' | 'destructive' | 'secondary';
  className?: string;
  showToast?: boolean;
}

export function CopyToClipboard({ 
  text, 
  label, 
  size = 'sm', 
  variant = 'ghost',
  className = '',
  showToast = false
}: CopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      if (showToast) {
        toast.success(`${label || 'Text'} copied to clipboard`);
      }
      
      // Reset the icon after 1 second
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      if (showToast) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-5 w-5 p-0' : size === 'lg' ? 'h-8 w-8 p-0' : 'h-6 w-6 p-0';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`${buttonSize} ${className} transition-colors duration-200`}
      title={`Copy ${label || 'text'} to clipboard`}
    >
      {isCopied ? (
        <Check className={`${iconSize} text-green-600 transition-all duration-200`} />
      ) : (
        <Copy className={`${iconSize} transition-all duration-200`} />
      )}
    </Button>
  );
}