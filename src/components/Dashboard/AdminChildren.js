import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useQuery } from "@tanstack/react-query";

const AdminChildren = () => {
  const { dbService } = useAuth();

  const {
    data: children = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ['adminAllChildren'],
    queryFn: dbService.fetchAllChildren
  })


  const formatTableRow = (child) => {
    return (
      <tr key={child.id}>
        <th scope="row">{child.Name || '--'}</th>
        <td>{new Date(child.DOB.seconds).toLocaleDateString() || '--'}</td>
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
                {isLoading && <p>Loading...</p>}
                {!isLoading && !isError && (
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

export default AdminChildren;