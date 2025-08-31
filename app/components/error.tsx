import {
  FileQuestion,
  ServerCrash,
  AlertTriangle,
  Home,
  RefreshCw,
} from "lucide-react";

import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export function ErrorDisplay({
  statusCode = 500,
  description,
  reset,
}: {
  statusCode?: number;
  description: string;
  reset?: () => void;
}) {
  const ErrorIcon = () => {
    switch (statusCode) {
      case 401:
      case 403:
        return <AlertTriangle className="h-16 w-16 text-muted-foreground" />;

      case 404:
        return <FileQuestion className="h-16 w-16 text-muted-foreground" />;
      case 500:
        return <ServerCrash className="h-16 w-16 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const title = () => {
    switch (statusCode) {
      case 404:
        return "Page Not Found";
      case 500:
        return "Internal Server Error";
      default:
        return "Something Went Wrong";
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ErrorIcon />
      </div>
      <h1 className="text-4xl font-bold mb-2">{statusCode}</h1>
      <h1 className="text-4xl font-bold mb-2">{title()}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">{description}</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        {reset && (
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
      <div className="mt-8 text-sm text-muted-foreground">
        Error Code: {statusCode} • {new Date().toISOString()}
      </div>
    </div>
  );
}
