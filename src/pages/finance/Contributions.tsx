import { Heart } from 'lucide-react';

export function Contributions() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Contributions Management
      </h2>
      <p className="text-muted-foreground">
        This page will contain donation tracking, tithe management, 
        and contribution reporting features. Implementation coming soon.
      </p>
    </div>
  );
}