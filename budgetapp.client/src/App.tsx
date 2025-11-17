import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Dashboard }  from "./Pages/Dashboard";
import { LoginPage } from "./Pages/Login";
import { BudgetPage } from "./Pages/Budget";
import { TransactionsPage } from "./Pages/Transactions";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage/>} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/transactions" element={<TransactionsPage/>} />
            </Routes>
        </Router>
    )
}
