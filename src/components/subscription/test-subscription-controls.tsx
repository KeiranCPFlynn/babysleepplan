'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wrench } from 'lucide-react'
import Link from 'next/link'

interface Baby {
    id: string
    name: string
}

interface PlanOption {
    id: string
    status: string
    created_at: string
    baby?: { name?: string | null } | null
}

interface TestSubscriptionControlsProps {
    babies?: Baby[]
    plans?: PlanOption[]
}

export function TestSubscriptionControls({ babies = [], plans = [] }: TestSubscriptionControlsProps) {
    const [trialOverride, setTrialOverride] = useState('0')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [selectedBabyId, setSelectedBabyId] = useState('')
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [seededIntakeId, setSeededIntakeId] = useState<string | null>(null)

    const handleSetTrialOverride = async () => {
        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'setTrialOverride',
                    value: parseInt(trialOverride),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setMessage(`Trial override set to ${trialOverride} days. Next checkout will use this value.`)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEndTrialNow = async () => {
        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'endTrialNow' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setMessage('Trial ended. Stripe will now attempt payment. Page will reload.')
                setTimeout(() => window.location.reload(), 2000)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSeedBaby = async () => {
        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'baby' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setMessage('Test baby created. Refreshing...')
                setTimeout(() => window.location.reload(), 1000)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSeedIntake = async () => {
        if (!selectedBabyId) {
            setMessage('Please select a baby first.')
            return
        }

        try {
            setIsLoading(true)
            setMessage('')
            setSeededIntakeId(null)

            const response = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'intake', babyId: selectedBabyId }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setSeededIntakeId(data.intakeId)
                setMessage('Mock intake created (status: draft). Open it to review and submit when ready.')
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetSubscription = async () => {
        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resetSubscription' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setMessage('Subscription reset. You can now re-test the full intake flow.')
                setTimeout(() => window.location.reload(), 1500)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePurgePlansAndDiaries = async () => {
        const confirmed = window.confirm(
            'Delete all plans and related diary data for your account? This cannot be undone.'
        )
        if (!confirmed) return

        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'purgePlansAndDiaries', value: 'PURGE' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                const deleted = data.deleted || {}
                setMessage(
                    `Purged plans (${deleted.plans || 0}), diary entries (${deleted.diaryEntries || 0}), weekly reviews (${deleted.weeklyReviews || 0}), and plan revisions (${deleted.planRevisions || 0}). Refreshing...`
                )
                setTimeout(() => window.location.reload(), 1500)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSeedDiaryDays = async (days: number) => {
        if (!selectedPlanId) {
            setMessage('Please select a plan first.')
            return
        }

        try {
            setIsLoading(true)
            setMessage('')

            const response = await fetch('/api/diary/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selectedPlanId, days }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(`Error: ${data.error}`)
            } else {
                setMessage(`Seeded ${data.days || days} days of diary entries for the selected plan.`)
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <div>
                        <CardTitle className="text-lg text-orange-800">Test Controls</CardTitle>
                        <CardDescription className="text-orange-600">
                            Admin tools for testing Stripe integration
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="trial-override" className="text-orange-800">
                        Trial Days Override
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="trial-override"
                            type="number"
                            value={trialOverride}
                            onChange={(e) => setTrialOverride(e.target.value)}
                            className="border-orange-200 w-24"
                            min="0"
                            max="365"
                        />
                        <Button
                            onClick={handleSetTrialOverride}
                            disabled={isLoading}
                            variant="outline"
                            className="border-orange-300 text-orange-800 hover:bg-orange-100"
                        >
                            {isLoading ? 'Saving...' : 'Set Override'}
                        </Button>
                    </div>
                    <p className="text-xs text-orange-600">
                        Set to 0 to skip trial and charge immediately on next checkout.
                    </p>
                </div>

                <div className="border-t border-orange-200 pt-4 space-y-3">
                    <Button
                        onClick={handleEndTrialNow}
                        disabled={isLoading}
                        variant="outline"
                        className="border-orange-300 text-orange-800 hover:bg-orange-100"
                    >
                        {isLoading ? 'Ending trial...' : 'End Trial Now'}
                    </Button>
                    <p className="text-xs text-orange-600">
                        Ends the trial immediately. Stripe will attempt to charge the card.
                    </p>
                </div>

                <div className="border-t border-orange-200 pt-4">
                    <Button
                        onClick={handleResetSubscription}
                        disabled={isLoading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Subscription'}
                    </Button>
                    <p className="text-xs text-orange-600 mt-2">
                        Sets status to inactive and clears Stripe customer ID. Re-test the full flow.
                    </p>
                </div>

                <div className="border-t border-red-200 pt-4">
                    <Button
                        onClick={handlePurgePlansAndDiaries}
                        disabled={isLoading}
                        variant="destructive"
                    >
                        {isLoading ? 'Purging...' : 'Purge Plans & Diaries'}
                    </Button>
                    <p className="text-xs text-red-700 mt-2">
                        Admin-only cleanup for test accounts. Deletes all plans and associated diary data.
                    </p>
                </div>

                <div className="border-t border-orange-200 pt-4 space-y-3">
                    <Label className="text-orange-800 font-medium">Seed Test Data</Label>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSeedBaby}
                            disabled={isLoading}
                            variant="outline"
                            className="border-orange-300 text-orange-800 hover:bg-orange-100"
                        >
                            {isLoading ? 'Creating...' : 'Seed Baby'}
                        </Button>
                        <p className="text-xs text-orange-600 self-center">
                            Creates a 6-month-old test baby.
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Select value={selectedBabyId} onValueChange={setSelectedBabyId}>
                            <SelectTrigger className="w-40 border-orange-200">
                                <SelectValue placeholder="Select baby" />
                            </SelectTrigger>
                            <SelectContent>
                                {babies.map((baby) => (
                                    <SelectItem key={baby.id} value={baby.id}>
                                        {baby.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSeedIntake}
                            disabled={isLoading || !selectedBabyId}
                            variant="outline"
                            className="border-orange-300 text-orange-800 hover:bg-orange-100"
                        >
                            {isLoading ? 'Creating...' : 'Seed Intake'}
                        </Button>
                    </div>
                    <p className="text-xs text-orange-600">
                        Creates a pre-filled draft intake so you can test submit/payment without typing everything.
                    </p>
                </div>

                <div className="border-t border-orange-200 pt-4 space-y-3">
                    <Label className="text-orange-800 font-medium">Seed Diary Entries</Label>
                    <div className="flex gap-2 items-center">
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger className="w-56 border-orange-200">
                                <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {(plan.baby?.name || 'Baby') + ` (${plan.status})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => handleSeedDiaryDays(3)}
                            disabled={isLoading || !selectedPlanId}
                            variant="outline"
                            className="border-orange-300 text-orange-800 hover:bg-orange-100"
                        >
                            {isLoading ? 'Seeding...' : 'Seed 3 Days'}
                        </Button>
                    </div>
                    <p className="text-xs text-orange-600">
                        Adds 3 days of diary data so you can test the 3-day review/update flow quickly.
                    </p>
                </div>

                {message && (
                    <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">{message}</p>
                        {seededIntakeId && (
                            <div className="mt-3">
                                    <Button
                                    asChild
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    <Link href={`/dashboard/intake/${seededIntakeId}`}>
                                        Open Seeded Intake
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
