import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { path: '/shift', label: 'シフト表', icon: '📅' },
  { path: '/staff', label: 'スタッフ管理', icon: '👥' },
  { path: '/patterns', label: 'シフトパターン', icon: '⏰' },
  { path: '/constraints', label: '制約条件', icon: '⚙️' },
  { path: '/requests', label: '希望シフト', icon: '📝' },
  { path: '/reports', label: 'レポート', icon: '📈' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🏥</span>
        <span className="sidebar-brand">シフト管理</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
