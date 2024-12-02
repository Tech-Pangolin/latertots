import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { logger } from "../../Helpers/logger";

const AdminChildren = () => {
  const [children, setChildren] = useState(null);
  const { dbService } = useAuth();

  useEffect(() => {
    if (!dbService) return;
    const getChildren = async () => dbService.fetchAllChildren()
      .then((data) => {
        logger.info("Fetched all children: ", data);
        setChildren(data);
      }).catch((error) => {
        console.error(error);
      });

    getChildren();
  }, [dbService]);

  const formatTableRow = (child) => {
    return (
      <tr key={child.id}>
        <th scope="row">{child.Name || '--'}</th>
        <td>{child.DOB || '--'}</td>
        <td>{child.Gender || '--'}</td>
        <td>{child.Medications || '--'}</td>
        <td>{child.Allergies || '--'}</td>
        <td>{child.Notes || '--'}</td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-12 col-xl-8 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">All Children</h5>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">DOB</th>
                      <th scope="col">Gender</th>
                      <th scope="col">Meds</th>
                      <th scope="col">Allergies</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children && children.map((child) => formatTableRow(child))}
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

export default AdminChildren;