import { useState, useEffect } from 'react'
import { requestApi, type ShiftRequest } from '../utils/api'
import './ShiftRequests.css'

function ShiftRequests() {
  const [requests, setRequests] = useState<ShiftRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const data = await requestApi.getAll()
      setRequests(data)
    } catch (e) {
      console.error('Failed to load requests:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await requestApi.updateStatus(id, status)
      loadRequests()
    } catch (e) {
      console.error('Failed to update status:', e)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: '未対応', className: 'badge-pending' },
      approved: { label: '承認済', className: 'badge-approved' },
      rejected: { label: '却下', className: 'badge-rejected' },
    }
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>
  }

  const filtered = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="shift-requests">
      <div className="page-header">
        <h1 className="page-title">希望シフト管理</h1>
      </div>

      <div className="filter-bar card">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">すべてのステータス</option>
          <option value="pending">未対応</option>
          <option value="approved">承認済</option>
          <option value="rejected">却下</option>
        </select>
      </div>

      <div className="card">
        <table className="requests-table">
          <thead>
            <tr>
              <th>スタッフ</th>
              <th>日付</th>
              <th>希望内容</th>
              <th>理由</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => (
              <tr key={req.id}>
                <td className="staff-name">{req.staffName}</td>
                <td>{req.date}</td>
                <td>{req.requestType}</td>
                <td className="reason-cell">{req.reason}</td>
                <td>{getStatusBadge(req.status)}</td>
                <td>
                  {req.status === 'pending' && (
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleStatusChange(req.id, 'approved')}
                      >
                        承認
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStatusChange(req.id, 'rejected')}
                      >
                        却下
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ShiftRequests
