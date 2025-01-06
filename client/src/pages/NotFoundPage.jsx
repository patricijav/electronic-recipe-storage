import React from "react";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import Loading from "../components/Loading";

function NotFoundPage() {
  const { user, authChecked } = useAuthCheck();

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    return <Loading />;
  }

  return (
    <PageContainer>
      <Header user={user} />
      <MainContent>
        <h1>404</h1>
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

export default NotFoundPage;
