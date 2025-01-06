import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import IngredientsPage from "./pages/IngredientsPage";
import LoginPage from "./pages/LoginPage";
import MenuPage from "./pages/MenuPage";
import NotFoundPage from "./pages/NotFoundPage";
import RecipeFormPage from "./pages/RecipeFormPage";
import RecipePage from "./pages/RecipePage";
import RecipesPage from "./pages/RecipesPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/personal" element={<RecipesPage />} />
            <Route path="/recipes/favorite" element={<RecipesPage />} />
            <Route path="/recipes/create" element={<RecipeFormPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
            <Route path="/recipes/:id/cook" element={<RecipePage />} />
            <Route path="/recipes/:id/suggest" element={<RecipePage />} />
            <Route path="/recipes/:id" element={<RecipePage />} />
            <Route path="/kitchen" element={<IngredientsPage />} />
            <Route path="/suggest" element={<RecipesPage />} />
            <Route path="/admin/menu" element={<MenuPage />} />
            <Route path="/admin/recipes" element={<RecipesPage />} />
            <Route path="/admin/recipes/:id" element={<RecipePage />} />
            <Route path="/admin/ingredients" element={<IngredientsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
