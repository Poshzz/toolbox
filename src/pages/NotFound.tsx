import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="wrap flex flex-col items-center py-24 text-center">
      <p className="overline">Error 404</p>
      <h1 className="mt-4 font-display text-6xl tracking-tight">ไม่พบหน้านี้</h1>
      <p className="mt-4 text-sm text-inksoft">
        ลิงก์อาจเก่าไปแล้ว หรือเครื่องมือนี้ยังไม่มีในกล่อง
      </p>
      <Link to="/" className="btn btn-primary mt-8 px-6">
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
