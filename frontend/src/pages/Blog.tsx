import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { blogArticles } from '../content/blogArticles'
import './Blog.css'

function Blog() {
  return (
    <div className="blog-page">
      <Helmet>
        <title>お役立ちコラム｜CareShift - 介護施設専門シフト管理システム</title>
        <meta name="description" content="介護施設のシフト作成に役立つノウハウ・コツを紹介。グループホーム・特養・デイサービスの人員配置基準やシフト作成の効率化方法を解説します。" />
      </Helmet>

      <nav className="blog-nav">
        <div className="blog-nav-container">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">🏥</span>
            <span className="nav-logo-text">CareShift</span>
          </Link>
          <div className="nav-links">
            <Link to="/register" className="btn btn-primary">14日間無料で試す</Link>
          </div>
        </div>
      </nav>

      <div className="blog-header">
        <h1>お役立ちコラム</h1>
        <p>介護施設のシフト作成に役立つノウハウをお届けします</p>
      </div>

      <div className="blog-list">
        {blogArticles.map((article) => (
          <Link to={`/blog/${article.slug}`} key={article.slug} className="blog-card">
            <div className="blog-card-category">{article.category}</div>
            <h2 className="blog-card-title">{article.title}</h2>
            <p className="blog-card-description">{article.description}</p>
            <div className="blog-card-meta">
              <span>{article.publishedAt}</span>
              <span>読了 約{article.readTime}分</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="blog-cta">
        <h2>シフト作成を自動化しませんか？</h2>
        <p>CareShiftなら、人員配置基準を満たしたシフト表をボタン1つで自動生成。<br />14日間無料でお試しいただけます。</p>
        <Link to="/register" className="btn btn-primary btn-lg">14日間無料で試す</Link>
        <p className="blog-cta-note">クレジットカード不要・スタッフ数無制限</p>
      </div>

      <footer className="blog-footer">
        <div className="blog-footer-links">
          <Link to="/">トップページ</Link>
          <Link to="/terms">利用規約</Link>
          <Link to="/privacy">プライバシーポリシー</Link>
          <Link to="/tokushoho">特定商取引法</Link>
        </div>
        <p>&copy; 2026 CareShift</p>
      </footer>
    </div>
  )
}

export default Blog
