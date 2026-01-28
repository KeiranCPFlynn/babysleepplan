'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadPdfButtonProps {
  babyName: string
  babyAge: string
  createdDate: string
  planContent: string
}

export function DownloadPdfButton({ babyName, babyAge, createdDate, planContent }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)

    try {
      // Dynamic imports for client-side only
      const { pdf } = await import('@react-pdf/renderer')
      const { SleepPlanPDF } = await import('@/components/pdf/sleep-plan-pdf')

      // Generate PDF blob
      const blob = await pdf(
        <SleepPlanPDF
          babyName={babyName}
          babyAge={babyAge}
          createdDate={createdDate}
          content={planContent}
        />
      ).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${babyName.replace(/[^a-z0-9]/gi, '_')}_Sleep_Plan.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try the Print option instead.')
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
