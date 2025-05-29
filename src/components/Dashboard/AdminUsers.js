import React from "react";
import { useAuth } from "../AuthProvider";
import { useQuery } from "@tanstack/react-query";

const AdminUsers = () => {
  const { dbService } = useAuth();

  const { 
    data: users = [],
    isLoading,
    isError
  } = useQuery({queryKey: ['adminAllUsers'], queryFn: dbService.fetchAllUsers})

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