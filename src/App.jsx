import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProviderList from './pages/ProviderList';
import { DataProvider } from './context/data-context';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProviderList />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
