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
              Lỗi xác thực
            </CardTitle>
            <CardDescription className="text-center">
              Đã xảy ra sự cố với quá trình xác thực
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Liên kết xác thực có thể đã hết hạn hoặc đã được sử dụng.
                Vui lòng đăng nhập lại.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">
                  Thử lại
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
