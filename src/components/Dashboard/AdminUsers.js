import { FirebaseDbService } from "../../Helpers/firebase";
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { db } from "../../config/firestore";

const AdminUsers = () => {
  const [users, setUsers] = useState(null);
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (!dbService) return;
    const getUsers = async () => dbService.fetchAllUsers()
      .then((data) => {
        setUsers(data);
      }).catch((error) => {
        console.error(error);
      });

    getUsers();
  }, [dbService]);

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