import { Route, Routes } from 'react-router'
import AdminDashboard from '../../pages/admin/Dashboard'
import UserManagement from '../../pages/admin/UserManagement'
import UserDetails from '../../pages/admin/UserDetails'
import StorageOverview from '../../pages/admin/StorageOverview'
import Analytics from '../../pages/admin/Analytics'
import ActivityLog from '../../pages/admin/ActivityLog'
import AdminSettings from '../../pages/admin/AdminSettings'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminRoutes = () => {
    return (
        <AdminLayout>
            <Routes>
                <Route path="/" Component={AdminDashboard} />
                <Route path="/users" Component={UserManagement} />
                <Route path="/users/:userId" Component={UserDetails} />
                <Route path="/storage" Component={StorageOverview} />
                <Route path="/analytics" Component={Analytics} />
                <Route path="/activity" Component={ActivityLog} />
                <Route path="/settings" Component={AdminSettings} />
            </Routes>
        </AdminLayout>
    )
}

export default AdminRoutes
