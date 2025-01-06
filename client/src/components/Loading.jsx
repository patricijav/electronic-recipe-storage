import styled, { keyframes } from "styled-components";

import colors from "../colors";

function Loading() {
  return (
    <Content>
      <Spinner />
      <Message>Lūdzu, uzgaidiet līdz mājaslapa ir gatava!</Message>
    </Content>
  );
}

const Content = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3; /* Light gray */
  border-top: 5px solid ${colors.highlight}; /* Blue */
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Message = styled.h1`
  font-size: 1.2em;
  color: #555; /* Slightly muted color */
  text-align: center;
`;

export default Loading;
