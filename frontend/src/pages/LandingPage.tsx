import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCheck2, KeyRound, MailCheck, ShieldCheck } from 'lucide-react'

interface LandingPageProps {
  onStartFree: () => void
  onAdminLogin: () => void
}

export function LandingPage({ onStartFree, onAdminLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MASKIT" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-bold leading-none">MASKIT</p>
              <p className="text-xs text-muted-foreground">Email Privacy Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onAdminLogin}>
              <KeyRound className="mr-2 h-4 w-4" />
              관리자
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
              <Badge className="w-fit" variant="secondary">DLP 이메일 마스킹 자동화</Badge>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  민감정보가 나가기 전에,
                  <span className="block text-primary">메일을 먼저 점검합니다.</span>
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                  MASKIT은 이메일 본문과 첨부파일을 분석해 개인정보를 탐지하고, 정책 기반 마스킹과 승인 흐름을 제공합니다.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={onStartFree}>
                  무료로 둘러보기
                </Button>
                <Button size="lg" variant="outline" onClick={onAdminLogin}>
                  관리자 로그인
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">검사 결과</p>
                    <p className="text-xs text-muted-foreground">sample-contract.pdf</p>
                  </div>
                  <Badge>마스킹 권고</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-white p-3">
                    <span>주민등록번호</span>
                    <span className="font-mono text-primary">900101-1******</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-white p-3">
                    <span>휴대전화</span>
                    <span className="font-mono text-primary">010-****-4821</span>
                  </div>
                  <div className="rounded-md bg-white p-3">
                    <p className="font-medium">정책 판단</p>
                    <p className="mt-1 text-muted-foreground">외부 수신자 포함, 고위험 개인정보 자동 보호 필요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: '개인정보 탐지', text: '본문, PDF, 이미지에서 주요 민감정보 후보를 탐지합니다.' },
            { icon: FileCheck2, title: '정책 기반 판단', text: '내부 정책과 감사 이력을 기준으로 위험도를 보여줍니다.' },
            { icon: MailCheck, title: '승인 흐름', text: '전송 전 마스킹 결과를 확인하고 승인 프로세스로 연결합니다.' },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
