import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/app/dashboard', label: 'ダッシュボード', icon: '📊' },
  { path: '/app/shift', label: 'シフト表', icon: '📅' },
  { path: '/app/staff', label: 'スタッフ管理', icon: '👥' },
  { path: '/app/patterns', label: 'シフトパターン', icon: '⏰' },
  { path: '/app/constraints', label: '制約条件', icon: '⚙️' },
  { path: '/app/requests', label: '希望シフト', icon: '📝' },
  { path: '/app/reports', label: 'レポート', icon: '📈' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🏥</span>
        <span className="sidebar-brand">CareShift</span>
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
