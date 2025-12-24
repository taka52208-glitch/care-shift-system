import { useState, useEffect } from 'react'
import { staffApi, type Staff } from '../utils/api'
import './StaffManagement.css'

function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [form, setForm] = useState({ name: '', qualification: '介護福祉士', employmentType: '正社員', phone: '' })

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const data = await staffApi.getAll()
      setStaff(data)
    } catch (e) {
      console.error('Failed to load staff:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, form)
      } else {
        await staffApi.create(form)
      }
      loadStaff()
      closeModal()
    } catch (e) {
      console.error('Failed to save staff:', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    try {
      await staffApi.delete(id)
      loadStaff()
    } catch (e) {
      console.error('Failed to delete staff:', e)
    }
  }

  const openModal = (s?: Staff) => {
    if (s) {
      setEditingStaff(s)
      setForm({ name: s.name, qualification: s.qualification, employmentType: s.employmentType, phone: s.phone })
    } else {
      setEditingStaff(null)
      setForm({ name: '', qualification: '介護福祉士', employmentType: '正社員', phone: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingStaff(null)
  }

  const filtered = staff.filter(s => s.name.includes(search) || s.qualification.includes(search))

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="staff-management">
      <div className="page-header">
        <h1 className="page-title">スタッフ管理</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ スタッフ追加</button>
      </div>

      <div className="card">
        <div className="table-header">
          <input
            type="text"
            placeholder="スタッフを検索..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>資格</th>
              <th>雇用形態</th>
              <th>電話番号</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="staff-name-cell">{s.name}</td>
                <td><span className="qualification-badge">{s.qualification}</span></td>
                <td>{s.employmentType}</td>
                <td>{s.phone}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-outline btn-sm" onClick={() => openModal(s)}>編集</button>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDelete(s.id)}>削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingStaff ? 'スタッフ編集' : 'スタッフ追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>名前</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>資格</label>
                <select value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})}>
                  <option>介護福祉士</option>
                  <option>ヘルパー2級</option>
                  <option>ヘルパー1級</option>
                  <option>無資格</option>
                </select>
              </div>
              <div className="form-group">
                <label>雇用形態</label>
                <select value={form.employmentType} onChange={e => setForm({...form, employmentType: e.target.value})}>
                  <option>正社員</option>
                  <option>パート</option>
                  <option>派遣</option>
                </select>
              </div>
              <div className="form-group">
                <label>電話番号</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>キャンセル</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
