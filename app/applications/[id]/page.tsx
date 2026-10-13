import { ApplicationDetailRoute } from '../../../src/features/applications/ApplicationDetailRoute'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApplicationDetailRoute id={id} />
}
