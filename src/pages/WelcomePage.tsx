import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/field-error'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function WelcomePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setSubmitting(false)
      setError(updateError.message)
      return
    }

    const name = displayName.trim()
    if (name && session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', session.user.id)
      if (profileError) {
        setSubmitting(false)
        setError(profileError.message)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    }

    toast.success('You are all set.')
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Choose a display name and a password to finish setting up.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                autoComplete="nickname"
                placeholder="How friends see you"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <FieldError message={error ?? undefined} />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
