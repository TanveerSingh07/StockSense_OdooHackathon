'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ValidateButton({ receiptId, status }: { receiptId: string, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'DONE') return <span className="text-green-600 font-bold">Validated</span>;

  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DONE' }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || await res.text());
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleValidate} disabled={loading} size="sm">
      {loading ? 'Validating...' : 'Validate & Receive Stock'}
    </Button>
  );
}
