import { Link } from "react-router-dom";
import styled from "styled-components";

function LightButton({ to, image, title, onClick }) {
  return (
    <LinkContainer>
      <StyledLink to={to} onClick={onClick}>
        <Icon src={image} alt="Button Image" />
        {title}
      </StyledLink>
    </LinkContainer>
  );
}

const LinkContainer = styled.div`
  border: 1px solid black;
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const StyledLink = styled(Link)`
  height: 100%;
  width: 100%;
  display: flex; /* To center text in the middle of icon */
  align-items: center; /* To center text in the middle of icon */
  gap: 8px; /* To add a little bit space between the icon and the text */
  color: inherit; /* Instead of blue or purple links have black links */
  text-decoration: none; /* Remove underline by default */
  font-size: 1.5em; /* To make it the same size as default h1 */
  font-weight: 500;
  &:hover {
    text-decoration: underline; /* Add underline back on hover */
  }
`;

export default LightButton;
