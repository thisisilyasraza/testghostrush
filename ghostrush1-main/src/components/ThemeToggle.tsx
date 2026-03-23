import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch 
        checked={theme === 'dark'} 
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
