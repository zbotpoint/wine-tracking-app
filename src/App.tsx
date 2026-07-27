import { createBrowserRouter, RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout'
import { AuthProvider, RequireAuth } from '@/lib/auth'
import { LoginPage } from '@/pages/LoginPage'
import { WelcomePage } from '@/pages/WelcomePage'
import { BrowsePage } from '@/pages/BrowsePage'
import { LogTastingPage } from '@/pages/LogTastingPage'
import { WineDetailPage } from '@/pages/WineDetailPage'
import { WineEditPage } from '@/pages/WineEditPage'
import { TastingEditPage } from '@/pages/TastingEditPage'
import { StatsPage } from '@/pages/StatsPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <BrowsePage /> },
          { path: '/welcome', element: <WelcomePage /> },
          { path: '/log', element: <LogTastingPage /> },
          { path: '/wines/:id', element: <WineDetailPage /> },
          { path: '/wines/:id/edit', element: <WineEditPage /> },
          { path: '/tastings/:id/edit', element: <TastingEditPage /> },
          { path: '/stats', element: <StatsPage /> },
        ],
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </AuthProvider>
  )
}

export default App
