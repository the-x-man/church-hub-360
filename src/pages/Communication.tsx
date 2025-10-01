import { MessageSquare } from 'lucide-react';

export function Communication() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Communication & Engagement</h1>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Communication & Engagement
        </h2>
        <p className="text-muted-foreground">
          This page will contain tools for church communication, messaging, newsletters, 
          and member engagement features. Implementation coming soon.
        </p>
      </div>
    </div>
  );
}