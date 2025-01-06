import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import HeavyButton from "../components/HeavyButton";
import LightButton from "../components/LightButton";
import Loading from "../components/Loading";
import basicUserAvatar from "/src/assets/basic_user.svg";
import favoriteIcon from "/src/assets/heart_filled.svg";
import ingredientIcon from "/src/assets/ingredient.svg";
import kitchenIcon from "/src/assets/kitchen.svg";
import personalIcon from "/src/assets/personal.svg";
import createIcon from "/src/assets/plus.svg";
import publicIcon from "/src/assets/public.svg";
import recipeIcon from "/src/assets/recipe.svg";
import suggestIcon from "/src/assets/suggest.svg";

function MenuPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function

  let mode = null;
  // Check the path name to determine the current route
  if (location.pathname === "/menu") {
    mode = "basic";
  } else {
    // location.pathname ==== "/admin/menu"
    mode = "admin";
  }

  async function logout() {
    try {
      const response = await axios.post(
        "http://localhost:3000/users/logout",
        {},
        {
          headers: { Authorization: localStorage.getItem("token") },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error logging out:", error);
    }
    localStorage.removeItem("token");
    navigate("/");
  }

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    return <Loading />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    navigate("/login");
    return;
  } else if (mode === "basic" && user.isAdmin) {
    navigate("/admin/menu");
    return;
  } else if (mode === "admin" && !user.isAdmin) {
    navigate("/menu");
    return;
  }

  return (
    <Menu>
      <Header title="Sadaļas" user={user} />
      <MenuContent>
        {mode === "basic" && (
          <>
            <LightButton
              to="/recipes/personal"
              image={personalIcon}
              title="Manas Receptes"
            />
            <LightButton
              to="/recipes/favorite"
              image={favoriteIcon}
              title="Mīļākās Receptes"
            />
            <LightButton
              to="/recipes"
              image={publicIcon}
              title="Publiskās Receptes"
            />
            <LightButton
              to="/recipes/create"
              image={createIcon}
              title="Jauna Recepte"
            />
            <LightButton
              to="/kitchen"
              image={kitchenIcon}
              title="Kas ir manās mājās?"
            />
            <LightButton
              to="/suggest"
              image={suggestIcon}
              title="Ieteikt Recepti"
            />
          </>
        )}
        {mode === "admin" && (
          <>
            <LightButton
              to="/admin/recipes"
              image={recipeIcon}
              title="Receptes"
            />
            <LightButton
              to="/admin/ingredients"
              image={ingredientIcon}
              title="Sastāvdaļas"
            />
            <LightButton
              to="/admin/users"
              image={basicUserAvatar}
              title="Lietotāji"
            />
          </>
        )}
        <HeavyButton title="Atslēgties" onClick={logout} />
      </MenuContent>
    </Menu>
  );
}

const Menu = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
`;

const MenuContent = styled.div`
  flex: 1; /* Take up remaining space */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center vertically within div2 */
  align-items: center; /* Center horizontally within div2 */
  gap: 1rem;
  & > * {
    width: 300px;
  }
`;

export default MenuPage;
