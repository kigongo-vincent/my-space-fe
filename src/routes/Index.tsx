import { Route, Routes } from 'react-router'
import Spashscreen from '../pages/Spashscreen'
import SignupSplash from '../pages/auth/SignupSplash'
import DashboardRoutes from "./dashboard/Index"
import Settings from '../pages/settings/Index'
import AdminRoutes from './admin/Index'
import NotFound from '../pages/NotFound'
import Layout from '../components/base/Layout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminProtectedRoute } from '../components/auth/AdminProtectedRoute'
import { PublicRoute } from '../components/auth/PublicRoute'

const Index = () => {
    return (
        <Routes>
            <Route path='/' element={
                <PublicRoute>
                    <Spashscreen />
                </PublicRoute>
            } />
            <Route path='/signup' element={
                <PublicRoute>
                    <SignupSplash />
                </PublicRoute>
            } />
            <Route path='/login' element={
                <PublicRoute>
                    <Spashscreen />
                </PublicRoute>
            } />
            <Route path='/dashboard' element={
                <ProtectedRoute>
                    <DashboardRoutes />
                </ProtectedRoute>
            } />
            <Route path='/settings' element={
                <ProtectedRoute>
                    <Layout>
                        <Settings />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path='/admin/*' element={
                <AdminProtectedRoute>
                    <AdminRoutes />
                </AdminProtectedRoute>
            } />
            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}

export default Index