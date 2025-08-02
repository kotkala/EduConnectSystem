interface ViolationRecordFormProps {
  onSuccess?: () => void
}

export default function ViolationRecordForm({ onSuccess }: Readonly<ViolationRecordFormProps>) {
  return <div>Placeholder component - onSuccess: {onSuccess ? 'provided' : 'not provided'}</div>
}