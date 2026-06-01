import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface AdminLoginPageProps {
  onLogin: (data: any) => void
  onBack: () => void
}

export function AdminLoginPage({ onLogin, onBack }: AdminLoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || '관리자 로그인에 실패했습니다')
      }

      const data = await response.json()
      if (data.user.role !== 'root_admin') {
        throw new Error('ROOT 관리자 권한이 필요합니다')
      }

      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.removeItem('maskit_mock_mode')
      toast.success('관리자 로그인 성공')

      onLogin({
        userId: data.user.email,
        userName: data.user.nickname || data.user.email,
        userEmail: data.user.email,
        userTeam: data.user.team_name || '',
        userRole: data.user.role,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '관리자 로그인에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">관리자 로그인</CardTitle>
          <CardDescription>실제 API 연동 설정은 ROOT 관리자만 변경할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">이메일</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '확인 중...' : '관리자 로그인'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
              돌아가기
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            *관리자 로그인을 하면 실제 API로 mock 처리 없이 활용 가능합니다. 관리자에게 연락주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
