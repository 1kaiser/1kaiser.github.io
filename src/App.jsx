import { Routes, Route } from "@solidjs/router";
import HomePage from './pages/HomePage';
import ModelDetailPage from './pages/ModelDetailPage';

function App() {
  return (
    <>
      <header>
        <div class="container">
          <h1>3D Model Gallery</h1>
        </div>
      </header>
      <main class="container">
        <Routes>
          <Route path="/" component={HomePage} />
          <Route path="/model/:id" component={ModelDetailPage} />
        </Routes>
      </main>
    </>
  );
}

export default App;
