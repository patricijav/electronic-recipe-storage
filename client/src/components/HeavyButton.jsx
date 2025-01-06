import { Link } from "react-router-dom";
import styled from "styled-components";
import colors from "../colors";

function HeavyButton({ to, title, onClick, color = colors.backgroundMedium }) {
  return (
    <LinkContainer>
      <StyledLink color={color} to={to} onClick={onClick}>
        <ButtonText>{title}</ButtonText>
      </StyledLink>
    </LinkContainer>
  );
}

const LinkContainer = styled.div``;
//outline: none; /* Remove default outline */
//border-color: ${colors.highlight}; /* Highlight border on focus */
//box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Subtle glow effect */

const StyledLink = styled(Link)`
  background-color: ${(props) => props.color};
  border: 1px solid ${(props) => props.color};
  box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.1);
  &:hover,
  &:focus {
    outline: none;
    border: 1px solid ${colors.text};
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.2);
  }

  display: flex; /* To center text in the middle of icon */
  align-items: center; /* To center text in the middle of icon */
  gap: 8px; /* To add a little bit space between the icon and the text */
  color: inherit; /* Instead of blue or purple links have black links */
  text-decoration: none; /* Remove underline by default */
  font-size: 1.5em; /* To make it the same size as default h1 */
  font-weight: 500;
  width: 100%;
`;

const ButtonText = styled.span`
  text-align: center; /* Ensure text is centered inside */
  width: 100%;
`;

export default HeavyButton;
