export function fitsPasswordRules(password) {
  let hasLowercase = false;
  let hasUppercase = false;
  let hasDigit = false;
  let hasSpecialCharacter = false;

  // Go through every single character in the password
  for (const char of password) {
    if (char >= "a" && char <= "z") {
      hasLowercase = true;
    } else if (char >= "A" && char <= "Z") {
      hasUppercase = true;
    } else if (char >= "0" && char <= "9") {
      hasDigit = true;
    } else {
      hasSpecialCharacter = true;
    }

    // Already everything was present
    if (hasLowercase && hasUppercase && hasDigit && hasSpecialCharacter) {
      return true;
    }
  }

  return false;
}
