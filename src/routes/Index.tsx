import { Route, Routes } from 'react-router'
import Spashscreen from '../pages/Spashscreen'
import DashboardRoutes from "./dashboard/Index"
import Settings from '../pages/settings/Index'
import Layout from '../components/base/Layout'

const Index = () => {
    return (
        <Routes>
            <Route path='/' Component={Spashscreen} />
            <Route path='/dashboard' Component={DashboardRoutes} />
            <Route path='/settings' element={
                <Layout>
                    <Settings />
                </Layout>
            } />
        </Routes>
    )
}

export default Index