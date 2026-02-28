import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-4xl font-bold text-brand-purple mb-4">REDAPSI v2</h1>
              <p className="text-lg text-slate-600">Plataforma de gestión de psicología feminista.</p>
              <div className="mt-8 p-4 bg-white rounded-lg shadow-md border border-brand-purple/20">
                <p className="text-sm font-medium">Estado: <span className="text-green-600">Servicio Web Activo</span></p>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
