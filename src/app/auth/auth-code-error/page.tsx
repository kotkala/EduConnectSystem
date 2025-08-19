import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-destructive">
              Lá»—i xÃ¡c thá»±c
            </CardTitle>
            <CardDescription className="text-center">
              ÄÃ£ xáº£y ra sá»± cá»‘ vá»›i quÃ¡ trÃ¬nh xÃ¡c thá»±c
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                LiÃªn káº¿t xÃ¡c thá»±c cÃ³ thá»ƒ Ä‘Ã£ háº¿t háº¡n hoáº·c Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.
                Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">
                  Thá»­ láº¡i
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Vá» trang chá»§
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
