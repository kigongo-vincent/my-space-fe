import { Route, Routes } from 'react-router'
import Spashscreen from '../pages/Spashscreen'

const Index = () => {
    return (
        <Routes>
            <Route path='/' Component={Spashscreen} />
        </Routes>
    )
}

export default Index