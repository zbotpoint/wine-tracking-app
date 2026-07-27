import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BarChart3, LogOut, Plus, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, AUTH_LINK_TYPE } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirected = useRef(false)

  // Invite/recovery links land authenticated but without a chosen password.
  useEffect(() => {
    if (AUTH_LINK_TYPE && !redirected.current && location.pathname !== '/welcome') {
      redirected.current = true
      navigate('/welcome', { replace: true })
    }
  }, [navigate, location.pathname])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Wine className="size-5 text-chart-1" />
            <span className="max-sm:hidden">Wine Log</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <Wine className="size-4 sm:hidden" />
              <span className="max-sm:sr-only">Browse</span>
            </NavLink>
            <NavLink to="/stats" className={navLinkClass}>
              <BarChart3 className="size-4 sm:hidden" />
              <span className="max-sm:sr-only">Stats</span>
            </NavLink>
            <Button asChild size="sm">
              <Link to="/log">
                <Plus className="size-4" />
                Log a wine
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
