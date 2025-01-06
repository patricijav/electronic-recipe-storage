import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import colors from "../colors";
import defaultRecipeImage from "../assets/default_recipe.png";
import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import Loading from "../components/Loading";
import evaluateIcon from "/src/assets/evaluate.svg";

function RecipesPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function

  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  let viewMode = null;
  const headings = {
    public: "Publiskās Receptes",
    personal: "Manas Receptes",
    favorite: "Mīļākās Receptes",
    admin: "Receptes",
    suggest: "Ieteiktās Receptes",
  };

  // Check the pathname to determine the current route
  if (location.pathname === "/recipes") {
    viewMode = "public";
  } else if (location.pathname === "/recipes/personal") {
    viewMode = "personal";
  } else if (location.pathname === "/recipes/favorite") {
    viewMode = "favorite";
  } else if (location.pathname === "/admin/recipes") {
    viewMode = "admin";
  } else if (location.pathname === "/suggest") {
    viewMode = "suggest";
  }

  // Fetch the recipes when the component mounts
  useEffect(() => {
    if (!authChecked) return; // Wait for the authentication check to complete
    //if (viewMode === "public" && !authChecked) return;
    //if (authChecked && isAuthenticated && !user) return;
    //if (!authChecked || !isAuthenticated || !user) return;

    async function fetchRecipes() {
      try {
        console.log(user);
        console.log(viewMode);
        const response = await axios.get("http://localhost:3000/recipes", {
          params: {
            userId: user?.userId, // Only pass user.user_id if it's available
            viewMode: viewMode, // Pass viewMode to the API,
          },
        });
        setRecipes(response.data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    }

    fetchRecipes();
  }, [authChecked]);
  // authChecked, user, viewMode

  // By some error testing seems that these need to be after useEffect

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    return <Loading />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated && viewMode !== "public") {
    navigate("/login");
    return;
  } else if (isAuthenticated && user.isAdmin && viewMode !== "admin") {
    navigate("/admin/menu");
    return;
  } else if (isAuthenticated && !user.isAdmin && viewMode === "admin") {
    navigate("/menu");
    return;
  }

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title={headings[viewMode]} user={user} />
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Meklēt receptes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>
      {filteredRecipes.length > 0 ? (
        <Grid>
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.recipe_id}>
              <StyledLink
                to={`${viewMode === "admin" ? "/admin" : ""}/recipes/${
                  recipe.recipe_id
                }${viewMode === "suggest" ? "/suggest" : ""}`}
              >
                <Image
                  src={
                    recipe.photo_file_name
                      ? `http://localhost:3000/images/${recipe.photo_file_name}`
                      : defaultRecipeImage
                  }
                />
                {viewMode === "admin" && recipe.visibility === 1 && (
                  <Icon src={evaluateIcon} alt="Button Image" />
                )}
                <Text
                  style={{
                    color: recipe.scores
                      ? recipe.scores[1] === 0 && recipe.scores[2] === 0
                        ? "#24A124"
                        : recipe.scores[2] === 0
                        ? "#CDA70E"
                        : "#C11010"
                      : undefined,
                  }}
                >
                  {recipe.name}
                </Text>
              </StyledLink>
            </Card>
          ))}
        </Grid>
      ) : (
        <NoRecipesMessage>Šādu recepšu nav!</NoRecipesMessage>
      )}
    </div>
  );
}

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const NoRecipesMessage = styled.div`
  text-align: center;
  font-size: 1.8em;
`;

const SearchContainer = styled.div`
  margin: 20px;
  text-align: center;
`;

const SearchInput = styled.input`
  width: 300px;
  padding: 10px;
  font-size: 1em;
  border: 2px solid #ccc;
  border-radius: 4px;
  color: #201409; /* Text color */
  background-color: #f9f9f9; /* Slightly off-white background */
  padding: 10px 15px; /* Comfortable padding */

  &::placeholder {
    color: #aaa; /* Lighter placeholder color */
    font-style: italic; /* Optional: distinguish placeholder text */
  }

  &:focus {
    outline: none;
    border-color: ${colors.highlight};
  }
`;

const Grid = styled.div`
  display: grid; /* Use grid layout */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  justify-items: center; /* Center items horizontally */
`;

const Card = styled.div`
  width: 200px;
  &:hover {
    text-decoration: underline;
  }
`;

const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  font-size: 1.2em;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Image = styled.img`
  object-fit: cover;
  width: 200px;
  height: 200px;
`;

const Text = styled.span`
  text-align: center; /* Ensure text is centered inside */
  width: 100%;
  display: block;
`;

export default RecipesPage;
