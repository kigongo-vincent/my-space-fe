import { Route, Routes } from 'react-router'
import Spashscreen from '../pages/Spashscreen'
import DashboardRoutes from "./dashboard/Index"

const Index = () => {
    return (
        <Routes>
            <Route path='/' Component={Spashscreen} />
            <Route path='/dashboard' Component={DashboardRoutes} />
        </Routes>
    )
}

export default Index