import axios from "axios";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import colors from "../colors";
import HeavyButton from "../components/HeavyButton";

function IngredientModal({ user, isOpen, onClose, onAddIngredient }) {
  // Ingredient details:
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientCalories, setIngredientCalories] = useState("");
  const [ingredientIsLiquid, setIngredientIsLiquid] = useState(false);
  // Recipe ingredient details:
  const [recipeIngredientAmount, setRecipeIngredientAmount] = useState("");
  // Ingredient selection values:
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientVisibility, setIngredientVisibility] = useState(1);

  const handleNameChange = (e) => setIngredientName(e.target.value);
  const handleCaloriesChange = (e) => setIngredientCalories(e.target.value);
  const handleIsLiquidChange = (e) => setIngredientIsLiquid(e.target.checked);
  const handleRecipeIngredientAmountChange = (e) =>
    setRecipeIngredientAmount(e.target.value);
  const handleSelection = (e) => {
    setSelectedIngredient(e.target.value);
    if (e.target.value !== "new") {
      //console.log("Ingredients", ingredients);
      //console.log("Selected ingredient", e.target.value);
      const element = ingredients.find(
        (ingredient) =>
          ingredient.ingredient_id === parseInt(e.target.value, 10)
      );
      //console.log(element);
      setIngredientName(element.name);
      setIngredientCalories(element.calories);
      setIngredientIsLiquid(element.is_liquid);
      setIngredientVisibility(element.visibility);
    } else setIngredientVisibility(1);
  };

  // This gets triggered, when someone presses Add Ingredient button after filling the form
  const handleAddIngredient = () => {
    // Checking the form
    if (selectedIngredient === "") {
      alert(
        "Lai pievienot sastāvdaļu, izvēlies esošu sastāvdaļu vai izveido jaunu!"
      );
      return;
    }

    // We need to return an object, if it's a new, then we need to set the index to new for example
    onAddIngredient({
      ingredientId: selectedIngredient,
      name: ingredientName,
      calories: parseInt(ingredientCalories, 10),
      isLiquid: ingredientIsLiquid,
      amount: parseFloat(recipeIngredientAmount),
      visibility: ingredientVisibility,
    });

    // Clear the filled form:
    setIngredientName("");
    setIngredientCalories("");
    setIngredientIsLiquid(false);
    setRecipeIngredientAmount("");
    setSelectedIngredient("");

    onClose(); // Close the modal
  };

  // Fetch the ingredients when the component mounts
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const response = await axios.get("http://localhost:3000/ingredients", {
          params: {
            viewerUserId: user.userId,
            mode: "recipe",
          },
        });
        setIngredients(response.data);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    }

    fetchIngredients();
  }, []);

  if (!isOpen) return null;

  return (
    <div style={modalStyles}>
      <Wrapper>
        <div>
          <h2>Pievienot receptei sastāvdaļu</h2>
        </div>
        <div>
          <NiceLabel>Izvēlētā sastāvdaļa</NiceLabel>
          <NiceSelect value={selectedIngredient} onChange={handleSelection}>
            <option value="">-- Izvēlies sastāvdaļu --</option>
            <option value="new">🆕 Jauna sastāvdaļa</option>
            {ingredients.map((ingredient) => (
              <option
                key={ingredient.ingredient_id}
                value={ingredient.ingredient_id}
              >
                {ingredient.visibility === 2
                  ? "🌐"
                  : ingredient.visibility === 1
                  ? "🕙"
                  : "🔒"}{" "}
                {ingredient.name} ({ingredient.calories} kcal / 100{" "}
                {ingredient.is_liquid ? "ml" : "g"})
              </option>
            ))}
          </NiceSelect>
        </div>
        {selectedIngredient == "new" && (
          <>
            <div>
              <NiceLabel>Jaunās sastāvdaļas nosaukums:</NiceLabel>
              <NiceInput
                type="text"
                value={ingredientName}
                onChange={handleNameChange}
                placeholder="Ievadi nosaukumu"
              />
            </div>
            <div>
              {/* Currently we will make the user input calories for 100 g/ml, but later we could allow them to enter calories on 25 g, then we calculate it to 100 g */}
              <NiceLabel>Jaunās sastāvdaļas kcal uz 100 g/ml</NiceLabel>
              <NiceInput
                type="text"
                value={ingredientCalories}
                onChange={handleCaloriesChange}
                placeholder="Ievadi kaloriju skaitu"
              />
            </div>
            <div>
              <NiceLabel>
                Sastāvdaļa ir šķidra (mērīta mililitros (ml))
              </NiceLabel>
              <NiceInput
                type="checkbox"
                checked={ingredientIsLiquid}
                onChange={handleIsLiquidChange}
              />
            </div>
          </>
        )}
        <div>
          <NiceLabel>Daudzums receptē (g/ml)</NiceLabel>
          <NiceInput
            type="text"
            value={recipeIngredientAmount}
            onChange={handleRecipeIngredientAmountChange}
            placeholder="Ievadi daudzumu"
          />
        </div>
        <HeavyButton
          title="Pievienot sastāvdaļu"
          onClick={handleAddIngredient}
        />
        <HeavyButton title="Atcelt" onClick={onClose} />
      </Wrapper>
    </div>
  );
}

const modalStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1001,
};

const Wrapper = styled.div`
  background-color: #dfd3c3;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  width: 800px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NiceLabel = styled.label`
  width: 400px;
  display: inline-block;
`;

const NiceInput = styled.input`
  font-size: 1rem; /* Readable font size */
  border: 2px solid #ccc; /* Subtle border */
  border-radius: 4px; /* Slightly rounded corners */
  color: #201409; /* Text color */
  background-color: #f9f9f9; /* Slightly off-white background */
  flex: 1;
  padding: 10px 15px; /* Comfortable padding */
  width: 220px; /* Temporary */

  /* Placeholder styling */
  &::placeholder {
    color: #aaa; /* Lighter placeholder color */
    font-style: italic; /* Optional: distinguish placeholder text */
  }

  /* Focus state */
  &:focus {
    outline: none; /* Remove default outline */
    border-color: ${colors.highlight}; /* Highlight border on focus */
  }
`;

const NiceSelect = styled.select`
  font-size: 1rem; /* Readable font size */
  width: 254px;
  height: 42.5px;

  &:focus {
    outline: none; /* Remove default outline */
    border: 2px solid ${colors.highlight}; /* Highlight border on focus */
  }
`;

export default IngredientModal;
