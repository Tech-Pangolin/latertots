import React from "react";
import { useAllUsersRQ } from "../../Hooks/query-related/useAllUsersRQ";

const AdminUsers = () => {
  const {
    data: users = [],
    isLoading,
    isError
  } = useAllUsersRQ()

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
        <div className="col-12 col-xl-8 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">Users</h5>
            <div className="card-body">
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
                      {users && users.map((user) => formatTableRow(user))}
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