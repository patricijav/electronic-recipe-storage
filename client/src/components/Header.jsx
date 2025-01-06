import { Link } from "react-router-dom";
import styled from "styled-components";

import basicUserAvatar from "/src/assets/basic_user.svg";

function Header({ title, user, linkText = "Ienākt", makeSmall = false }) {
  return (
    <HeaderContainer>
      {title && (
        <HeadingContainer>
          <StyledHeading makeSmall={makeSmall}>{title}</StyledHeading>
        </HeadingContainer>
      )}

      {/* This has a lot of similar properties as LightButton, but it's different, maybe you can export style components, though */}
      {(user || linkText) && (
        <LinkContainer>
          <StyledLink
            to={user ? (user.isAdmin ? "/admin/menu" : "/menu") : "/login"}
          >
            <Icon src={basicUserAvatar} alt="Avatar" />
            <AvatarText>
              {user ? `${user.firstName} ${user.lastName}` : linkText}
            </AvatarText>
          </StyledLink>
        </LinkContainer>
      )}
    </HeaderContainer>
  );
}

const HeaderContainer = styled.header`
  display: flex; /* So children are on the same line */
  position: sticky; /* So it sticks to the top*/
  top: 0; /* So it sticks to the top*/
  border-bottom: 1px solid black;
  background-color: #dfd3c3; /* So it isn't invisble, but at the same color as background */
  align-items: center; /* So the smaller item (button) is on the same vertical line */
  height: 60px;
  z-index: 1000;
`;

const HeadingContainer = styled.div`
  width: calc(100% - 260px * 2);
  margin: 0 auto;
  text-align: center; /* So it automatically puts the text in the center */
`;

const StyledHeading = styled.h1`
  margin: 0;
  font-size: ${(props) => (props.makeSmall ? "20px" : "3.2em")};
  line-height: 1;
`;

const LinkContainer = styled.div`
  position: absolute;
  right: 8px;
  max-width: 250px;
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const StyledLink = styled(Link)`
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

const AvatarText = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export default Header;
