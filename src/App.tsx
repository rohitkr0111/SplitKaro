import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreateGroup } from './pages/CreateGroup';
import { GroupDashboard } from './pages/GroupDashboard';
import { AddExpense } from './pages/AddExpense';
import { AddAdvance } from './pages/AddAdvance';
import { Receipt } from './pages/Receipt';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="pb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/groups/new" element={<CreateGroup />} />
              <Route path="/groups/:id" element={<GroupDashboard />} />
              <Route path="/groups/:id/expenses/new" element={<AddExpense />} />
              <Route path="/groups/:id/advance" element={<AddAdvance />} />
              <Route path="/groups/:id/receipt" element={<Receipt />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
