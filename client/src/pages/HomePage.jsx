import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import Loading from "../components/Loading";

function HomePage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();
  const navigate = useNavigate(); // Get the navigate function

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    // Test this out and maybe add loading icon instead
    return <Loading />;
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    navigate(user.isAdmin ? "/admin/menu" : "/menu");
    return;
  }

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <h1>Receptes</h1>
      </MainContent>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  height: 100vh;
  position: relative;
`;

const MainContent = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  z-index: -1;
  & > h1 {
    font-size: 3.2em;
  }
`;

export default HomePage;
