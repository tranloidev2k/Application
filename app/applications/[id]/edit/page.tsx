import { EditApplicationRoute } from '../../../../src/features/applications/EditApplicationRoute'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditApplicationRoute id={id} />
}
