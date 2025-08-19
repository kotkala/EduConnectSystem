'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Calendar,
  Clock
} from 'lucide-react'

export function StudentTimetableClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Thá»i khÃ³a biá»ƒu
          </h1>
          <p className="text-muted-foreground">
            Xem thá»i khÃ³a biá»ƒu lá»›p há»c cá»§a báº¡n
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Thá»i khÃ³a biá»ƒu há»c sinh
          </CardTitle>
          <CardDescription>
            Chá»©c nÄƒng xem thá»i khÃ³a biá»ƒu cÃ¡ nhÃ¢n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chá»©c nÄƒng Ä‘ang phÃ¡t triá»ƒn</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              ChÃºng tÃ´i Ä‘ang hoÃ n thiá»‡n chá»©c nÄƒng xem thá»i khÃ³a biá»ƒu cÃ¡ nhÃ¢n.
              TÃ­nh nÄƒng nÃ y sáº½ sá»›m Ä‘Æ°á»£c cáº­p nháº­t Ä‘á»ƒ báº¡n cÃ³ thá»ƒ xem lá»‹ch há»c cá»§a mÃ¬nh má»™t cÃ¡ch dá»… dÃ ng.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Sáº¯p cÃ³:</strong> Xem thá»i khÃ³a biá»ƒu theo tuáº§n, lá»c theo mÃ´n há»c,
                vÃ  nháº­n thÃ´ng bÃ¡o vá» thay Ä‘á»•i lá»‹ch há»c.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
