import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import colors from "../colors";
import Header from "../components/Header";
import HeavyButton from "../components/HeavyButton";
import IngredientModal from "../components/IngredientModal";
import LightButton from "../components/LightButton";
import Loading from "../components/Loading";
import declineIcon from "/src/assets/no.svg";
import acceptIcon from "/src/assets/yes.svg";
import createIcon from "/src/assets/plus.svg";
import clearIcon from "/src/assets/clear.svg";
import deleteIcon from "/src/assets/trash.svg";
import waitingIcon from "/src/assets/clock.svg";
import publicIcon from "/src/assets/public.svg";
import privateIcon from "/src/assets/lock.svg";

function IngredientsPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [newIngredientId, setNewIngredientId] = useState(-1);
  const [ingredients, setIngredients] = useState([]);

  let mode = null;
  // Check the path name to determine the current route
  if (location.pathname === "/kitchen") {
    mode = "basic";
  } else {
    // location.pathname ==== "/admin/ingredients"
    mode = "admin";
  }

  const handleAmountChange = (ingredientId, newAmount) => {
    setIngredients((prevIngredients) =>
      prevIngredients.map((ingredient) =>
        ingredient.ingredient_id === ingredientId
          ? { ...ingredient, amount: newAmount }
          : ingredient
      )
    );
  };

  function clearIngredient(ingredientId) {
    setIngredients((prevIngredients) =>
      prevIngredients.map((ingredient) =>
        ingredient.ingredient_id === ingredientId
          ? { ...ingredient, amount: 0 }
          : ingredient
      )
    );
  }

  function deleteIngredient(ingredientId) {
    setIngredients((prevIngredients) =>
      prevIngredients.filter(
        (ingredient) => ingredient.ingredient_id !== ingredientId
      )
    );
  }

  async function fetchIngredients() {
    try {
      const response = await axios.get("http://localhost:3000/ingredients", {
        params: {
          viewerUserId: user.userId,
          mode: mode,
        },
      });
      setIngredients(response.data);
      console.log(response.data);
    } catch (error) {
      // Shouldn't happen
      console.error("Error fetching ingredients:", error);
    }
  }

  // Fetch the ingredients when the component mounts
  useEffect(() => {
    if (!authChecked) return;

    if (
      isAuthenticated &&
      ((mode === "basic" && !user.isAdmin) ||
        (mode === "admin" && user.isAdmin))
    ) {
      fetchIngredients();
    }
  }, [authChecked]);

  async function updateIngredient(ingredient_id, accept = true) {
    console.log(ingredient_id, accept);
    // try later put under
    setIngredients((prevIngredients) =>
      prevIngredients.filter(
        (ingredient) => ingredient.ingredient_id !== ingredient_id
      )
    );
    try {
      const response = await axios.put(
        `http://localhost:3000/ingredients/${ingredient_id}`,
        { accept },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  const addIngredient = (newIngredient) => {
    if (newIngredient.ingredientId === "new") {
      newIngredient.ingredientId = newIngredientId;
      setNewIngredientId(newIngredientId - 1);
    } else {
      newIngredient.ingredientId = parseInt(newIngredient.ingredientId);
    }

    // Check if the ingredient already exists in the added ingredients list
    const existingIngredientIndex = ingredients.findIndex(
      (ingredient) => ingredient.ingredient_id === newIngredient.ingredientId
    );
    console.log(existingIngredientIndex);

    if (existingIngredientIndex !== -1) {
      // If the ingredient already exists, update the amount
      const tempIngredients = [...ingredients];
      tempIngredients[existingIngredientIndex].amount = parseFloat(
        newIngredient.amount
      ).toFixed(2); // Add the new amount to the existing one
      setIngredients(tempIngredients); // Update the state with the modified list
    } else {
      // If the ingredient does not exist, add it to the list
      setIngredients((prevIngredients) => [
        ...prevIngredients,
        {
          amount: parseFloat(newIngredient.amount).toFixed(2), // Make sure the amount is a number
          calories: newIngredient.calories,
          ingredient_id: newIngredient.ingredientId,
          is_liquid: newIngredient.isLiquid,
          name: newIngredient.name,
          visibility: newIngredient.visibility,
        },
      ]);
    }
    console.log(ingredients);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  async function saveIngredients() {
    console.log("Clicked save!");

    const response = await axios.put(
      "http://localhost:3000/ingredients",
      { ingredients },
      {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      }
    );
    console.log(response.data);
    fetchIngredients();
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

  if (mode === "basic") {
    return (
      <div>
        <Header title="Virtuve" user={user} />
        <Content>
          <Centerer>
            <h1>Esošās sastāvdaļas</h1>
          </Centerer>
          <Centerer>
            <LightButtonHolder>
              <LightButton
                image={createIcon}
                title="Pievienot jaunu sastāvdaļu"
                onClick={toggleModal}
              />
            </LightButtonHolder>
          </Centerer>
          {/* If zero, render something */}
          {ingredients.length === 0 && (
            <Centerer>
              <h1>Pašlaik nav sastāvdaļu</h1>
            </Centerer>
          )}
          {ingredients.map((ingredient, index) => (
            <>
              {index === 0 && (
                <HeaderUserRow key="unique">
                  <FirstColumn>Statuss</FirstColumn>
                  <SecondColumn>Nosaukums</SecondColumn>
                  <ThirdColumn>Kalorijas</ThirdColumn>
                  <FourthColumn>Daudzums</FourthColumn>
                  <FifthColumn>Notīrīt</FifthColumn>
                  <SixthColumn>Dzēst</SixthColumn>
                </HeaderUserRow>
              )}
              <UserRow key={ingredient.ingredient_id}>
                <FirstColumn>
                  <Icon
                    src={
                      ingredient.visibility === 2
                        ? publicIcon
                        : ingredient.visibility === 1
                        ? waitingIcon
                        : privateIcon
                    }
                    alt="Button Image"
                  />
                </FirstColumn>
                <IngredientName>{ingredient.name}</IngredientName>
                <CaloriesDiv>
                  {ingredient.calories} kcal / 100{" "}
                  {ingredient.is_liquid ? "ml" : "g"}
                </CaloriesDiv>
                <NiceInput
                  type="text"
                  value={ingredient.amount}
                  onChange={(e) =>
                    handleAmountChange(ingredient.ingredient_id, e.target.value)
                  }
                  placeholder={`Ievadi ${ingredient.is_liquid ? "ml" : "g"}`}
                />
                <FifthColumn>
                  <Icon
                    src={clearIcon}
                    alt="Button Image"
                    onClick={() => clearIngredient(ingredient.ingredient_id)}
                  />
                </FifthColumn>
                <SixthColumn>
                  <Icon
                    src={deleteIcon}
                    alt="Button Image"
                    onClick={() => deleteIngredient(ingredient.ingredient_id)}
                  />
                </SixthColumn>
              </UserRow>
            </>
          ))}
          <HeavyButton title="Saglabāt" onClick={saveIngredients} />
          <IngredientModal
            user={user}
            isOpen={isModalOpen}
            onClose={toggleModal}
            onAddIngredient={addIngredient}
          />
        </Content>
      </div>
    );
  } else {
    return (
      <div>
        <Header title="Sastāvdaļas" user={user} />
        <Centerer>
          <h1>Gaidīšanā esošās sastāvdaļas</h1>
        </Centerer>
        <RowHolder>
          {ingredients.length > 0 ? (
            <>
              {ingredients.map((ingredient, index) => (
                <>
                  {index === 0 && (
                    <HeaderUserRow key="unique">
                      <FirstAdminColumn>Sastāvdaļas nosaukums</FirstAdminColumn>
                      <SecondAdminColumn>Noraidīt</SecondAdminColumn>
                      <ThirdAdminColumn>Apstiprināt</ThirdAdminColumn>
                    </HeaderUserRow>
                  )}
                  <UserRow key={ingredient.ingredient_id}>
                    <TextDiv>
                      {ingredient.name} ({ingredient.calories} kcal / 100{" "}
                      {ingredient.is_liquid ? "ml" : "g"})
                    </TextDiv>
                    <SecondAdminColumn>
                      <IconDiv>
                        <Icon
                          src={declineIcon}
                          alt="Button Image"
                          onClick={() =>
                            updateIngredient(ingredient.ingredient_id, false)
                          }
                        />
                      </IconDiv>
                    </SecondAdminColumn>

                    <ThirdAdminColumn>
                      <IconDiv>
                        <Icon
                          src={acceptIcon}
                          alt="Button Image"
                          onClick={() =>
                            updateIngredient(ingredient.ingredient_id, true)
                          }
                        />
                      </IconDiv>
                    </ThirdAdminColumn>
                  </UserRow>
                </>
              ))}
            </>
          ) : (
            <NoRecipesMessage>
              Pašlaik nav sastāvdaļu, ko apstiprināt!
            </NoRecipesMessage>
          )}
        </RowHolder>
      </div>
    );
  }
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Centerer = styled.div`
  display: flex;
  justify-content: center;
`;

const LightButtonHolder = styled.div`
  width: 400px;
`;

const FirstColumn = styled.div`
  width: 75px;
`;
const SecondColumn = styled.div`
  flex: 1;
`;
const ThirdColumn = styled.div`
  width: 150px;
`;
const FourthColumn = styled.div`
  width: 134px;
`;
const FifthColumn = styled.div`
  width: 50px;
`;
const SixthColumn = styled.div`
  width: 50px;
`;

const FirstAdminColumn = styled.div`
  flex: 1;
`;
const SecondAdminColumn = styled.div`
  width: 100px;
`;
const ThirdAdminColumn = styled.div`
  width: 100px;
`;

const IngredientName = styled.div`
  flex: 1;
  word-break: break-word;
`;

const CaloriesDiv = styled.div`
  width: 150px;
  word-break: break-word;
`;

const RowHolder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NoRecipesMessage = styled.div`
  text-align: center;
  font-size: 1.5em;
`;

const TextDiv = styled.div`
  flex: 1;
`;

const IconDiv = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  border: 1px solid black;
  gap: 10px;
`;

const HeaderUserRow = styled(UserRow)`
  height: 44.5px;
  font-weight: 800;
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const NiceInput = styled.input`
  font-size: 1rem; /* Readable font size */
  border: 2px solid #ccc; /* Subtle border */
  border-radius: 4px; /* Slightly rounded corners */
  color: #201409; /* Text color */
  background-color: #f9f9f9; /* Slightly off-white background */
  width: 100px;
  padding: 10px 15px; /* Comfortable padding */

  /* Placeholder styling */
  &::placeholder {
    color: #aaa; /* Lighter placeholder color */
    font-style: italic; /* Optional: distinguish placeholder text */
  }

  /* Focus state */
  &:focus {
    outline: none; /* Remove default outline */
    border-color: ${colors.highlight}; /* Highlight border on focus */
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Subtle glow effect */
  }
`;

export default IngredientsPage;
