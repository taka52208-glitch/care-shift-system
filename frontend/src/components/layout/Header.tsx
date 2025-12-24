import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Header.css'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">介護シフト作成システム</h1>
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
