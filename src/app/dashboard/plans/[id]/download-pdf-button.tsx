'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadPdfButtonProps {
  planId: string
}

function parseDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) return null
  const match = contentDisposition.match(/filename="?([^"]+)"?$/i)
  return match?.[1] || null
}

export function DownloadPdfButton({ planId }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/plans/${planId}/pdf`)
      if (!response.ok) {
        let message = 'Failed to generate PDF'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {
          // Keep generic message when response is not JSON
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = parseDownloadFilename(response.headers.get('content-disposition'))
      link.download = fileName || 'Sleep_Plan.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  )
}
