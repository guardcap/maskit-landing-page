import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Save, ServerCog } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface RuntimeEnvForm {
  openai_api_key: string
  openai_model: string
  openai_vector_store_id: string
  azure_openai_api_key: string
  azure_openai_endpoint: string
  azure_openai_base_url: string
  azure_openai_deployment: string
  azure_openai_model: string
  azure_openai_web_search_tool: string
  azure_openai_web_search_context_size: string
  clova_ocr_url: string
  clova_ocr_secret: string
  naver_app_password: string
}

export function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [maskedValues, setMaskedValues] = useState<Record<string, string | null>>({})
  const [envPath, setEnvPath] = useState('')
  const [form, setForm] = useState<RuntimeEnvForm>({
    openai_api_key: '',
    openai_model: 'gpt-4o',
    openai_vector_store_id: '',
    azure_openai_api_key: '',
    azure_openai_endpoint: '',
    azure_openai_base_url: '',
    azure_openai_deployment: '',
    azure_openai_model: 'gpt-4.1-mini',
    azure_openai_web_search_tool: 'web_search',
    azure_openai_web_search_context_size: 'low',
    clova_ocr_url: '',
    clova_ocr_secret: '',
    naver_app_password: '',
  })

  const token = localStorage.getItem('auth_token')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/runtime-env`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const data = await response.json()
      setConfigured(data.configured)
      setMaskedValues(data.values || {})
      setEnvPath(data.env_path || '')
    } catch (error) {
      console.error('runtime env status load failed:', error)
    }
  }

  const handleChange = (key: keyof RuntimeEnvForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!token) {
      toast.error('관리자 인증이 필요합니다')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/runtime-env`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || '환경변수 저장에 실패했습니다')
      }

      const data = await response.json()
      setConfigured(data.configured)
      setMaskedValues(data.values || {})
      setEnvPath(data.env_path || '')
      setForm({
        openai_api_key: '',
        openai_model: form.openai_model || 'gpt-4o',
        openai_vector_store_id: '',
        azure_openai_api_key: '',
        azure_openai_endpoint: '',
        azure_openai_base_url: '',
        azure_openai_deployment: form.azure_openai_deployment,
        azure_openai_model: form.azure_openai_model || 'gpt-4.1-mini',
        azure_openai_web_search_tool: form.azure_openai_web_search_tool || 'web_search',
        azure_openai_web_search_context_size: form.azure_openai_web_search_context_size || 'low',
        clova_ocr_url: '',
        clova_ocr_secret: '',
        naver_app_password: '',
      })
      toast.success('서버 환경변수로 저장했습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '환경변수 저장에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">실제 API 연동</h1>
          <p className="text-muted-foreground">관리자 설정이 완료되면 무료 mock 대신 실제 API로 동작합니다.</p>
        </div>
        <Badge variant={configured ? 'default' : 'secondary'}>
          {configured ? '실제 API 사용 가능' : 'Mock 모드'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ServerCog className="h-5 w-5 text-primary" />
            <CardTitle>서버 환경변수</CardTitle>
          </div>
          <CardDescription>{envPath || '.env'}에 저장됩니다. 빈 입력값은 기존 값을 유지합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <Input id="openai-api-key" type="password" value={form.openai_api_key} onChange={(e) => handleChange('openai_api_key', e.target.value)} placeholder={maskedValues.OPENAI_API_KEY || 'sk-...'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-model">OpenAI Model</Label>
            <Input id="openai-model" value={form.openai_model} onChange={(e) => handleChange('openai_model', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vector-store">OpenAI Vector Store ID</Label>
            <Input id="vector-store" value={form.openai_vector_store_id} onChange={(e) => handleChange('openai_vector_store_id', e.target.value)} placeholder={maskedValues.OPENAI_VECTOR_STORE_ID || 'vs_...'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-openai-key">Azure OpenAI API Key</Label>
            <Input id="azure-openai-key" type="password" value={form.azure_openai_api_key} onChange={(e) => handleChange('azure_openai_api_key', e.target.value)} placeholder={maskedValues.AZURE_OPENAI_API_KEY || 'azure key'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-openai-endpoint">Azure OpenAI Endpoint</Label>
            <Input id="azure-openai-endpoint" value={form.azure_openai_endpoint} onChange={(e) => handleChange('azure_openai_endpoint', e.target.value)} placeholder={maskedValues.AZURE_OPENAI_ENDPOINT || 'https://resource.openai.azure.com'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-openai-base-url">Azure OpenAI Base URL</Label>
            <Input id="azure-openai-base-url" value={form.azure_openai_base_url} onChange={(e) => handleChange('azure_openai_base_url', e.target.value)} placeholder={maskedValues.AZURE_OPENAI_BASE_URL || 'https://resource.openai.azure.com/openai/v1/'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-openai-deployment">Azure OpenAI Deployment</Label>
            <Input id="azure-openai-deployment" value={form.azure_openai_deployment} onChange={(e) => handleChange('azure_openai_deployment', e.target.value)} placeholder={maskedValues.AZURE_OPENAI_DEPLOYMENT || 'deployment-name'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-openai-model">Azure OpenAI Model</Label>
            <Input id="azure-openai-model" value={form.azure_openai_model} onChange={(e) => handleChange('azure_openai_model', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-web-search-tool">AOAI Web Search Tool</Label>
            <Input id="azure-web-search-tool" value={form.azure_openai_web_search_tool} onChange={(e) => handleChange('azure_openai_web_search_tool', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="azure-web-search-size">AOAI Web Search Context Size</Label>
            <Input id="azure-web-search-size" value={form.azure_openai_web_search_context_size} onChange={(e) => handleChange('azure_openai_web_search_context_size', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clova-url">CLOVA OCR URL</Label>
            <Input id="clova-url" value={form.clova_ocr_url} onChange={(e) => handleChange('clova_ocr_url', e.target.value)} placeholder={maskedValues.CLOVA_OCR_URL || 'https://...'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clova-secret">CLOVA OCR Secret</Label>
            <Input id="clova-secret" type="password" value={form.clova_ocr_secret} onChange={(e) => handleChange('clova_ocr_secret', e.target.value)} placeholder={maskedValues.CLOVA_OCR_SECRET || 'secret'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="naver-password">Naver App Password</Label>
            <Input id="naver-password" type="password" value={form.naver_app_password} onChange={(e) => handleChange('naver_app_password', e.target.value)} placeholder={maskedValues.NAVER_APP_PASSWORD || 'app password'} />
          </div>
        </CardContent>
        <CardContent>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? '저장 중...' : '환경변수 저장'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
