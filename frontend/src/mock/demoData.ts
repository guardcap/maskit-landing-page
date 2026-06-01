const now = Date.now()
const MOCK_SENT_STORAGE_KEY = 'maskit_mock_sent_emails'
const MOCK_MASKED_STORAGE_KEY = 'maskit_mock_masked_emails'
const MOCK_AUDIT_STORAGE_KEY = 'maskit_mock_audit_logs'

export const mockUnstructuredAttachment = {
  filename: '예제비정형.png',
  size: 180000,
  content_type: 'image/png',
  public_url: '/예제비정형.png',
}

export const mockMaskedUnstructuredAttachment = {
  filename: 'masked_예제비정형.png',
  size: 200822,
  content_type: 'image/png',
  public_url: '/masked_예제비정형.png',
}

export const isMockMode = () => localStorage.getItem('maskit_mock_mode') === 'true'

export const mockReceivedEmails = [
  {
    _id: 'mock-received-001',
    from_email: 'privacy-admin@maskit.local',
    to_email: 'free.demo@example.com',
    subject: '[샘플] 관리자 검토 완료: 계약서 개인정보 마스킹',
    body: '<p>계약서 검토가 완료되었습니다. 주민등록번호와 연락처는 마스킹 처리되었고, 회사명은 업무상 필요 정보로 유지되었습니다.</p>',
    original_body: '<p>계약서 검토가 완료되었습니다. 주민등록번호와 연락처는 마스킹 처리되었고, 회사명은 업무상 필요 정보로 유지되었습니다.</p>',
    masked_body: '<p>계약서 검토가 완료되었습니다. 주민등록번호와 연락처는 마스킹 처리되었고, 회사명은 업무상 필요 정보로 유지되었습니다.</p>',
    created_at: new Date(now - 1000 * 60 * 22).toISOString(),
    read: false,
    status: 'approved' as const,
    attachments: [{ filename: 'masked-contract.pdf', size: 420000, content_type: 'application/pdf' }],
  },
  {
    _id: 'mock-received-002',
    from_email: 'audit@maskit.local',
    to_email: 'free.demo@example.com',
    subject: '[샘플] 개인정보 보호 이력 리포트',
    body: '<p>오늘 처리된 메일 3건 중 고위험 개인정보 5개가 보호 처리되었습니다. 상세 판단 근거는 프라이버시 보호 이력에서 확인할 수 있습니다.</p>',
    original_body: '<p>오늘 처리된 메일 3건 중 고위험 개인정보 5개가 보호 처리되었습니다. 상세 판단 근거는 프라이버시 보호 이력에서 확인할 수 있습니다.</p>',
    created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
    status: 'approved' as const,
    attachments: [],
  },
  {
    _id: 'mock-received-003',
    from_email: 'admin@maskit.local',
    to_email: 'free.demo@example.com',
    subject: '[샘플] OCR 첨부파일 분석 결과 공유',
    body: '<p>첨부 이미지에서 계좌번호와 휴대폰 번호가 탐지되어 자동 마스킹 후보로 등록되었습니다.</p>',
    original_body: '<p>첨부 이미지에서 계좌번호와 휴대폰 번호가 탐지되어 자동 마스킹 후보로 등록되었습니다.</p>',
    created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    read: false,
    status: 'pending' as const,
    attachments: [mockUnstructuredAttachment],
  },
]

export const mockSentEmails = [
  {
    _id: 'mock-sent-001',
    email_id: 'mock-sent-001',
    from_email: 'free.demo@example.com',
    to_email: 'partner@example.com',
    to_emails: ['partner@example.com'],
    subject: '[샘플] 개인정보 포함 계약서 발송 전 점검',
    original_body: '<p>안녕하세요. 홍길동님의 계약서 초안을 공유드립니다. 연락처 010-1234-5678, 주민등록번호 900101-1234567은 검토 후 보호 처리 예정입니다.</p>',
    body: '<p>안녕하세요. 홍길동님의 계약서 초안을 공유드립니다. 연락처 010-1234-5678, 주민등록번호 900101-1234567은 검토 후 보호 처리 예정입니다.</p>',
    created_at: new Date(now - 1000 * 60 * 50).toISOString(),
    attachments: [mockUnstructuredAttachment],
    attachments_summary: [mockUnstructuredAttachment],
    status: 'sent',
  },
  {
    _id: 'mock-sent-002',
    email_id: 'mock-sent-002',
    from_email: 'free.demo@example.com',
    to_email: 'audit@example.com',
    to_emails: ['audit@example.com'],
    subject: '[샘플] 주민등록번호 자동 마스킹 적용',
    original_body: '<p>내부 감사용으로 고객 식별 정보가 포함된 표를 전달합니다. 김민수, 850505-2345678, minsu@example.com 항목은 마스킹 대상입니다.</p>',
    body: '<p>내부 감사용으로 고객 식별 정보가 포함된 표를 전달합니다. 김민수, 850505-2345678, minsu@example.com 항목은 마스킹 대상입니다.</p>',
    created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    attachments: [{ filename: 'masked-report.pdf', size: 310000, content_type: 'application/pdf' }],
    attachments_summary: [{ filename: 'masked-report.pdf', size: 310000, content_type: 'application/pdf' }],
    status: 'sent',
  },
  {
    _id: 'mock-sent-003',
    email_id: 'mock-sent-003',
    from_email: 'free.demo@example.com',
    to_email: 'hr@example.com',
    to_emails: ['hr@example.com'],
    subject: '[샘플] 채용 서류 외부 공유 전 검사',
    original_body: '<p>지원자 이름과 포트폴리오 링크는 채용 검토 목적상 유지하고, 개인 휴대폰 번호는 마스킹했습니다.</p>',
    body: '<p>지원자 이름과 포트폴리오 링크는 채용 검토 목적상 유지하고, 개인 휴대폰 번호는 마스킹했습니다.</p>',
    created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    attachments: [],
    attachments_summary: [],
    status: 'sent',
  },
]

export const mockMaskedEmails = {
  'mock-sent-001': {
    email_id: 'mock-sent-001',
    from_email: 'free.demo@example.com',
    to_emails: ['partner@example.com'],
    subject: '[샘플] 개인정보 포함 계약서 발송 전 점검',
    masked_body: '<p>안녕하세요. 홍*동님의 계약서 초안을 공유드립니다. 연락처 010-****-5678, 주민등록번호 900101-*******은 검토 후 보호 처리 예정입니다.</p>',
    masked_attachments: [mockMaskedUnstructuredAttachment],
    pii_masked_count: 3,
    created_at: new Date(now - 1000 * 60 * 48).toISOString(),
    masking_decisions: {
      pii_0: {
        pii_id: 'pii_0',
        type: 'PERSON',
        value: '홍길동',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '홍*동',
        reason: '외부 협력사 공유 문맥에서 개인 이름은 식별 가능성이 있어 부분 마스킹합니다.',
        reasoning: '무료 체험 mock 판단입니다. 실제 모드에서는 AOAI web search와 가이드라인 검색 결과를 함께 사용합니다.',
        cited_guidelines: ['개인정보 최소 공개 원칙'],
        guideline_matched: true,
        confidence: 0.91,
        risk_level: 'medium' as const,
      },
      pii_1: {
        pii_id: 'pii_1',
        type: 'phone',
        value: '010-1234-5678',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '010-****-5678',
        reason: '휴대폰 번호는 직접 연락 가능한 식별자입니다.',
        reasoning: '외부 전송에서는 업무에 꼭 필요한 경우가 아니면 보호 처리가 권장됩니다.',
        cited_guidelines: ['연락처 보호 기준'],
        guideline_matched: true,
        confidence: 0.96,
        risk_level: 'high' as const,
      },
      pii_2: {
        pii_id: 'pii_2',
        type: 'jumin',
        value: '900101-1234567',
        should_mask: true,
        masking_method: 'full',
        masked_value: '900101-*******',
        reason: '주민등록번호는 고위험 고유식별정보입니다.',
        reasoning: '목적과 무관한 전체 번호 공개는 차단합니다.',
        cited_guidelines: ['고유식별정보 처리 제한'],
        guideline_matched: true,
        confidence: 0.99,
        risk_level: 'high' as const,
      },
    },
  },
}

export const mockAuditLogs = [
  {
    _id: 'mock-log-001',
    timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
    event_type: 'masking_decision',
    severity: 'info',
    user_email: 'free.demo@example.com',
    user_role: 'user',
    action: '계약서 메일 본문에서 고위험 개인정보 3개 마스킹 권장',
    resource_type: 'email',
    resource_id: 'mock-sent-001',
    details: { pii_count: 3, mode: 'mock', protected_types: ['이름', '전화번호', '주민등록번호'] },
    success: true,
  },
  {
    _id: 'mock-log-002',
    timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    event_type: 'email_send',
    severity: 'info',
    user_email: 'free.demo@example.com',
    user_role: 'user',
    action: '마스킹 적용 후 샘플 메일 전송 처리',
    resource_type: 'email',
    resource_id: 'mock-sent-002',
    details: { mode: 'mock', smtp_used: false },
    success: true,
  },
  {
    _id: 'mock-log-003',
    timestamp: new Date(now - 1000 * 60 * 60 * 7).toISOString(),
    event_type: 'masking_apply',
    severity: 'info',
    user_email: 'admin@maskit.local',
    user_role: 'root_admin',
    action: '관리자 검토 메일의 첨부 OCR 결과에 마스킹 적용',
    resource_type: 'attachment',
    resource_id: 'receipt-scan.png',
    details: { mode: 'mock', ocr: true, masked_count: 2 },
    success: true,
  },
]

export function findMockReceivedEmail(emailId: string) {
  return mockReceivedEmails.find((email) => email._id === emailId)
}

function readStoredList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error(`mock storage read failed: ${key}`, error)
    return []
  }
}

function writeStoredList<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

function readStoredMap<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.error(`mock storage map read failed: ${key}`, error)
    return {}
  }
}

function writeStoredMap<T>(key: string, items: Record<string, T>) {
  localStorage.setItem(key, JSON.stringify(items))
}

function attachmentSummary(attachments: any[] = []) {
  return attachments.map((attachment) => ({
    filename: attachment instanceof File ? attachment.name : attachment.filename || attachment.name || 'attachment',
    size: attachment instanceof File ? attachment.size : attachment.size || 0,
    content_type: attachment instanceof File ? attachment.type : attachment.content_type || attachment.type || 'application/octet-stream',
    public_url: attachment instanceof File ? undefined : attachment.public_url,
  }))
}

function normalizeMaskingDecisions(decisions: Record<string, any> = {}) {
  return Object.fromEntries(
    Object.entries(decisions).map(([key, decision]) => [
      key,
      {
        pii_id: decision.pii_id || key,
        type: decision.type || 'UNKNOWN',
        value: decision.value || '',
        should_mask: Boolean(decision.should_mask),
        masking_method: decision.masking_method || (decision.should_mask ? 'partial' : 'none'),
        masked_value: decision.masked_value || (decision.should_mask ? '***' : decision.value || ''),
        reason: decision.reason || '무료 체험 mock 판단입니다.',
        reasoning: decision.reasoning || '실제 관리자 API 설정 시 외부 API와 정책 검색 결과로 판단합니다.',
        cited_guidelines: decision.cited_guidelines || ['무료 체험 샘플 정책'],
        guideline_matched: decision.guideline_matched ?? true,
        confidence: decision.confidence ?? 0.9,
        risk_level: decision.risk_level || (decision.should_mask ? 'medium' : 'low'),
      },
    ]),
  )
}

export function getMockSentEmails() {
  const stored = readStoredList<any>(MOCK_SENT_STORAGE_KEY)
  return [...stored, ...mockSentEmails].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function getMockAuditLogs() {
  const stored = readStoredList<any>(MOCK_AUDIT_STORAGE_KEY)
  return [...stored, ...mockAuditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function saveMockProcessedEmail(input: {
  emailId?: string
  from: string
  to: string[]
  subject: string
  originalBody: string
  maskedBody?: string
  attachments?: any[]
  maskingDecisions?: Record<string, any>
  actorEmail?: string
  actorRole?: string
}) {
  const emailId = input.emailId || `mock-sent-${Date.now()}`
  const createdAt = new Date().toISOString()
  const attachments = attachmentSummary(input.attachments)
  const piiMaskedCount = Object.values(input.maskingDecisions || {}).filter((decision: any) => decision.should_mask).length

  const sentEmail = {
    _id: emailId,
    email_id: emailId,
    from_email: input.from,
    to_email: input.to[0] || '',
    to_emails: input.to,
    subject: input.subject,
    original_body: input.originalBody,
    body: input.originalBody,
    created_at: createdAt,
    attachments,
    attachments_summary: attachments,
    status: 'sent',
    processed_by: input.actorEmail || input.from,
  }

  const storedSent = readStoredList<any>(MOCK_SENT_STORAGE_KEY).filter(
    (email) => email.email_id !== emailId && email._id !== emailId,
  )
  writeStoredList(MOCK_SENT_STORAGE_KEY, [sentEmail, ...storedSent])

  if (input.maskedBody || input.maskingDecisions) {
    const storedMasked = readStoredMap<any>(MOCK_MASKED_STORAGE_KEY)
    storedMasked[emailId] = {
      email_id: emailId,
      from_email: input.from,
      to_emails: input.to,
      subject: input.subject,
      masked_body: input.maskedBody || input.originalBody,
      masked_attachments: attachments.map((attachment) => {
        const isMockUnstructured = attachment.filename === mockUnstructuredAttachment.filename
        return isMockUnstructured
          ? mockMaskedUnstructuredAttachment
          : {
              ...attachment,
              filename: attachment.filename.replace(/(\.[^.]+)?$/, '_masked$1'),
            }
      }),
      masking_decisions: normalizeMaskingDecisions(input.maskingDecisions),
      pii_masked_count: piiMaskedCount,
      created_at: createdAt,
    }
    writeStoredMap(MOCK_MASKED_STORAGE_KEY, storedMasked)
  }

  const storedLogs = readStoredList<any>(MOCK_AUDIT_STORAGE_KEY)
  writeStoredList(MOCK_AUDIT_STORAGE_KEY, [
    {
      _id: `mock-log-${Date.now()}`,
      timestamp: createdAt,
      event_type: 'email_send',
      severity: 'info',
      user_email: input.actorEmail || input.from,
      user_role: input.actorRole || 'user',
      action: `${input.subject} mock 전송 및 마스킹 처리`,
      resource_type: 'email',
      resource_id: emailId,
      details: {
        mode: 'mock',
        smtp_used: false,
        pii_masked_count: piiMaskedCount,
        visible_in_free_demo: true,
      },
      success: true,
    },
    ...storedLogs,
  ])

  return sentEmail
}

export function findMockSentEmail(emailId: string) {
  return getMockSentEmails().find((email) => email._id === emailId || email.email_id === emailId)
}

export function findMockMaskedEmail(emailId: string) {
  const stored = readStoredMap<any>(MOCK_MASKED_STORAGE_KEY)
  return stored[emailId] || mockMaskedEmails[emailId as keyof typeof mockMaskedEmails]
}
