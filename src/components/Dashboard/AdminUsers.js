import React, { useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { use } from "react";

const AdminUsers = () => {
  const [allUsers, setAllUsers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const { dbService } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState("");

  useEffect(() => {
    if (!dbService) return;
    setIsLoading(true);
    dbService.fetchAllCurrentUsers().then((resp) => {
      setAllUsers(resp)
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error fetching children:', error);
      setAllUsers([]);
      setIsLoading(false);
      setIsError(true);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (searchTerm !== "" && allUsers.length > 0) {
      console.log('Searching for:', searchTerm);
      console.log(allUsers)
      const filteredUsers = allUsers.filter(user =>
        user?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.CellNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAllUsers(filteredUsers);
    } else {
      // If search term is empty, refetch all users
      dbService.fetchAllCurrentUsers().then((resp) => {
        setAllUsers(resp);
      }).catch((error) => {
        console.error('Error fetching children:', error);
        setAllUsers([]);
      });
    }
  }, [searchTerm]);


  const formatTableRow = (user) => {
    return (
      <tr key={user.id}>
        <th scope="row">{user.Name || '--'}</th>
        <td>{user.Email || '--'}</td>
        <td>{user.CellNumber || '--'}</td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-12 col-xl-12 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">Users</h5>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search</label>
                <input type="text" className="form-control" id="search" aria-describedby="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="table-responsive">
                {isLoading && <p>Loading...</p>}
                {!isLoading && !isError && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers && allUsers.map((user) => formatTableRow(user))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* <a href="#" className="btn btn-block btn-light">View all</a> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminUsers;