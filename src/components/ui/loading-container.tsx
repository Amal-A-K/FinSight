import { Spinner } from './spinner';
import { Card } from './card';

interface LoadingContainerProps {
  message?: string;
  className?: string;
}

export function LoadingContainer({ message = 'Loading...', className = '' }: LoadingContainerProps) {
  return (
    <Card className={`p-8 flex flex-col items-center justify-center space-y-4 ${className}`}>
      <Spinner />
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
}
