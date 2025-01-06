import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import validator from "validator";

import { fitsPasswordRules } from "../utils/validation";
import useAuthCheck from "../auth/useAuthCheck";
import colors from "../colors";
import Header from "../components/Header";
import HeavyButton from "../components/HeavyButton";
import Loading from "../components/Loading";
import NotificationModal from "../components/NotificationModal";

function LoginPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const showNotification = (type, message) => {
    setModalProps({ type, message });
    setModalOpen(true);
  };

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    return <Loading />;
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    navigate(user.isAdmin ? "/admin/menu" : "/menu");
    return;
  }

  async function handleSubmit() {
    if (email.length === 0) {
      showNotification(
        "error",
        "E-pasts nav aizpildīts, bet tas ir obligāts lauks, lūdzu, aizpildiet to!"
      );
      return;
    } else if (password.length === 0) {
      showNotification(
        "error",
        "Parole nav aizpildīta, bet tas ir obligāts lauks, lūdzu, aizpildiet to!"
      );
      return;
    } else if (email.length < 6 || email.length > 254) {
      showNotification(
        "error",
        "E-pastam ir jābūt garumā no 6 līdz 254 simboliem, izlabojiet lauku, lai garums atbilstu!"
      );
      return;
    } else if (password.length < 8 || password.length > 64) {
      showNotification(
        "error",
        "Parolei ir jābūt garumā no 8 līdz 64 simboliem, izlabojiet lauku, lai garums atbilstu!"
      );
      return;
    } else if (!validator.isEmail(email)) {
      showNotification(
        "error",
        "E-pasta laukā nav ievadīts pareizs e-pasta formāts, izlabojiet lauku, lai tas būtu pareizā formātā!"
      );
      return;
    } else if (!fitsPasswordRules(password)) {
      showNotification(
        "error",
        "Parolē jābūt vienam mazam burtam, vienam lielam burtam, vienam ciparam un vienam speciālam simbolam, bet ievadītajā parolē tā nav taisnība, izlabojiet paroli!"
      );
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/users/login", {
        email,
        password,
      });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        navigate(response.data.isAdmin ? "/admin/menu" : "/menu");
      } else {
        showNotification(
          "error",
          "E-pasts un/vai parole ir nepareizi, pārbaudiet ievadīto informāciju!"
        );
        setPassword("");
      }
    } catch (error) {
      console.error("Login failed!", error.response?.data || error.message);
    }
  }

  return (
    <PageContainer>
      <Header title="Pieslēgties" linkText={null} />
      <Content>
        <LeftColumn>
          <div>
            <h3>E-pasts *</h3>
            <NiceInput
              type="text"
              placeholder="Ievadi e-pastu"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>
          <div>
            <h3>Parole *</h3>
            <NiceInput
              type="password"
              placeholder="Ievadi paroli"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>
          <HeavyButton title="Pieslēgties" onClick={handleSubmit} />
        </LeftColumn>
        <RightColumn>
          <HeavyButton
            to="/register"
            title="Reģistrēties"
            color={colors.backgroundDark}
          />
          <HeavyButton
            to="/recipes"
            title="Turpināt kā viesis"
            color={colors.highlight}
          />
        </RightColumn>
        {isModalOpen && (
          <NotificationModal
            {...modalProps}
            onClose={() => setModalOpen(false)}
          />
        )}
      </Content>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
`;

const LeftColumn = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-right: 1px solid black;
  & > * {
    width: 250px;
  }
`;

const RightColumn = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  & > * {
    width: 250px;
  }
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
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Subtle glow effect */
  }
`;

export default LoginPage;
