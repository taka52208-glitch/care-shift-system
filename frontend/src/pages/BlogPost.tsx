import { useParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { blogArticles } from '../content/blogArticles'
import './Blog.css'

function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const article = blogArticles.find(a => a.slug === slug)

  if (!article) {
    return <Navigate to="/blog" replace />
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'CareShift'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CareShift',
      url: 'https://care-shift-system.vercel.app'
    }
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>{article.title}｜CareShift</title>
        <meta name="description" content={article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <nav className="blog-nav">
        <div className="blog-nav-container">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">🏥</span>
            <span className="nav-logo-text">CareShift</span>
          </Link>
          <div className="nav-links">
            <Link to="/blog" className="nav-link">コラム一覧</Link>
            <Link to="/register" className="btn btn-primary">14日間無料で試す</Link>
          </div>
        </div>
      </nav>

      <article className="blog-article">
        <div className="blog-article-header">
          <div className="blog-article-category">{article.category}</div>
          <h1>{article.title}</h1>
          <div className="blog-article-meta">
            <time dateTime={article.publishedAt}>{article.publishedAt} 公開</time>
            <span>読了 約{article.readTime}分</span>
          </div>
        </div>

        <div className="blog-article-content">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        <div className="blog-article-cta">
          <h3>CareShiftでシフト作成を自動化</h3>
          <p>人員配置基準を自動チェック。夜勤も公平に自動分配。<br />月額9,800円・スタッフ数無制限。</p>
          <Link to="/register" className="btn btn-primary btn-lg">14日間無料で試す（カード不要）</Link>
        </div>
      </article>

      <footer className="blog-footer">
        <div className="blog-footer-links">
          <Link to="/">トップページ</Link>
          <Link to="/blog">コラム一覧</Link>
          <Link to="/terms">利用規約</Link>
          <Link to="/privacy">プライバシーポリシー</Link>
        </div>
        <p>&copy; 2026 CareShift</p>
      </footer>
    </div>
  )
}

export default BlogPost
