import React, { useEffect } from "react";
import styled from "styled-components";

function NotificationModal({ type, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer); // Cleanup on unmount
  }, [onClose]);

  return (
    <ModalContainer>
      <Message type={type}>
        {message}
        <CloseButton onClick={onClose}>×</CloseButton>
      </Message>
    </ModalContainer>
  );
}

const ModalContainer = styled.div`
  position: fixed;
  top: 5px; /* Position near the top */
  left: 50%; /* Center horizontally */
  transform: translateX(-50%); /* Adjust for center alignment */
  z-index: 1000; /* Keep above other elements */
  pointer-events: none; /* Allow clicks through to other elements */
`;

const Message = styled.div`
  background-color: ${(props) =>
    props.type === "success" ? "#d4edda" : "#f8d7da"};
  color: ${(props) => (props.type === "success" ? "#155724" : "#721c24")};
  padding: 15px 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid
    ${(props) => (props.type === "success" ? "#c3e6cb" : "#f5c6cb")};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  font-size: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 400px;
  pointer-events: all; /* Enable interaction for the modal */
  word-break: break-word; /* So long messages don't go outside */
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
`;

export default NotificationModal;
