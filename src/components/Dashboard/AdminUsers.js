import React, { useMemo } from "react";
import { useAllUsersRQ } from "../../Hooks/query-related/useAllUsersRQ";

const AdminUsers = () => {
  const { data: allUsers = [], isLoading, isError } = useAllUsersRQ();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(user =>
      user?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.CellNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);


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
                      {filteredUsers && filteredUsers.map((user) => formatTableRow(user))}
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