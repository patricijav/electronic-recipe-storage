import cors from "cors";
import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fileUpload from "express-fileupload";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const saltRounds = 12; // Decent base value for hashing

// Let's manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json()); // So we can parse JSON bodies

// As the app is fully local, we can leave secrets here for now
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "recipe_app",
  password: "3943",
  port: 5432,
});
db.connect();

// So front-end can make requests to this server
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from the front-end
    credentials: true, // Allow cookies to be sent as well
  })
);

// Enable file upload middleware
app.use(
  fileUpload({
    createParentPath: true, // Automatically create directories, if they don't exist
  })
);

// Serve images folder, so front-end can access them
app.use("/images", express.static("images"));

// Key-value store for tokens and user data
const sessions = {};

app.post("/users/register", async (req, res) => {
  const enteredEmail = req.body.email;
  const enteredFirstName = req.body.firstName;
  const enteredLastName = req.body.lastName;
  const enteredPassword = req.body.password;
  // This can be checked before hand
  const enteredConfirmedPassword = req.body.confirmPassword;

  try {
    let result = await db.query(
      `SELECT * FROM users WHERE email = '${enteredEmail}'`
    );
    if (result.rows.length > 0) {
      console.log("Email already exists. Try logging in.");
      res.send({
        success: false,
        message: "Email already exists. Try logging in.",
      });
    } else {
      bcrypt.hash(enteredPassword, saltRounds, async (err, hashedPassword) => {
        if (err) {
          console.log("Error hashing password:", err);
        } else {
          result = await db.query(
            `INSERT INTO users (email, first_name, last_name, password)
            VALUES ('${enteredEmail}', '${enteredFirstName}', '${enteredLastName}', '${hashedPassword}')
            RETURNING *`
          );
          console.log(result.rows);
          // Generate a unique token for the session
          // 16 bytes, 32 hexadecimal characters
          const token = crypto.randomBytes(16).toString("hex");

          // Store session in memory
          console.log(sessions);
          sessions[token] = {
            userId: result.rows[0].user_id,
            email: enteredEmail,
            firstName: enteredFirstName,
            lastName: enteredLastName,
            isAdmin: false,
          };
          console.log(sessions);
          console.log("Registration successful!");
          res.send({
            success: true,
            token: token,
            message: "Registration successful!",
          });
        }
      });
    }
  } catch (err) {
    // This will trigger, for example, if SQL statement was written wrong, for example, with table name userss
    console.log(err);
  }
});

app.post("/users/login", async (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  console.log(`Entered e-mail: ${enteredEmail}`);
  console.log(`Entered password: ${enteredPassword}`);

  try {
    const result = await db.query(
      `SELECT * FROM users WHERE email = '${enteredEmail}'`
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      console.log(`Stored password: ${storedPassword}`);
      bcrypt.compare(enteredPassword, storedPassword, (err, result) => {
        if (err) {
          console.log("Error comparing passwords:", err);
        } else {
          if (result) {
            // Generate a unique token for the session
            // 16 bytes are 32 hexadecimal characters
            const token = crypto.randomBytes(16).toString("hex");

            // Store session in memory
            console.log(sessions);
            sessions[token] = {
              userId: user.user_id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              isAdmin: user.is_admin,
            };
            console.log(sessions);
            // Send token to the front-end
            console.log("Login succeeded!");
            res.send({
              success: true,
              token: token,
              isAdmin: user.is_admin,
              message: "Login succeeded!",
            });
          } else {
            console.log("Login failed: incorrect password!");
            res.send({
              success: false,
              message: "Login failed: incorrect password!",
            });
          }
        }
      });
    } else {
      console.log("Login failed: user not found!");
      res.send({
        success: false,
        message: "Login failed: user not found!",
      });
    }
  } catch (err) {
    // This will trigger, for example, if SQL statement was written wrong, for example, with table name userss
    console.log(err);
  }
});

app.get("/users/me", (req, res) => {
  const token = req.headers.authorization;
  if (!token || !sessions[token]) {
    return res.status(401).send("Unauthorized");
  } else {
    // Send user details back
    const user = sessions[token];
    res.send(user);
  }
});

app.post("/users/logout", (req, res) => {
  const token = req.headers.authorization;
  if (token && sessions[token]) {
    delete sessions[token];
  }
  res.send("Logged out successfully.");
});

app.delete("/users/:id", async (req, res) => {
  const user_id = req.params.id;
  const result = await db.query(`
    DELETE FROM users
    WHERE user_id = ${user_id}`);
});

app.get("/users", async (req, res) => {
  const token = req.headers.authorization;
  let viewer = null;
  if (token && sessions[token]) {
    viewer = sessions[token];
  }
  if (viewer?.isAdmin) {
    const result = await db.query(`
      SELECT user_id, email, first_name, last_name
      FROM users
      WHERE is_admin = FALSE`);
    res.send(result.rows);
  }
});

app.post("/recipes", async (req, res) => {
  const recipe = JSON.parse(req.body.recipe);
  const steps = JSON.parse(req.body.steps);
  const ingredients = JSON.parse(req.body.ingredients);

  // 1. Save the recipe
  let result = await db.query(
    `INSERT INTO recipes (user_id, name)
    VALUES ('${recipe.userId}', '${recipe.name}')
    RETURNING *`
  );
  const recipe_id = result.rows[0].recipe_id;
  console.log("New Recipe ID: ", recipe_id);

  // Handle the file
  if (req.files?.photo) {
    const file = req.files.photo;
    const extension = path.extname(file.name).slice(1);
    const newFileName = `${recipe_id}_1.${extension}`;

    const uploadPath = path.join(__dirname, "images", newFileName);

    // Save the file
    file.mv(uploadPath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    result = await db.query(
      `UPDATE recipes
      SET photo_file_name = '${newFileName}'
      WHERE recipe_id = ${recipe_id}
      RETURNING *`
    );
    console.log(result.rows);
  }

  for (const step of steps) {
    result = await db.query(
      `INSERT INTO recipe_steps (recipe_id, step_number, instruction)
      VALUES (${recipe_id}, ${step.id}, '${step.text}') RETURNING *`
    );
  }

  for (const ingredient of ingredients) {
    if (ingredient.ingredientId.startsWith("new_")) {
      console.log(recipe.userId);
      console.log(ingredient.name);
      console.log(ingredient.calories);
      console.log(ingredient.isLiquid);
      result = await db.query(
        `INSERT INTO ingredients (user_id, name, calories, is_liquid, visibility)
        VALUES (${recipe.userId}, '${ingredient.name}', ${ingredient.calories}, ${ingredient.isLiquid}, 1) RETURNING *`
      );
      console.log(result.rows[0]);
      const ingredient_id = result.rows[0].ingredient_id;
      console.log("New Ingredient ID: ", ingredient_id);

      result = await db.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
        VALUES (${recipe_id}, ${ingredient_id}, ${ingredient.amount}) RETURNING *`
      );
      console.log(result.rows);
    } else {
      result = await db.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
        VALUES (${recipe_id}, ${parseFloat(ingredient.ingredientId, 10)}, ${
          ingredient.amount
        }) RETURNING *`
      );
      console.log(result.rows);
    }
  }

  res.send({ recipe_id });
});

app.put("/recipes/:id", async (req, res) => {
  const token = req.headers.authorization;
  let viewer = null;
  if (token && sessions[token]) {
    viewer = sessions[token];
  }

  const recipe_id = req.params.id;
  console.log("Received a Recipe Edit request with Recipe ID:", recipe_id);

  const mode = req.body.mode;
  if (mode === "admin") {
    // Edit request for recipe status
    const accept = req.body.accept === "true";
    console.log(mode, accept);
    const result = await db.query(`
      UPDATE recipes
      SET visibility = ${accept ? 2 : 0}
      WHERE recipe_id = ${recipe_id}`);
    res.send(result.rows);
  } else if (mode === "favorite") {
    // Edit request for favorite status
    const makeFavorite = req.body.makeFavorite === "true";
    console.log(mode, makeFavorite, viewer);
    let query = null;
    if (makeFavorite) {
      query = `INSERT INTO favorite_recipes (user_id, recipe_id)
            VALUES (${viewer.userId}, ${recipe_id})`;
    } else {
      query = `
        DELETE FROM favorite_recipes
        WHERE user_id = ${viewer.userId} AND recipe_id = ${recipe_id}`;
    }
    const result = await db.query(query);
    res.send(result.rows);
  } else if (mode === "public") {
    // Edit request for recipe status
    const setToPublic = req.body.setToPublic === "true";
    console.log(mode, setToPublic);
    const result = await db.query(`
      UPDATE recipes
      SET visibility = ${setToPublic ? 1 : 0}
      WHERE recipe_id = ${recipe_id}`);
    res.send(result.rows);
  } else {
    console.log("Edit recipe is called, let's go!");
    const recipe = JSON.parse(req.body.recipe);
    const steps = JSON.parse(req.body.steps);
    const ingredients = JSON.parse(req.body.ingredients);
    const old_recipe = JSON.parse(req.body.old_recipe);
    console.log("Steps:", steps);
    console.log("Ingredients:", ingredients);
    console.log("Old Recipe:", old_recipe);

    const oldPhotoFileName = old_recipe.recipe.photo_file_name;
    let newPhotoFileName = null;
    if (req.files?.photo) {
      const file = req.files.photo;
      const extension = path.extname(file.name).slice(1);
      let whichImage = null;
      if (oldPhotoFileName) {
        const old_photo_file_name_parts = oldPhotoFileName.split(/[_\.]/); // Split by both '_' and '.'
        whichImage = old_photo_file_name_parts[1];
      } else {
        whichImage = 0;
      }

      const newFileName = `${recipe_id}_${
        parseInt(whichImage) + 1
      }.${extension}`;
      newPhotoFileName = newFileName;

      const uploadPath = path.join(__dirname, "images", newFileName);

      // Save the file
      file.mv(uploadPath, (err) => {
        if (err) {
          console.error(err);
        }
      });

      if (oldPhotoFileName) {
        // Delete the old file
        const deletePath = path.join(__dirname, "images", oldPhotoFileName);
        fs.unlink(deletePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting old file:", err);
          } else {
            console.log("Old file deleted successfully or didn't exist.");
          }
        });
      }
    }

    const photoFileNamePart = newPhotoFileName
      ? `, photo_file_name = '${newPhotoFileName}'`
      : oldPhotoFileName
      ? `, photo_file_name = '${oldPhotoFileName}'`
      : "";

    // Not really worth it to check if name has changed, better just to set it again
    let result = await db.query(`
      UPDATE recipes
      SET visibility = 0, name = '${recipe.name}'${photoFileNamePart}
      WHERE recipe_id = ${recipe_id}`);

    // Potentially many steps might have changed, so it's easier to just delete them and add them again
    result = await db.query(`
      DELETE FROM recipe_steps
      WHERE recipe_id = ${recipe_id}`);
    for (const step of steps) {
      result = await db.query(
        `INSERT INTO recipe_steps (recipe_id, step_number, instruction)
        VALUES (${recipe_id}, ${step.id}, '${step.text}')`
      );
    }

    // Ingredients
    result = await db.query(
      `DELETE FROM recipe_ingredients
      WHERE recipe_id = ${recipe_id}`
    );
    for (const ingredient of ingredients) {
      if (ingredient.ingredientId.toString().startsWith("new_")) {
        result = await db.query(
          `INSERT INTO ingredients (user_id, name, calories, is_liquid, visibility)
          VALUES (${recipe.userId}, '${ingredient.name}', ${ingredient.calories}, ${ingredient.isLiquid}, 1) RETURNING *`
        );
        const ingredient_id = result.rows[0].ingredient_id;
        console.log("New Ingredient ID: ", ingredient_id);

        result = await db.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
          VALUES (${recipe_id}, ${ingredient_id}, ${ingredient.amount}) RETURNING *`
        );
        console.log(result.rows);
      } else {
        result = await db.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
          VALUES (${recipe_id}, ${parseFloat(ingredient.ingredientId, 10)}, ${
            ingredient.amount
          }) RETURNING *`
        );
      }
    }

    res.send();
  }
});

app.get("/recipes/:id", async (req, res) => {
  const recipe_id = req.params.id; // Definitely exists
  const token = req.headers.authorization; // Might be null
  const { mode } = req.query; // Access query parameters
  let viewer = null;
  if (token && sessions[token]) {
    viewer = sessions[token];
  }

  try {
    let response = {};

    let result = await db.query(
      `SELECT * FROM recipes WHERE recipe_id = ${recipe_id}`
    );
    response.recipe = result.rows[0];

    result = await db.query(
      `SELECT * FROM users WHERE user_id = ${response.recipe.user_id}`
    );
    response.author = result.rows[0];

    result = await db.query(
      `SELECT * FROM recipe_steps WHERE recipe_id = ${recipe_id} ORDER BY step_number ASC`
    );
    response.steps = result.rows;

    result = await db.query(
      `SELECT *
      FROM recipe_ingredients AS ri
      JOIN ingredients AS i ON ri.ingredient_id = i.ingredient_id
      WHERE ri.recipe_id = ${recipe_id}
      ORDER BY ri.amount DESC`
    );
    response.ingredients = result.rows;

    response.calories = response.ingredients.reduce((total, ingredient) => {
      return total + (ingredient.amount * ingredient.calories) / 100;
    }, 0);
    response.calories = Math.round(response.calories * 100) / 100;

    if (viewer) {
      result = await db.query(
        `SELECT *
        FROM favorite_recipes
        WHERE user_id = ${viewer.userId} AND recipe_id = ${recipe_id}`
      );
      response.is_favorite = result.rows.length === 1;
    }

    if (viewer && mode === "suggest") {
      result = await db.query(`
        SELECT *
        FROM user_ingredients
        WHERE user_id = ${viewer.userId}`);
      const userIngredients = result.rows;

      result = await db.query(`
        SELECT *
        FROM recipe_ingredients
        WHERE recipe_id = ${recipe_id}
      `);
      const recipeIngredients = result.rows;

      const kitchen = recipeIngredients
        .filter((ri) => ri.recipe_id === response.recipe.recipe_id) // after this only this recipe's ingredients remain
        .map((recipeIngredient) => {
          const userIngredient = userIngredients.find(
            (ui) => ui.ingredient_id === recipeIngredient.ingredient_id
          );
          if (!userIngredient)
            return {
              ingredient_id: recipeIngredient.ingredient_id,
              status: 0,
            };
          else if (
            parseFloat(userIngredient.amount) <
            parseFloat(recipeIngredient.amount)
          )
            return {
              ingredient_id: recipeIngredient.ingredient_id,
              status: 1,
              difference: (
                parseFloat(recipeIngredient.amount) -
                parseFloat(userIngredient.amount)
              ).toFixed(2),
            };
          else
            return {
              ingredient_id: recipeIngredient.ingredient_id,
              status: 2,
            };
        });
      response.kitchen = kitchen;
    }

    res.send(response);
  } catch (err) {
    // This shouldn't happen
    console.log(err);
  }
});

app.get("/recipes", async (req, res) => {
  // Current implementation assumes that userId will be present for view modes "favorite" and "personal"
  const { userId, viewMode } = req.query; // Access query parameters
  let query = null;
  if (viewMode === "public" || viewMode === "favorite") {
    // Public view mode – all public recipes
    // Favorite view mode – all favorite recipes, but first let's get all public recipes
    query = `
      SELECT *
      FROM recipes
      WHERE visibility = 2`;
  } else if (viewMode === "admin") {
    // Admin view mode – all publices recipes (starting the ones that aren't accepted yet)
    query = `
      SELECT *
      FROM recipes
      WHERE visibility IN (1, 2)
      ORDER BY visibility ASC`;
  } else if (viewMode === "personal") {
    // Personal view mode – all personal recipes
    query = `
      SELECT *
      FROM recipes
      WHERE user_id = ${userId}`;
  } else if (viewMode === "suggest") {
    // Suggested view mode – all public and personal recipes
    query = `
      SELECT *
      FROM recipes
      WHERE visibility = 2 OR user_id = ${userId}`;
  }

  try {
    const result = await db.query(query);
    let resultRecipes = result.rows;
    if (viewMode === "favorite") {
      const result2 = await db.query(`
        SELECT *
        FROM favorite_recipes
        WHERE user_id = ${userId}`);
      let favoriteRecipes = result2.rows;
      resultRecipes = resultRecipes.filter((recipe) =>
        favoriteRecipes.some(
          (favorite) => favorite.recipe_id === recipe.recipe_id
        )
      );
    } else if (viewMode === "suggest") {
      const result2 = await db.query(`
        SELECT *
        FROM user_ingredients
        WHERE user_id = ${userId}`);
      const userIngredients = result2.rows;

      // Extract all recipe_ids
      const recipeIds = resultRecipes.map((recipe) => recipe.recipe_id);
      // Format the recipe_ids as a string for the SQL query
      const recipeIdsString = recipeIds.join(", ");
      const result3 = await db.query(`
        SELECT *
        FROM recipe_ingredients
        WHERE recipe_id IN (${recipeIdsString})
      `);
      const recipeIngredients = result3.rows;

      let processedRecipes = resultRecipes.map((recipe) => {
        const scores = recipeIngredients
          .filter((ri) => ri.recipe_id === recipe.recipe_id) // after this only this recipe's ingredients remain
          .reduce(
            (acc, recipeIngredient) => {
              const userIngredient = userIngredients.find(
                (ui) => ui.ingredient_id === recipeIngredient.ingredient_id
              );
              if (!userIngredient) acc[2] += 1;
              else if (
                parseFloat(userIngredient.amount) <
                parseFloat(recipeIngredient.amount)
              )
                acc[1] += 1;
              else acc[0] += 1;

              return acc;
            },
            [0, 0, 0] // Initial values: [full, partial, missing]);
          );
        return {
          ...recipe,
          scores,
        };
      });
      //console.log(processedRecipes[13]);

      processedRecipes.sort((a, b) => {
        const [fullA, partialA, missingA] = a.scores;
        const [fullB, partialB, missingB] = b.scores;

        // First criteria: Full ingredients
        if (fullA !== fullB) return fullB - fullA;

        // Second criteria: Most partial ingredients
        if (partialA !== partialB) return partialB - partialA;

        // Third criteria: Fewest missing ingredients
        return missingA - missingB;
      });

      //console.log(processedRecipes);

      resultRecipes = processedRecipes;
      // If you want to see Loader
      /*setTimeout(() => {
      res.send(resultRecipes);
    }, 5000); // 5000ms = 5 seconds*/
      // Regular
    }
    res.send(resultRecipes);
  } catch (err) {
    console.log(err);
  }
});

app.delete("/recipes/:id", async (req, res) => {
  const recipe_id = req.params.id;
  const result = await db.query(`
    DELETE FROM recipes
    WHERE recipe_id = ${recipe_id}`);
  res.send(result.rows);
});

// This endpoint has 3 use cases:
// 1. To get data for ingredient adding modal (visibility 2 ingredients and other personally made ingredients (both visibility 1 and 0));
// 2. To get data for kitchen functionality (all ingredients that user has at home);
// 3. To get data for administrators about all visibility 1 ingredients, so admin can decide whether to rule them as 0 or 2.
app.get("/ingredients", async (req, res) => {
  const { viewerUserId, mode } = req.query;
  console.log("Viewer User ID:", viewerUserId);
  console.log("Mode:", mode);

  try {
    let result = null;
    if (mode === "recipe") {
      result = await db.query(`
        SELECT *
        FROM ingredients
        WHERE visibility = 2 OR user_id = ${viewerUserId}
        ORDER BY name ASC`);
      res.send(result.rows);
    } else if (mode === "basic") {
      result = await db.query(
        `SELECT ui.ingredient_id, ui.amount, i.name, i.calories, i.is_liquid, i.visibility
        FROM user_ingredients AS ui
        JOIN ingredients AS i ON ui.ingredient_id = i.ingredient_id
        WHERE ui.user_id = ${viewerUserId}
        ORDER BY ui.amount DESC`
      );
      res.send(result.rows);
    } else {
      // mode === "admin"
      result = await db.query(
        `SELECT ingredient_id, name, calories, is_liquid
        FROM ingredients
        WHERE visibility = 1`
      );
      res.send(result.rows);
    }
  } catch (err) {
    // Shouldn't happen
    console.log(err);
  }
});

app.put("/ingredients/:id", async (req, res) => {
  const ingredient_id = req.params.id; // Definitely exists
  const { accept } = req.body; // Definitely exists
  const token = req.headers.authorization; // Definitely exists
  //console.log(ingredient_id);
  //console.log(accept);
  //console.log(token);
  const visibility = accept ? 2 : 0;

  const result = await db.query(`
    UPDATE ingredients
    SET visibility = ${visibility}
    WHERE ingredient_id = ${ingredient_id}`);
  res.send(result.rows);
});

app.put("/ingredients", async (req, res) => {
  const { ingredients } = req.body; // Definitely exists
  const token = req.headers.authorization; // Definitely exists
  let viewer = null;
  if (token && sessions[token]) {
    viewer = sessions[token];
  }
  if (viewer) {
    console.log("Got a kitchen request!");
    console.log(ingredients);
    let result = await db.query(
      `DELETE FROM user_ingredients
      WHERE user_id = ${viewer.userId}`
    );
    for (const ingredient of ingredients) {
      if (ingredient.ingredient_id < 0) {
        result = await db.query(
          `INSERT INTO ingredients (user_id, name, calories, is_liquid, visibility)
          VALUES (${viewer.userId}, '${ingredient.name}', ${ingredient.calories}, ${ingredient.is_liquid}, 1) RETURNING *`
        );
        const ingredient_id = result.rows[0].ingredient_id;
        console.log("New Ingredient ID: ", ingredient_id);

        result = await db.query(
          `INSERT INTO user_ingredients (user_id, ingredient_id, amount)
          VALUES (${viewer.userId}, ${ingredient_id}, ${ingredient.amount})`
        );
        console.log(result.rows);
      } else {
        result = await db.query(
          `INSERT INTO user_ingredients (user_id, ingredient_id, amount)
          VALUES (${viewer.userId}, ${ingredient.ingredient_id}, ${ingredient.amount})`
        );
      }
    }
  }

  res.send();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
