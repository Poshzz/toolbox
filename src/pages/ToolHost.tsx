import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { getTool } from '../data/tools'
import PageShell from '../components/PageShell'
import NotFound from './NotFound'

export default function ToolHost() {
  const { id } = useParams()
  const tool = id ? getTool(id) : undefined

  if (!tool) return <NotFound />

  const Comp = tool.component
  return (
    <PageShell tool={tool}>
      <Suspense
        fallback={
          <div className="card flex items-center justify-center p-16 text-sm text-inksoft">
            กำลังโหลดเครื่องมือ…
          </div>
        }
      >
        <Comp />
      </Suspense>
    </PageShell>
  )
}
