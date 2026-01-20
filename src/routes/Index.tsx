import { Route, Routes } from 'react-router'
import Spashscreen from '../pages/Spashscreen'
import SignupSplash from '../pages/auth/SignupSplash'
import DashboardRoutes from "./dashboard/Index"
import Settings from '../pages/settings/Index'
import AdminRoutes from './admin/Index'
import Layout from '../components/base/Layout'

const Index = () => {
    return (
        <Routes>
            <Route path='/' Component={Spashscreen} />
            <Route path='/signup' Component={SignupSplash} />
            <Route path='/dashboard' Component={DashboardRoutes} />
            <Route path='/settings' element={
                <Layout>
                    <Settings />
                </Layout>
            } />
            <Route path='/admin/*' element={<AdminRoutes />} />
        </Routes>
    )
}

export default Index