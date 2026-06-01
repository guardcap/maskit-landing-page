import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Send,
  Save,
  Upload,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from 'lucide-react'
import { toast } from 'sonner'
import { isMockMode, mockUnstructuredAttachment } from '@/mock/demoData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface WriteEmailPageProps {
  onBack?: () => void
  onSend?: (emailData: EmailData) => void
}

interface EmailData {
  from: string
  to: string[]
  subject: string
  body: string
  attachments: File[]
  email_id?: string // MongoDB에 저장된 원본 이메일 ID
}

export const WriteEmailPage: React.FC<WriteEmailPageProps> = ({ onBack, onSend }) => {
  const [fromEmail, setFromEmail] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 로그인한 사용자의 이메일 자동 로드
  useEffect(() => {
    // 먼저 로그인한 사용자 정보에서 이메일 가져오기
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.email) {
          setFromEmail(user.email)
          return
        }
      } catch (error) {
        console.error('Failed to load user info:', error)
      }
    }

    // 사용자 정보가 없으면 이메일 설정에서 가져오기 (fallback)
    const savedEmailSettings = localStorage.getItem('email_settings')
    if (savedEmailSettings) {
      try {
        const settings = JSON.parse(savedEmailSettings)
        if (settings.default_email) {
          setFromEmail(settings.default_email)
        }
      } catch (error) {
        console.error('Failed to load email settings:', error)
      }
    }
  }, [])

  // 받는 사람 추가
  const addRecipient = () => {
    const email = recipientInput.trim()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 주소를 입력하세요')
      return
    }

    if (recipients.includes(email)) {
      toast.error('이미 추가된 이메일입니다')
      return
    }

    setRecipients([...recipients, email])
    setRecipientInput('')
  }

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  // 텍스트 서식 적용
  const formatText = (command: string) => {
    document.execCommand(command, false, undefined)
    editorRef.current?.focus()
  }

  // 파일 선택 핸들러 (즉시 상태에 저장)
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    
    for (const file of Array.from(files)) {
      // 중복 체크 (파일명과 크기로)
      if (attachments.some(a => a.name === file.name && a.size === file.size)) {
        toast.error(`이미 추가된 파일입니다: ${file.name}`)
        continue
      }
      newFiles.push(file)
    }

    if (newFiles.length > 0) {
      setAttachments(prev => [...prev, ...newFiles])
      toast.success(`${newFiles.length}개 파일 추가됨`)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // 이메일 전송
  const handleSend = async () => {
    // 검증
    if (!fromEmail) {
      toast.error('보내는 사람 이메일을 입력하세요')
      return
    }

    if (recipients.length === 0) {
      toast.error('받는 사람을 최소 1명 이상 입력하세요')
      return
    }

    if (!subject.trim()) {
      toast.error('제목을 입력하세요')
      return
    }

    const body = editorRef.current?.innerHTML || ''
    if (!body.trim() || body.trim() === '<br>') {
      toast.error('메일 본문을 입력하세요')
      return
    }

    try {
      console.log('='.repeat(80))
      console.log('📧 이메일 전송 시작')
      console.log('='.repeat(80))
      console.log('발신자:', fromEmail)
      console.log('수신자:', recipients)
      console.log('제목:', subject)
      console.log('본문 길이:', body.length)
      console.log('첨부파일:', attachments.length, '개')
      console.log('='.repeat(80))

      if (isMockMode()) {
        const mockAttachments = attachments.length > 0 ? attachments : [mockUnstructuredAttachment]
        toast.success('무료 체험 mock 메일이 분석 단계로 전달되었습니다.')
        onSend?.({
          from: fromEmail,
          to: recipients,
          subject,
          body,
          attachments: mockAttachments as any,
          email_id: `mock-draft-${Date.now()}`,
        })
        return
      }

      // FormData 생성
      const formData = new FormData()
      formData.append('from_email', fromEmail)
      formData.append('to_email', recipients.join(', '))
      formData.append('subject', subject)
      formData.append('original_body', body)

      // 첨부파일 추가
      attachments.forEach((file) => {
        formData.append('attachments', file)
        console.log('첨부파일 추가:', file.name, file.size, 'bytes')
      })

      // API 호출
      console.log('API 호출 URL:', `${API_BASE_URL}/api/v1/files/upload_email`)
      const response = await fetch(`${API_BASE_URL}/api/v1/files/upload_email`, {
        method: 'POST',
        body: formData,
      })

      console.log('응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('응답 에러:', errorText)
        throw new Error('이메일 전송 실패')
      }

      const result = await response.json()
      console.log('마스킹 페이지로 이동:', result)

      // 콜백 호출 (email_id 포함)
      if (onSend) {
        onSend({
          from: fromEmail,
          to: recipients,
          subject,
          body,
          attachments,
          email_id: result.email_id, // MongoDB에 저장된 이메일 ID
        })
      }
    } catch (error) {
      console.error('Send error:', error)
      toast.error('이메일 전송 중 오류가 발생했습니다')
    }
  }

  // 임시 저장
  const handleSaveDraft = () => {
    toast.success('임시저장 되었습니다')
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">메일 쓰기</h2>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
            <Button onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              마스킹 진행
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              임시 저장
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 보내는 사람 */}
          <div className="flex items-center p-4">
            <Label className="min-w-[100px] font-medium">보내는 사람</Label>
            <Input
              type="email"
              value={fromEmail}
              readOnly
              disabled
              className="max-w-md bg-muted cursor-not-allowed"
              placeholder="your@email.com"
            />
          </div>

          <Separator />

          {/* 받는 사람 */}
          <div className="flex items-start p-4">
            <Label className="min-w-[100px] font-medium pt-2">받는 사람</Label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addRecipient()
                    }
                  }}
                  placeholder="받는 사람 이메일 (Enter로 추가)"
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  주소록
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* 제목 */}
          <div className="flex items-center p-4">
            <Label className="min-w-[100px] font-medium">제목</Label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="제목을 입력하세요"
              className="flex-1"
            />
          </div>

          <Separator />

          {/* 파일 첨부 */}
          <div className="flex items-start p-4">
            <Label className="min-w-[100px] font-medium pt-2">파일 첨부</Label>
            <div className="flex-1">
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  내 PC
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {/* 첨부파일 목록 */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      <span>
                        📄 {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 드래그 앤 드롭 영역 */}
              <div
                className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center cursor-pointer hover:border-primary hover:bg-accent/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-primary', 'bg-accent/20')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-primary', 'bg-accent/20')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-primary', 'bg-accent/20')
                  handleFileSelect(e.dataTransfer.files)
                }}
              >
                <p className="text-sm text-muted-foreground">
                  📎 첨부할 파일을 마우스로 끌어 놓으세요
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 에디터 툴바 */}
          <div className="flex items-center gap-1 p-3 bg-muted/30 flex-wrap">
            <div className="flex gap-1 pr-3 border-r">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('bold')}
                title="굵게"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('italic')}
                title="기울임"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('underline')}
                title="밑줄"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1 pr-3 border-r">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyLeft')}
                title="왼쪽 정렬"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyCenter')}
                title="가운데 정렬"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyRight')}
                title="오른쪽 정렬"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('insertUnorderedList')}
                title="글머리 기호"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('insertOrderedList')}
                title="번호 매기기"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* 에디터 본문 */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[400px] max-h-[600px] p-6 focus:outline-none overflow-y-auto"
            onInput={(e) => setBodyHtml(e.currentTarget.innerHTML)}
            style={{ lineHeight: '1.6' }}
            suppressContentEditableWarning
          >
            {/* 플레이스홀더는 CSS로 처리 */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
