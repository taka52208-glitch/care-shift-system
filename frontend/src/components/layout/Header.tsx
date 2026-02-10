import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Header.css'

interface HeaderProps {
  onMenuToggle: () => void
}

function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onMenuToggle} aria-label="メニュー">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <h1 className="header-title">CareShift</h1>
      </div>
      <div className="header-right">
        <div className="header-user">
          <span className="user-name">{user?.name || 'ゲスト'}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
