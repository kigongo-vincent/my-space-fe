import { Route, Routes, Navigate } from "react-router"
import Dashboard from "../../pages/dashboard/Index"
import Layout from "../../components/base/Layout"

const Index = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" Component={Dashboard} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Layout>
    )
}

export default Index