import './Constraints.css'

function Constraints() {
  return (
    <div className="constraints">
      <div className="page-header">
        <h1 className="page-title">制約条件設定</h1>
      </div>

      <div className="constraints-grid">
        <div className="card constraint-section">
          <h2 className="section-title">人員配置</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>最低必要人数（日中）</label>
              <div className="input-group">
                <input type="number" defaultValue={3} min={1} />
                <span className="input-suffix">名</span>
              </div>
            </div>
            <div className="form-row">
              <label>最低必要人数（夜間）</label>
              <div className="input-group">
                <input type="number" defaultValue={2} min={1} />
                <span className="input-suffix">名</span>
              </div>
            </div>
            <div className="form-row">
              <label>介護福祉士（日中）</label>
              <div className="input-group">
                <input type="number" defaultValue={1} min={0} />
                <span className="input-suffix">名以上</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">勤務制限</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>連続勤務上限</label>
              <div className="input-group">
                <input type="number" defaultValue={5} min={1} />
                <span className="input-suffix">日</span>
              </div>
            </div>
            <div className="form-row">
              <label>月間夜勤上限</label>
              <div className="input-group">
                <input type="number" defaultValue={8} min={0} />
                <span className="input-suffix">回</span>
              </div>
            </div>
            <div className="form-row">
              <label>夜勤後の休日</label>
              <div className="input-group">
                <input type="number" defaultValue={1} min={0} />
                <span className="input-suffix">日以上</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">休日設定</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>週休日数</label>
              <div className="input-group">
                <input type="number" defaultValue={2} min={1} />
                <span className="input-suffix">日</span>
              </div>
            </div>
            <div className="form-row">
              <label>月間最低休日</label>
              <div className="input-group">
                <input type="number" defaultValue={8} min={1} />
                <span className="input-suffix">日</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">その他</h2>
          <div className="constraint-form">
            <div className="form-row checkbox-row">
              <label>
                <input type="checkbox" defaultChecked />
                希望シフトを優先する
              </label>
            </div>
            <div className="form-row checkbox-row">
              <label>
                <input type="checkbox" defaultChecked />
                公平なシフト配分を考慮
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="save-section">
        <button className="btn btn-primary">設定を保存</button>
      </div>
    </div>
  )
}

export default Constraints
