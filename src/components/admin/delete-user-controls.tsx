'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

export function DeleteUserControls() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!email.trim()) {
      setMessage('Error: Please enter an email address.')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    try {
      setIsLoading(true)
      setMessage('')

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
      } else {
        const d = data.deleted
        setMessage(
          `Deleted ${d.email}: ${d.babies} babies, ${d.plans} plans, ${d.diaryEntries} diary entries.` +
          (d.stripeCustomerDeleted ? ' Stripe customer deleted.' : '')
        )
        setEmail('')
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Trash2 className="h-5 w-5 text-red-600" />
          <div>
            <CardTitle className="text-lg text-red-800">Delete User</CardTitle>
            <CardDescription className="text-red-600">
              Permanently delete a user and all their data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delete-user-email" className="text-red-800">
            User Email
          </Label>
          <div className="flex gap-2">
            <Input
              id="delete-user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-red-200"
              disabled={isLoading}
            />
            <Button
              onClick={handleDelete}
              disabled={isLoading || !email.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
          <p className="text-xs text-red-600">
            Deletes the user, all babies, plans, diary entries, and Stripe customer.
          </p>
        </div>

        {showConfirm && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg space-y-3">
            <p className="text-sm font-medium text-red-900">
              Are you sure you want to permanently delete <strong>{email}</strong> and all their data? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="border-red-300 text-red-800 hover:bg-red-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg border ${
            message.startsWith('Error')
              ? 'bg-red-100 border-red-300'
              : 'bg-green-100 border-green-300'
          }`}>
            <p className={`text-sm ${
              message.startsWith('Error') ? 'text-red-800' : 'text-green-800'
            }`}>
              {message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
