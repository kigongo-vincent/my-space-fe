import { Route, Routes } from "react-router"
import Dashboard from "../../pages/dashboard/Index"
import Layout from "../../components/base/Layout"

const Index = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" Component={Dashboard} />
            </Routes>
        </Layout>
    )
}

export default Index