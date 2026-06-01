import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileCheck2,
  FileSearch,
  KeyRound,
  MailCheck,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
} from 'lucide-react'

interface LandingPageProps {
  onStartFree: () => void
  onAdminLogin: () => void
}

const coreBenefits = [
  { icon: ShieldCheck, title: '개인정보 탐지', text: '본문, PDF, 이미지에서 주요 민감정보 후보를 탐지합니다.' },
  { icon: FileCheck2, title: '정책 기반 판단', text: '업무 목적과 수신 맥락을 기준으로 마스킹 필요 여부를 보여줍니다.' },
  { icon: MailCheck, title: '전송 전 보호', text: '마스킹 결과를 검토한 뒤 SMTP 흐름으로 바로 전송합니다.' },
]

const workflowSteps = [
  { icon: FileSearch, title: '메일 작성', text: '사용자는 평소처럼 본문과 첨부파일을 준비합니다.' },
  { icon: ScanSearch, title: 'PII 탐지', text: 'Regex, 한국어 NER, OCR을 결합해 민감정보 후보를 찾습니다.' },
  { icon: BrainCircuit, title: '문맥 판단', text: 'AOAI가 비식별 문맥과 PII 역할 메타데이터를 함께 보고 판단합니다.' },
  { icon: EyeOff, title: '마스킹 검토', text: '고위험 정보는 가리고 업무상 필요한 정보는 유지합니다.' },
]

const operatingPoints = [
  {
    icon: UserRoundCheck,
    title: '역할 기반 권한 분리',
    text: 'System Admin, Policy Admin, Auditor, User로 책임과 접근 범위를 나눕니다.',
  },
  {
    icon: SlidersHorizontal,
    title: '정책·엔티티 커스텀',
    text: '사내에서 쓰는 정규식 엔티티와 마스킹 정책을 업무 환경에 맞게 조정합니다.',
  },
  {
    icon: ClipboardList,
    title: '프라이버시 보호 이력',
    text: '메일 전송, 마스킹 결정, 정책·엔티티 변경 기록을 감사 로그로 남깁니다.',
  },
]

export function LandingPage({ onStartFree, onAdminLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MASKIT" className="h-10 w-10 object-contain" />
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
          {coreBenefits.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
            </Card>
          ))}
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 max-w-2xl space-y-3">
              <Badge variant="outline" className="w-fit bg-white">메일 보안 워크플로우</Badge>
              <h2 className="text-3xl font-bold tracking-tight">업무 메일이 나가기 전에, 한 번에 점검합니다.</h2>
              <p className="text-muted-foreground">
                파일 오첨부와 마스킹 누락처럼 반복되는 업무 실수를 줄이기 위해 작성, 탐지, 판단, 마스킹 검토 흐름을 하나로 묶었습니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {workflowSteps.map((item, index) => (
                <Card key={item.title} className="border-slate-200 bg-white shadow-none">
                  <CardHeader>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">STEP {index + 1}</p>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Badge className="w-fit" variant="secondary">Context-aware AOAI Masking</Badge>
              <h2 className="text-3xl font-bold tracking-tight">값 하나가 아니라, 업무 맥락까지 봅니다.</h2>
              <p className="text-muted-foreground">
                기존처럼 PII 유형만 보는 방식으로는 송신자 서명, 요청 대상자 정보, 조직명과 같은 업무 역할을 구분하기 어렵습니다.
                MASKIT은 AOAI 판단 전에 본문을 비식별 placeholder 문서로 바꾸고, 각 PII에 의미 역할을 붙여 판단합니다.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">비식별 문맥 예시</p>
                  <p className="text-xs text-muted-foreground">실제 PII 대신 placeholder와 역할 메타데이터로 판단</p>
                </div>
                <Badge variant="outline">PII-safe</Badge>
              </div>
              <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
{`안녕하세요, <ORGANIZATION_3>팀 <PERSON_1>입니다.

- 성명: <PERSON_2>
- 주민등록번호: <RESIDENT_ID_1>
- 휴대폰 번호: <PHONE_1>
- 개인 이메일: <EMAIL_1>
- 사내 이메일: <EMAIL_2>
- 부서: <ORGANIZATION_1>

감사합니다.
<PERSON_1> 드림
<ORGANIZATION_3>팀 / <PHONE_3>
<EMAIL_3>`}
              </pre>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="shadow-none">
              <CardHeader>
                <BrainCircuit className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-lg">PII 역할 메타데이터</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                `sender_signature`, `request_subject_identity`, `payroll_account`처럼 문서 섹션과 의미 역할을 함께 봅니다.
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-lg">업무상 필요한 정보 유지</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                송신자 이름, 업무 이메일, 업무 전화번호처럼 회신과 신원 확인에 필요한 서명 정보는 원문 유지 가능성을 우선 검토합니다.
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-lg">고위험 정보는 계속 보호</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                주민등록번호, 계좌번호, 개인 연락처, 개인 이메일, 주소처럼 노출 위험이 큰 정보는 마스킹 대상으로 분리합니다.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 max-w-2xl space-y-3">
              <Badge variant="outline" className="w-fit bg-white">정책 보정 결과</Badge>
              <h2 className="text-3xl font-bold tracking-tight">과하게 가리지 않고, 위험한 정보는 놓치지 않습니다.</h2>
              <p className="text-muted-foreground">
                AOAI가 실패하거나 지나치게 보수적으로 판단하더라도 명확한 업무 정보와 오탐 후보는 정책 보정으로 다시 분리합니다.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-emerald-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-700">원문 유지</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {['김민지', 'minji.kim@company.co.kr', '02-3456-7788', '보안기술팀 · 국민은행 · 인사팀'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700">마스킹 유지</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {['주민등록번호', '계좌번호', '개인 휴대폰', '개인 이메일', '상세 주소'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-800">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-700">오탐 후보 제외</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {['90', '드림', '인사', '총무'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-slate-700">
                      <FileCheck2 className="h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 max-w-2xl space-y-3">
            <Badge className="w-fit" variant="secondary">운영 관리</Badge>
            <h2 className="text-3xl font-bold tracking-tight">사용자, 정책 관리자, 감사자가 각자 필요한 화면만 봅니다.</h2>
            <p className="text-muted-foreground">
              메일을 쓰는 사람에게는 빠른 마스킹 검토를, 관리자는 정책과 엔티티 관리를, 감사자는 보호 이력을 제공합니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {operatingPoints.map((item) => (
              <Card key={item.title} className="shadow-none">
                <CardHeader>
                  <item.icon className="mb-2 h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
