import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-6 border-t border-border">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <span className="font-semibold ghost-text-gradient">GhostRush 1.0</span>
          <span>Made with</span>
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span>by</span>
          <span className="font-semibold">Ilyas</span>
        </p>
      </div>
    </footer>
  );
}
