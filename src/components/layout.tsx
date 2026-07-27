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
      {/* pt/bottom insets keep the chrome clear of the iOS status bar and home
          indicator when launched as a home-screen app. */}
      <header className="sticky top-0 z-40 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
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
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-24">
        <Outlet />
      </main>
      {location.pathname !== '/log' && (
        <Button
          asChild
          size="icon"
          className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-lg"
        >
          <Link to="/log" aria-label="Log a wine" className="gap-0">
            <Plus className="size-5" strokeWidth={3} />
            <Wine className="size-6" strokeWidth={2.5} />
          </Link>
        </Button>
      )}
    </div>
  )
}
