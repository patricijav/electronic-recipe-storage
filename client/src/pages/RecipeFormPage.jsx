import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import defaultRecipe from "../assets/default_recipe.png";
import colors from "../colors";
import Header from "../components/Header";
import HeavyButton from "../components/HeavyButton";
import IngredientModal from "../components/IngredientModal";
import Loading from "../components/Loading";
import deleteIcon from "/src/assets/minus.svg";
import createIcon from "/src/assets/plus.svg";

function RecipeFormPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function
  const { id } = useParams(); // `id` will be undefined for `/recipes/create`
  const [recipe, setRecipe] = useState(null);
  const [steps, setSteps] = useState([{ id: 1, text: "" }]);
  const [ingredients, setIngredients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [newIngredientId, setNewIngredientId] = useState(1);
  const [recipeName, setRecipeName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultRecipe);

  const handleRecipeNameChange = (e) => setRecipeName(e.target.value);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    // Generate a preview URL
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      console.log(url);
      setPreviewUrl(url);
    }
  };

  let formMode = null;
  if (!id) {
    console.log("Creating a new recipe");
    formMode = "create";
  } else {
    console.log(`Editing recipe with ID: ${id}`);
    formMode = "edit";
  }
  const headings = {
    create: "Jauna Recepte",
    edit: "Labot Recepti",
  };

  // At the moment, it is identical to RecipePage.jsx useEffect function
  // Fetch the recipe when the component mounts or the `id` changes
  useEffect(() => {
    async function fetchRecipe() {
      try {
        const response = await axios.get(`http://localhost:3000/recipes/${id}`);
        setRecipe(response.data);
        console.log(response.data); // These are called twice, later check why
        // recipe.photo_file_name
        // ? `http://localhost:3000/images/${recipe.photo_file_name}`
        // : defaultRecipeImage
        setPreviewUrl(
          response.data.recipe.photo_file_name
            ? `http://localhost:3000/images/${response.data.recipe.photo_file_name}`
            : defaultRecipe
        );
        setRecipeName(response.data.recipe.name);
        setSteps(
          response.data.steps.map((item) => ({
            id: item.step_number,
            text: item.instruction,
          }))
        );
        setIngredients(
          response.data.ingredients.map((item) => ({
            ingredientId: item.ingredient_id,
            name: item.name,
            calories: item.calories,
            isLiquid: item.is_liquid,
            amount: parseFloat(item.amount),
          }))
        );
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    }

    if (formMode === "edit") {
      fetchRecipe();
    }
  }, [id]); // Dependency array includes `id`

  const addStep = () => {
    const newId = steps.length > 0 ? steps[steps.length - 1].id + 1 : 1;
    setSteps([...steps, { id: newId, text: "" }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((step) => step.id !== index));
  };

  const removeIngredient = (ingredientId) => {
    setIngredients(
      ingredients.filter(
        (ingredient) => ingredient.ingredientId !== ingredientId
      )
    );
  };

  // Handle input change for a specific step
  const handleStepChange = (id, value) => {
    setSteps(
      steps.map((step) => (step.id === id ? { ...step, text: value } : step))
    );
  };

  async function saveRecipe() {
    console.log("Clicked save on", formMode);

    try {
      // Create FormData object
      const formData = new FormData(); // formData should include dict, it was dict before soooo...

      formData.append("mode", formMode);

      // Append the recipe fields
      formData.append(
        "recipe",
        JSON.stringify({
          userId: user.userId,
          name: recipeName,
        })
      );

      // Append steps and ingredients
      const outputSteps = steps.map((item, index) => ({
        ...item,
        id: index + 1, // Reassign `id` to be sequential starting from 1
      }));
      formData.append("steps", JSON.stringify(outputSteps));
      formData.append("ingredients", JSON.stringify(ingredients));

      formData.append("old_recipe", JSON.stringify(recipe));

      // Append the file (if you have one)
      if (file) {
        formData.append("photo", file); // 'photo' is the key used in the backend to retrieve the file
      }

      let response = null;
      // Make the POST request
      if (formMode === "create") {
        response = await axios.post("http://localhost:3000/recipes", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        navigate(`/recipes/${response.data.recipe_id}`);
      } else {
        response = await axios.put(
          `http://localhost:3000/recipes/${recipe.recipe.recipe_id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: localStorage.getItem("token"),
            },
          }
        );
        navigate(`/recipes/${recipe.recipe.recipe_id}`);
      }
    } catch {
    } finally {
    }
  }

  const addIngredient = (ingredient) => {
    //console.log("Modal returned this ingredient:");
    if (ingredient.ingredientId === "new") {
      ingredient.ingredientId = `${ingredient.ingredientId}_${newIngredientId}`;
      setNewIngredientId(newIngredientId + 1);

      //console.log("It's a new ingredinet!");
    }
    console.log(ingredient);
    // if new, update ingredient so its better
    setIngredients([...ingredients, ingredient]);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Only render everything else once the auth check is complete
  if (!authChecked || (authChecked && formMode === "edit" && !recipe)) {
    return <Loading />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    navigate("/login");
    return;
  } else if (user.isAdmin) {
    navigate("/admin/menu");
    return;
  } else if (formMode === "edit" && user.userId !== recipe.author.user_id) {
    navigate("/menu");
    return;
  }

  return (
    <div>
      <Header title={headings[formMode]} user={user} />
      <Content>
        <LeftColumn>
          <FileInputWrapper>
            <Image src={previewUrl} />
            <HiddenInput
              type="file"
              id="file-upload"
              onChange={handleFileChange}
            />
            <CustomLabel htmlFor="file-upload" src={previewUrl}>
              Pievieno ēdiena bildi
            </CustomLabel>
          </FileInputWrapper>
          <IngredientsTitleDiv>
            <h3>Sastāvdaļas *</h3>
          </IngredientsTitleDiv>
          {ingredients.map((ingredient, index) => (
            <IngredientRow key={ingredient.ingredientId}>
              <h3>{index + 1}.</h3>
              <IngredientText>
                {ingredient.name} ({parseFloat(ingredient.amount)}{" "}
                {ingredient.is_liquid ? "ml" : "g"})
              </IngredientText>
              <Icon
                onClick={() => removeIngredient(ingredient.ingredientId)}
                src={deleteIcon}
                alt="Button Image"
              />
            </IngredientRow>
          ))}
          <PlusDiv>
            <Icon onClick={toggleModal} src={createIcon} alt="Button Image" />
          </PlusDiv>
          <IngredientModal
            user={user}
            isOpen={isModalOpen}
            onClose={toggleModal}
            onAddIngredient={addIngredient}
          />
        </LeftColumn>
        <RightColumn>
          <h3>Receptes nosaukums *</h3>
          <InputHolder>
            <NiceInput
              type="text"
              value={recipeName}
              onChange={handleRecipeNameChange}
              placeholder="Ievadi receptes nosaukumu"
            />
          </InputHolder>
          <h3>Receptes gaita *</h3>
          {steps.map((step, index) => (
            <Step key={step.id}>
              <label>{index + 1}.</label>
              <NiceInput
                type="text"
                placeholder={`Ieraksti ${index + 1}. soļa tekstu`} // Display as 1-based index
                value={step.text}
                onChange={(e) => handleStepChange(step.id, e.target.value)}
              />
              <Icon
                onClick={() => removeStep(step.id)}
                src={deleteIcon}
                alt="Button Image"
              />
            </Step>
          ))}
          <PlusDiv>
            <Icon onClick={addStep} src={createIcon} alt="Button Image" />
          </PlusDiv>
        </RightColumn>
      </Content>
      <HeavyButton title="Saglabāt" onClick={saveRecipe} />
    </div>
  );
}

const Content = styled.div`
  padding: 10px;
  display: flex;
  gap: 10px;
`;

const LeftColumn = styled.div`
  width: 200px;
`;

const PlusDiv = styled.div`
  display: flex;
  justify-content: center;
`;

const IngredientsTitleDiv = styled.div`
  display: flex;
  justify-content: center;
`;

const IngredientText = styled.h3`
  word-break: break-word;
  text-align: center;
  font-size: 1rem;
  flex: 1;
`;

const RightColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const IngredientRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Image = styled.img`
  width: 200px;
  height: 200px;
`;

const FileInputWrapper = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const CustomLabel = styled.label`
  display: flex; /* Enable Flexbox */
  align-items: center; /* Center vertically */
  justify-content: center; /* Center horizontally */
  position: absolute;
  left: 0;
  top: 0;
  width: 200px;
  height: 200px;
  cursor: pointer;
  font-size: 2em;
  text-align: center;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
  cursor: pointer;
  padding-left: 10px;
`;

const NiceInput = styled.input`
  font-size: 1rem; /* Readable font size */
  border: 2px solid #ccc; /* Subtle border */
  border-radius: 4px; /* Slightly rounded corners */
  color: #201409; /* Text color */
  background-color: #f9f9f9; /* Slightly off-white background */
  flex: 1;
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

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
`;

const InputHolder = styled.div`
  width: 100%;
  display: flex;
`;

export default RecipeFormPage;
