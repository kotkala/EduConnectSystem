import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

// Force dynamic rendering for authentication pages
export const dynamic = 'force-dynamic';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          Sorry, something went wrong.
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {params?.error ? (
          <p className="text-sm text-muted-foreground">
            Error: {params.error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            An unspecified error occurred during authentication.
          </p>
        )}
        <Button asChild className="w-full">
          <Link href={ROUTES.LOGIN}>
            Back to Login
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
