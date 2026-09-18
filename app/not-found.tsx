import Link from 'next/link'

export default function NotFound() {
  return <div className="page">
    <div className="empty-state large">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại.</p>
      <Link className="primary" href="/">Về tổng quan</Link>
    </div>
  </div>
}
