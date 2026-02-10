'use client'

import { useEffect, useState } from 'react'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface SubscriptionStatusDebugProps {
    serverStatus: string | null
    isStripeEnabled: boolean
}

export function SubscriptionStatusDebug({ serverStatus, isStripeEnabled }: SubscriptionStatusDebugProps) {
    const { status, isActive, isLoading, error, refetch } = useSubscription()
    const [showDebug, setShowDebug] = useState(false)

    // Log status changes for debugging
    useEffect(() => {
        console.log('Subscription Status Debug:', {
            serverStatus,
            clientStatus: status,
            isActive,
            isLoading,
            error,
            isStripeEnabled
        })
    }, [serverStatus, status, isActive, isLoading, error, isStripeEnabled])

    // Check for inconsistencies between server and client status
    const hasInconsistency = serverStatus !== status && !isLoading
    const needsFix = hasInconsistency && (serverStatus === 'trialing' || status === 'trialing')

    if (!isStripeEnabled) {
        return null
    }

    return (
        <div className="space-y-4">
            {/* Status Alert */}
            {hasInconsistency && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <div>
                                <CardTitle className="text-sm text-amber-800">Status Inconsistency Detected</CardTitle>
                                <CardDescription className="text-amber-600">
                                    Server: {serverStatus || 'null'} | Client: {status || 'null'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button
                                onClick={refetch}
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                                Sync Status
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDebug(!showDebug)}
                            >
                                {showDebug ? 'Hide' : 'Show'} Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Debug Information */}
            {showDebug && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <div>
                                <CardTitle className="text-sm text-blue-800">Subscription Debug Info</CardTitle>
                                <CardDescription className="text-blue-600">
                                    Real-time subscription status tracking
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600">Server Status:</span>
                                <div className="font-mono text-blue-800">{serverStatus || 'null'}</div>
                            </div>
                            <div>
                                <span className="text-blue-600">Client Status:</span>
                                <div className="font-mono text-blue-800">{status || 'null'}</div>
                            </div>
                            <div>
                                <span className="text-blue-600">Is Active:</span>
                                <div className="font-mono text-blue-800">{isActive ? 'true' : 'false'}</div>
                            </div>
                            <div>
                                <span className="text-blue-600">Loading:</span>
                                <div className="font-mono text-blue-800">{isLoading ? 'true' : 'false'}</div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">Error: {error}</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={refetch}
                                size="sm"
                                variant="outline"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}