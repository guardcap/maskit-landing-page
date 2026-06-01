import { useState, useEffect } from 'react'
import { ModernAppLayout } from '@/components/ModernAppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminSettingsPage } from '@/pages/AdminSettingsPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PolicyListPage } from '@/pages/PolicyListPage'
import { PolicyAddPage } from '@/pages/PolicyAddPage'
import { PolicyDetailPage } from '@/pages/PolicyDetailPage'
import { WriteEmailPage } from '@/pages/WriteEmailPage'
import { MaskingPage } from '@/pages/MaskingPage'
import { MyPage } from '@/pages/MyPage'
import { SentEmailDetailPage } from '@/pages/SentEmailDetailPage'
import { ReceivedDetailPage } from '@/pages/ReceivedDetailPage' // ← 추가

import { UserDashboardPage } from '@/pages/UserDashboardPage'
import AuditorDashboardPage from '@/pages/AuditorDashboardPage'
import { SentEmailsPage } from '@/pages/SentEmailsPage'
import { ReceivedEmailsPage } from '@/pages/ReceivedEmailsPage'
import DecisionLogsPage from '@/pages/DecisionLogsPage'
import UserManagementPage from '@/pages/UserManagementPage'
import EntityManagementPage from '@/pages/EntityManagementPage'
import RootDashboardPage from '@/pages/RootDashboardPage'
import { Home, FileText, Shield, Users, Plus, Mail, User, Inbox, MailOpen, ServerCog } from 'lucide-react'

type Page = 'landing' | 'login' | 'admin-login' | 'register' | 'main'

const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const USER_STORAGE_KEY = 'user'
const MOCK_MODE_STORAGE_KEY = 'maskit_mock_mode'
const FREE_TRIAL_AUTH_TOKEN = 'mock-free-token'
const FREE_TRIAL_PLAN = 'free_mock'
const FREE_TRIAL_USER_EMAIL = 'free.demo@example.com'
const FREE_TRIAL_HIDDEN_MENU_IDS = ['received-emails', 'mypage']

interface User {
  userId: string
  userName: string
  userEmail: string
  userTeam: string
  userRole: string
  plan?: string
}

const isFreeTrialUser = (currentUser: User | null) =>
  currentUser?.plan === FREE_TRIAL_PLAN ||
  currentUser?.userEmail === FREE_TRIAL_USER_EMAIL ||
  currentUser?.userId === FREE_TRIAL_USER_EMAIL

// WriteEmailPage에서 사용하는 타입 (File 객체 사용)
interface EmailDraftData {
  from: string
  to: string[]
  subject: string
  body: string
  attachments: File[]
  email_id?: string
}

// localStorage에서 사용자 정보 복원
const restoreUserFromStorage = (): User | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    const userJson = localStorage.getItem(USER_STORAGE_KEY)

    if (!token || !userJson) {
      return null
    }

    const userData = JSON.parse(userJson)
    return {
      userId: userData.email,
      userName: userData.nickname || userData.email,
      userEmail: userData.email,
      userTeam: userData.team_name || '',
      userRole: userData.role || 'user',
      plan: userData.plan,
    }
  } catch (error) {
    console.error('사용자 정보 복원 오류:', error)
    return null
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState('main')
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [emailDraftData, setEmailDraftData] = useState<EmailDraftData | null>(null)

  // 앱 초기화: localStorage에서 로그인 상태 복원
  useEffect(() => {
    const restoredUser = restoreUserFromStorage()
    if (restoredUser) {
      setUser(restoredUser)
      setCurrentPage('main')
    }
    setIsInitialized(true)
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    setCurrentPage('main')
  }

  const handleAdminLogin = (userData: any) => {
    setUser(userData)
    setCurrentView('admin-settings')
    setCurrentPage('main')
  }

  const handleStartFree = () => {
    const mockUser = {
      email: FREE_TRIAL_USER_EMAIL,
      nickname: '무료 체험 사용자',
      team_name: 'Demo',
      role: 'user',
      plan: FREE_TRIAL_PLAN,
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, FREE_TRIAL_AUTH_TOKEN)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser))
    localStorage.setItem(MOCK_MODE_STORAGE_KEY, 'true')

    setUser({
      userId: mockUser.email,
      userName: mockUser.nickname,
      userEmail: mockUser.email,
      userTeam: mockUser.team_name,
      userRole: mockUser.role,
      plan: mockUser.plan,
    })
    setCurrentView('main')
    setCurrentPage('main')
  }

  const handleRegister = (userData: any) => {
    console.log('회원가입 데이터:', userData)
    alert('회원가입이 완료되었습니다!')
    setCurrentPage('login')
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(MOCK_MODE_STORAGE_KEY)

    setUser(null)
    setCurrentPage('landing')
    setCurrentView('main')
  }

  // 역할별 사이드바 메뉴 생성
  const getSidebarMenuByRole = (userRole: string) => {
    if (userRole === 'root_admin') {
      return [
        {
          id: 'main',
          label: 'API 연동 설정',
          icon: <ServerCog className="h-4 w-4" />,
          onClick: () => setCurrentView('main'),
        },
        {
          id: 'write-email',
          label: '메일 쓰기',
          icon: <Mail className="h-4 w-4" />,
          onClick: () => setCurrentView('write-email'),
        },
        {
          id: 'received-emails',
          label: '받은 메일함',
          icon: <Inbox className="h-4 w-4" />,
          onClick: () => setCurrentView('received-emails'),
        },
        {
          id: 'my-emails',
          label: '보낸 메일함',
          icon: <MailOpen className="h-4 w-4" />,
          onClick: () => setCurrentView('my-emails'),
        },
        {
          id: 'logs',
          label: '프라이버시 보호 이력',
          icon: <FileText className="h-4 w-4" />,
          onClick: () => setCurrentView('logs'),
        },
        {
          id: 'mypage',
          label: 'SMTP 설정',
          icon: <User className="h-4 w-4" />,
          onClick: () => setCurrentView('mypage'),
        },
      ]
    }

    const baseMenu = [
      {
        id: 'main',
        label: '메인',
        icon: <Home className="h-4 w-4" />,
        onClick: () => setCurrentView('main'),
      },
      {
        id: 'write-email',
        label: '메일 쓰기',
        icon: <Mail className="h-4 w-4" />,
        onClick: () => setCurrentView('write-email'),
      },
      {
        id: 'received-emails',
        label: '받은 메일함',
        icon: <Inbox className="h-4 w-4" />,
        onClick: () => setCurrentView('received-emails'),
      },
      {
        id: 'my-emails',
        label: '보낸 메일함',
        icon: <MailOpen className="h-4 w-4" />,
        onClick: () => setCurrentView('my-emails'),
      },
    ]

    // Policy Admin 전용 메뉴
    console.log('현재 userRole:', userRole, '| policy_admin 여부:', userRole === 'policy_admin')
    if (userRole === 'policy_admin') {
      baseMenu.push(
        {
          id: 'policy-add',
          label: '정책 추가',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCurrentView('policy-add'),
        },
        {
          id: 'entity-management',
          label: '엔티티 관리',
          icon: <Shield className="h-4 w-4" />,
          onClick: () => setCurrentView('entity-management'),
        },
      )
    }

    // 공통 메뉴
    baseMenu.push(
      {
        id: 'logs',
        label: '프라이버시 보호 이력',
        icon: <FileText className="h-4 w-4" />,
        onClick: () => setCurrentView('logs'),
      },
      {
        id: 'mypage',
        label: '마이페이지',
        icon: <User className="h-4 w-4" />,
        onClick: () => setCurrentView('mypage'),
      },
    )

    return isFreeTrialUser(user)
      ? baseMenu.filter((item) => !FREE_TRIAL_HIDDEN_MENU_IDS.includes(item.id))
      : baseMenu
  }

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onStartFree={handleStartFree}
        onAdminLogin={() => setCurrentPage('admin-login')}
      />
    )
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onShowRegister={() => setCurrentPage('register')}
        onBack={() => setCurrentPage('landing')}
        onStartFree={handleStartFree}
      />
    )
  }

  if (currentPage === 'admin-login') {
    return (
      <AdminLoginPage
        onLogin={handleAdminLogin}
        onBack={() => setCurrentPage('landing')}
      />
    )
  }

  // 회원가입 페이지
  if (currentPage === 'register') {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onShowLogin={() => setCurrentPage('login')}
      />
    )
  }

  // 메인 애플리케이션
  const sidebarMenu = user ? getSidebarMenuByRole(user.userRole) : []

  return (
    <ModernAppLayout
      userName={user?.userName}
      userEmail={user?.userEmail}
      userRole={user?.userRole}
      onLogout={handleLogout}
      sidebarMenu={sidebarMenu}
    >
      {/* 페이지별 컨텐츠 렌더링 */}
      {currentView === 'main' && (
        <>
          {user?.userRole === 'root_admin' && (
            <AdminSettingsPage />
          )}
          {user?.userRole === 'auditor' && (
            <AuditorDashboardPage />
          )}
          {user?.userRole === 'policy_admin' && (
            <PolicyListPage
              onAddPolicy={() => setCurrentView('policy-add')}
              onViewPolicy={(id) => {
                setSelectedPolicyId(id)
                setCurrentView('policy-detail')
              }}
            />
          )}
          {(!user?.userRole || (user?.userRole !== 'root_admin' && user?.userRole !== 'auditor' && user?.userRole !== 'policy_admin')) && (
            <UserDashboardPage
              onNavigate={(view, emailId) => {
                setCurrentView(view)
                if (emailId) {
                  setSelectedEmailId(emailId)
                }
              }}
            />
          )}
        </>
      )}

      {currentView === 'policy-detail' && selectedPolicyId && (
        <PolicyDetailPage
          policyId={selectedPolicyId}
          onBack={() => setCurrentView('policy-list')}
          onDelete={(id) => {
            console.log('Delete policy:', id)
            alert('정책이 삭제되었습니다.')
            setCurrentView('policy-list')
          }}
        />
      )}

      {currentView === 'policy-add' && (
        <PolicyAddPage
          onBack={() => setCurrentView('policy-list')}
          onSuccess={() => setCurrentView('policy-list')}
        />
      )}

      {currentView === 'write-email' && (
        <WriteEmailPage
          onBack={() => setCurrentView('main')}
          onSend={(emailData) => {
            setEmailDraftData(emailData)
            setCurrentView('approver-review')
          }}
        />
      )}

      {currentView === 'approver-review' && emailDraftData && (
        <MaskingPage
          emailData={emailDraftData}
          onBack={() => setCurrentView('write-email')}
          onSendComplete={() => {
            setEmailDraftData(null)
            setCurrentView('main')
          }}
        />
      )}

      {currentView === 'mypage' && <MyPage />}

      {currentView === 'users' && <UserManagementPage />}

      {currentView === 'logs' && <DecisionLogsPage />}

      {currentView === 'entity-management' && <EntityManagementPage />}

      {currentView === 'root-dashboard' && <RootDashboardPage />}

      {currentView === 'admin-settings' && <AdminSettingsPage />}

      {/* ✅ 보낸 메일 상세 페이지 */}
      {currentView === 'sent-email-detail' && selectedEmailId && (
        <SentEmailDetailPage
          emailId={selectedEmailId}
          onBack={() => setCurrentView('my-emails')}
        />
      )}

      {/* ✅ 받은 메일 상세 페이지 (ReceivedDetailPage 사용) */}
      {currentView === 'email-detail' && selectedEmailId && (
        <ReceivedDetailPage
          emailId={selectedEmailId}
          onBack={() => setCurrentView('received-emails')}
        />
      )}

      {currentView === 'my-emails' && (
        <SentEmailsPage
          onNavigate={(view, emailId) => {
            setCurrentView(view)
            if (emailId) {
              setSelectedEmailId(emailId)
            }
          }}
          onBack={() => setCurrentView('main')}
        />
      )}

      {currentView === 'received-emails' && (
        <ReceivedEmailsPage
          onNavigate={(view, emailId) => {
            setCurrentView(view)
            if (emailId) {
              setSelectedEmailId(emailId)
            }
          }}
          onBack={() => setCurrentView('main')}
        />
      )}
    </ModernAppLayout>
  )
}

export default App
