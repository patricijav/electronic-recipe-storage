import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";

import defaultRecipeImage from "../assets/default_recipe.png";
import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import LightButton from "../components/LightButton";
import Loading from "../components/Loading";
import cookIcon from "/src/assets/cook.svg";
import editIcon from "/src/assets/edit.svg";
import heartEmptyIcon from "/src/assets/heart_empty.svg";
import heartFilledIcon from "/src/assets/heart_filled.svg";
import personalIcon from "/src/assets/lock.svg";
import printIcon from "/src/assets/print.svg";
import publicIcon from "/src/assets/public.svg";
import deleteIcon from "/src/assets/trash.svg";
import waitingIcon from "/src/assets/clock.svg";

function RecipePage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function
  const location = useLocation();

  // From the route access "id" parameter
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [userIngredients, setUserIngredients] = useState(null);
  // Step state to track which steps and ingredients have been clicked on (for cooking mode)
  const [completedSteps, setCompletedSteps] = useState([]);
  const [usedIngredients, setUsedIngredients] = useState([]);

  let mode = null;

  // Check the pathname to determine the current route
  if (location.pathname === `/recipes/${id}/cook`) {
    mode = "cook";
    console.log(`Cooking recipe with ID: ${id}`);
  } else if (location.pathname === `/recipes/${id}/suggest`) {
    mode = "suggest";
    console.log(`Viewing suggested recipe with ID: ${id}`);
  } else if (location.pathname === `/recipes/${id}`) {
    mode = "basic";
    console.log(`Viewing recipe with ID: ${id}`);
  } else if (location.pathname === `/admin/recipes/${id}`) {
    mode = "admin";
    console.log(`Admin viewing recipe with ID: ${id}`);
  }

  async function fetchRecipe() {
    try {
      const response = await axios.get(`http://localhost:3000/recipes/${id}`, {
        headers: { Authorization: localStorage.getItem("token") },
        params: {
          mode: mode,
        },
      });
      setRecipe(response.data);
      console.log(response.data); // These are called twice, later check why
      if (response.data.kitchen) {
        const ingredientsObject = response.data.kitchen.reduce(
          (acc, ingredient) => {
            acc[ingredient.ingredient_id] = {
              status: ingredient.status,
              difference: ingredient.difference || undefined, // Only include `difference` if it exists
            };
            return acc;
          },
          {}
        );
        setUserIngredients(ingredientsObject);
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
    }
  }

  // Fetch the recipe when the component mounts or the `id` changes
  useEffect(() => {
    fetchRecipe();
  }, [id]); // Dependency array includes `id`

  async function evaluateRecipe(accept) {
    console.log(
      `You (an administrator) decided to make the recipe ${
        accept ? "public" : "private"
      }!`
    );
    try {
      // As we will be calling PUT /recipes/:id, which handles multiple types of data updating (including photos), we need to send it as FormData

      // Create FormData object
      const formData = new FormData();

      formData.append("mode", "admin");

      formData.append("accept", accept.toString());

      const response = await axios.put(
        `http://localhost:3000/recipes/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);
      navigate("/admin/recipes");
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteRecipe() {
    console.log("You called deleteRecipe");

    try {
      const response = await axios.delete(
        `http://localhost:3000/recipes/${id}`
      );
      console.log(response.data);
      navigate("/recipes/personal");
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleRecipeParams(putMode, positive) {
    //console.log("You called toggleFavoriteRecipe with", putMode, positive);

    if (putMode === "public" && positive) {
      //console.log("Check if all ingredients are public");
      let waitingIngredients = [];
      let privateIngredients = [];
      //console.log(recipe.ingredients);
      recipe.ingredients.map((ingredient, index) => {
        if (ingredient.visibility == 1)
          waitingIngredients.push(ingredient.name);
        else if (ingredient.visibility == 0)
          privateIngredients.push(ingredient.name);
      });

      // console.log("Waiting ingredients", waitingIngredients);
      // console.log("Private ingredients", privateIngredients);

      if (waitingIngredients.length >= 1 || privateIngredients.length >= 1) {
        const message = `Lai recepti uztaisītu par publisku, visām sastāvdaļām ir jābūt publiskām.
Jums ir ${
          waitingIngredients.length
        } sastāvdaļa(s), kas gaida administratora apstiprinājumu (${waitingIngredients.join(
          ", "
        )}) un ${
          privateIngredients.length
        } privāta(s) sastāvdaļa(s) (${privateIngredients.join(", ")}).
Lai recepti padarītu par publisku, samainiet sastāvdaļas uz citām, publiskām sastāvdaļām, vai arī gaidiet apstiprinājumu Jūsu veidotajām.`;
        alert(message);
        return;
      }
    }

    try {
      // As we will be calling PUT /recipes/:id, which handles multiple types of data updating (including photos), we need to send it as FormData

      // Create FormData object
      const formData = new FormData();

      formData.append("mode", putMode);

      if (putMode === "favorite") {
        formData.append("makeFavorite", positive.toString());
      } else {
        formData.append("setToPublic", positive.toString());
      }

      const response = await axios.put(
        `http://localhost:3000/recipes/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      console.log(response.data);
      if (putMode === "favorite") {
        setRecipe((prevRecipe) => ({
          ...prevRecipe,
          is_favorite: positive,
        }));
      } else {
        // putMode === "public"
        fetchRecipe();
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Toggle step completion
  const toggleStep = (stepId) => {
    if (mode === "cook") {
      setCompletedSteps((prevCompletedSteps) => {
        if (prevCompletedSteps.includes(stepId)) {
          // If it's already clicked, remove it (undo the strikethrough)
          return prevCompletedSteps.filter((id) => id !== stepId);
        } else {
          // If it's not clicked, add it (apply strikethrough)
          return [...prevCompletedSteps, stepId];
        }
      });
    }
  };

  // Toggle ingredient completion
  const toggleIngredient = (ingredientId) => {
    if (mode === "cook") {
      setUsedIngredients((prevUsedIngredients) => {
        if (prevUsedIngredients.includes(ingredientId)) {
          // If it's already clicked, remove it (undo the strikethrough)
          return prevUsedIngredients.filter((id) => id !== ingredientId);
        } else {
          // If it's not clicked, add it (apply strikethrough)
          return [...prevUsedIngredients, ingredientId];
        }
      });
    }
  };

  // Only render everything else once the auth check is complete
  if (!authChecked || !recipe) {
    return <Loading />;
  }

  // If user wants it public and administrator has accepted it for public
  const viewerIsAuthor = isAuthenticated
    ? user.userId === recipe.author.user_id
    : false;

  // Redirect unauthenticated users (everyone can see public recipes, only authors can see private recipes)
  if (
    !isAuthenticated &&
    (!["basic", "cook"].includes(mode) || recipe.recipe.visibility !== 2)
  ) {
    navigate("/login");
    return;
  } else if (
    isAuthenticated &&
    user.isAdmin &&
    (mode !== "admin" || recipe.recipe.visibility === 0)
  ) {
    navigate("/admin/menu");
    return;
  } else if (
    isAuthenticated &&
    !user.isAdmin &&
    (mode === "admin" || (!viewerIsAuthor && recipe.recipe.visibility !== 2))
  ) {
    navigate("/menu");
    return;
  }

  return (
    <PageContainer>
      <Header title={recipe.recipe.name} user={user} makeSmall={true} />
      <Content>
        <LeftColumn>
          <img
            src={
              recipe.recipe.photo_file_name
                ? `http://localhost:3000/images/${recipe.recipe.photo_file_name}`
                : defaultRecipeImage
            }
            style={{ width: "200px", height: "200px", objectFit: "cover" }}
          />
          {viewerIsAuthor && (
            <>
              <h2 className="no-print">Statuss:</h2>
              <StatusWrapper className="no-print">
                <Icon
                  src={
                    recipe.recipe.visibility === 2
                      ? publicIcon
                      : recipe.recipe.visibility === 1
                      ? waitingIcon
                      : personalIcon
                  }
                  alt="Button Image"
                />
                <h3>
                  {recipe.recipe.visibility === 2
                    ? "Publiska"
                    : recipe.recipe.visibility === 1
                    ? "Izvērtēšanā"
                    : "Privāta"}
                </h3>
              </StatusWrapper>
            </>
          )}
          <h2>Autors:</h2>
          <h3>
            {recipe.author.first_name} {recipe.author.last_name}
          </h3>
          <h2>Enerģētiskā vērtība:</h2>
          <h3>{Math.round(recipe.calories)} kalorijas</h3>
          <h2>Sastāvdaļas:</h2>
          {recipe.ingredients.map((ingredient, index) => (
            <h3
              key={ingredient.ingredient_id}
              onClick={() => toggleIngredient(ingredient.ingredient_id)}
              style={{
                textDecoration:
                  mode === "cook" &&
                  usedIngredients.includes(ingredient.ingredient_id)
                    ? "line-through"
                    : "none",
                cursor: mode === "cook" ? "pointer" : "default",
                color:
                  mode === "suggest" && userIngredients
                    ? userIngredients[ingredient.ingredient_id].status === 2
                      ? "#24A124"
                      : userIngredients[ingredient.ingredient_id].status === 1
                      ? "#CDA70E"
                      : "#C11010"
                    : undefined,
              }}
            >
              {index + 1}. {ingredient.name} ({parseFloat(ingredient.amount)}{" "}
              {ingredient.is_liquid ? "ml" : "g"})
              {userIngredients &&
              userIngredients[ingredient.ingredient_id]?.difference
                ? ` (${parseFloat(
                    userIngredients[ingredient.ingredient_id].difference
                  )} ${ingredient.is_liquid ? "ml" : "g"} pietrūkst)`
                : ""}
            </h3>
          ))}
        </LeftColumn>
        <RightColumn>
          <h2>Receptes gaita:</h2>
          {recipe.steps.map((step) => (
            <h3
              key={step.step_number}
              onClick={() => toggleStep(step.step_number)}
              style={{
                textDecoration:
                  mode === "cook" && completedSteps.includes(step.step_number)
                    ? "line-through"
                    : "none",
                cursor: mode === "cook" ? "pointer" : "default",
              }}
            >
              {step.step_number}. {step.instruction}
            </h3>
          ))}
        </RightColumn>
      </Content>
      <ButtonFooter>
        {mode === "admin" && (
          <LightButton
            image={personalIcon}
            title="Padarīt privātu"
            onClick={() => evaluateRecipe(false)}
          />
        )}
        {mode === "admin" && recipe.recipe.visibility !== 2 && (
          <LightButton
            image={publicIcon}
            title="Padarīt publisku"
            onClick={() => evaluateRecipe(true)}
          />
        )}
        {["basic", "suggest"].includes(mode) && (
          <LightButton
            to={`/recipes/${id}/cook`}
            image={cookIcon}
            title="Gatavot"
          />
        )}
        {mode === "cook" && (
          <LightButton
            to={`/recipes/${id}`}
            image={cookIcon}
            title="Beigt gatavot"
          />
        )}
        {["basic", "suggest"].includes(mode) && (
          <LightButton
            image={printIcon}
            title="Izprintēt"
            onClick={() => {
              window.print();
            }}
          />
        )}
        {["basic", "suggest"].includes(mode) &&
          isAuthenticated &&
          !viewerIsAuthor &&
          !recipe.is_favorite && (
            <LightButton
              image={heartEmptyIcon}
              title="Pievienot mīļākajām receptēm"
              onClick={() => toggleRecipeParams("favorite", true)}
            />
          )}
        {["basic", "suggest"].includes(mode) &&
          isAuthenticated &&
          !viewerIsAuthor &&
          recipe.is_favorite && (
            <LightButton
              image={heartFilledIcon}
              title="Noņemt no mīļākajām receptēm"
              onClick={() => toggleRecipeParams("favorite", false)}
            />
          )}
        {["basic", "suggest"].includes(mode) && viewerIsAuthor && (
          <LightButton
            to={`/recipes/${id}/edit`}
            image={editIcon}
            title="Labot"
          />
        )}
        {["basic", "suggest"].includes(mode) &&
          viewerIsAuthor &&
          recipe.recipe.visibility === 0 && (
            <LightButton
              image={publicIcon}
              title="Padarīt publisku"
              onClick={() => toggleRecipeParams("public", true)}
            />
          )}
        {["basic", "suggest"].includes(mode) &&
          viewerIsAuthor &&
          recipe.recipe.visibility !== 0 && (
            <LightButton
              image={personalIcon}
              title="Padarīt privātu"
              onClick={() => toggleRecipeParams("public", false)}
            />
          )}
        {["basic", "suggest"].includes(mode) && viewerIsAuthor && (
          <LightButton
            image={deleteIcon}
            title="Dzēst"
            onClick={deleteRecipe}
          />
        )}
      </ButtonFooter>
    </PageContainer>
  );
}

// This will include all printing changes
const PageContainer = styled.div`
  @media print {
    & > :first-child > :last-child {
      display: none;
    }
    & > :last-child {
      display: none;
    }

    & .no-print {
      display: none;
    }
  }
`;

const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const ButtonFooter = styled.div`
  display: flex;
  position: sticky; /* So it sticks to the top*/
  bottom: 0; /* So it sticks to the top*/
  background-color: #dfd3c3; /* So it isn't invisble, but at the same color as background */
  & > * {
    flex: 1 1 0; /* Allow buttons to grow, shrink, and start with equal size */
    min-width: 0; /* Prevent overflow in case of long content */
    padding: 10px;
  }
`;

const Content = styled.div`
  display: flex;
  gap: 30px;
`;
// border: 10px solid purple;

const LeftColumn = styled.div``;
// border: 5px solid green;

const RightColumn = styled.div`
  flex: 1;
`;
// border: 5px solid skyblue;

export default RecipePage;
