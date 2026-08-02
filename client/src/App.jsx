import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function LoginPlaceholder() {
  return <h1>Login (placeholder)</h1>;
}

function RegisterPlaceholder() {
  return <h1>Register (placeholder)</h1>;
}

function DashboardPlaceholder() {
  return <h1>Dashboard (placeholder)</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/login" element={<LoginPlaceholder />} />
            <Route path="/register" element={<RegisterPlaceholder />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPlaceholder />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
