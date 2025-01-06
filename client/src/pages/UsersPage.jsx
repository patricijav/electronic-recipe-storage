import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import useAuthCheck from "../auth/useAuthCheck";
import Header from "../components/Header";
import Loading from "../components/Loading";
import deleteIcon from "/src/assets/trash.svg";

function UsersPage() {
  const { user, isAuthenticated, authChecked } = useAuthCheck();

  const navigate = useNavigate(); // Get the navigate function

  const [users, setUsers] = useState([]);

  // Fetch the ingredients when the component mounts
  useEffect(() => {
    if (!authChecked) return;

    async function fetchUsers() {
      try {
        const response = await axios.get("http://localhost:3000/users", {
          headers: { Authorization: localStorage.getItem("token") },
        });
        setUsers(response.data);
        console.log(response.data);
      } catch (error) {
        // Shouldn't happen
        console.error("Error fetching users:", error);
      }
    }

    if (isAuthenticated && user.isAdmin) {
      fetchUsers();
    }
  }, [authChecked]);

  async function deleteUser(user_id) {
    console.log(user_id);

    try {
      // Optimally need to make sure all is good
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== user_id)
      );
      const response = await axios.delete(
        `http://localhost:3000/users/${user_id}`,
        {},
        {
          headers: { Authorization: localStorage.getItem("token") },
        }
      );
      // console.log(response.data);
      /*setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== user_id)
      );*/
      fetchUsers();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  // Only render everything else once the auth check is complete
  if (!authChecked) {
    return <Loading />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    navigate("/login");
    return;
  } else if (!user.isAdmin) {
    navigate("/menu");
    return;
  }

  return (
    <div>
      <Header title="Lietotāji" user={user} />
      <Content>
        <Centerer>
          <h1>Lietotāju saraksts</h1>
        </Centerer>
        {users.length === 0 && (
          <NoRecipesMessage>
            Pašlaik nav (parastu) reģistrētu lietotāju
          </NoRecipesMessage>
        )}
        <RowsContainer>
          {users.map((user, index) => (
            <>
              {index === 0 && (
                <HeaderUserRow key="unique">
                  <FirstColumn>E-pasts</FirstColumn>
                  <SecondColumn>Vārds</SecondColumn>
                  <ThirdColumn>Uzvārds</ThirdColumn>
                  <FourthColumn>Dzēst</FourthColumn>
                </HeaderUserRow>
              )}
              <UserRow key={user.user_id}>
                <EmailDiv>{user.email}</EmailDiv>
                <FirstNameDiv>{user.first_name}</FirstNameDiv>
                <NameDiv>{user.last_name}</NameDiv>
                <FourthColumn>
                  <IconDiv>
                    <Icon
                      src={deleteIcon}
                      alt="Button Image"
                      onClick={() => deleteUser(user.user_id)}
                    />
                  </IconDiv>
                </FourthColumn>
              </UserRow>
            </>
          ))}
        </RowsContainer>
      </Content>
    </div>
  );
}

const Content = styled.div`
  //display: flex;
  //flex-direction: column;
  //gap: 10px;
`;

const Centerer = styled.div`
  display: flex;
  justify-content: center;
`;

const IconDiv = styled.div`
  cursor: pointer;
`;

const Icon = styled.img`
  width: 32px;
  height: 32px;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  border: 1px solid black;
  gap: 10px;
`;

const HeaderUserRow = styled(UserRow)`
  font-weight: 800;
`;

const EmailDiv = styled.div`
  flex: 2;
  word-break: break-word;
`;

const NameDiv = styled.div`
  flex: 1;
  word-break: break-word;
`;

const FirstNameDiv = styled(NameDiv)`
  flex: 1;
  word-break: break-word;
`;

const NoRecipesMessage = styled.div`
  text-align: center;
  font-size: 1.5rem;
`;

const FirstColumn = styled.div`
  flex: 2;
`;
const SecondColumn = styled.div`
  flex: 1;
`;
const ThirdColumn = styled.div`
  flex: 1;
`;
const FourthColumn = styled.div`
  width: 75px;
`;

const RowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export default UsersPage;
