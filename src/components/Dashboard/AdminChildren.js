import React, { useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { formatAllChildrenData } from "./dataformatterutil";
const AdminChildren = () => {
  const { dbService, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [childList, setChildList] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const fetchChildren = () => {
    if (dbService) {
      setIsLoading(true);
      dbService.getUsersWithChildren().then((data) => {
        setChildList(formatAllChildrenData(data));
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error fetching children:', error);
        setIsLoading(false);
        setIsError(true);
      });
    }
  }
  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (searchTerm !== "" && childList.length > 0) {
      const filteredChildren = childList.filter(child => {
        const childDate = child?.DOB?.seconds ? new Date(child.DOB.toDate()).toLocaleDateString() : '';
        return child?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          childDate.includes(searchTerm.toLowerCase());
      });
      setChildList(filteredChildren);
    } else {
      // If search term is empty, refetch all children
      fetchChildren();
    }
  }, [searchTerm]);


  const formatTableRow = (child) => {
    return (
      <tr key={child.id}>
        <th scope="row">{child.Name || '--'}</th>
        <td>{child.DOB?.seconds ? new Date(child.DOB.toDate()).toLocaleDateString() : '--'}</td>
        <td>{child.Gender || '--'}</td>
        <td>{child.Medications || '--'}</td>
        <td>{child.Allergies || '--'}</td>
        <td>{child.Notes || '--'}</td>
        <td>{child.parentName || '--'}</td>
        <td>{child.parentEmail || '--'}</td>
        <td>{child.parentPhone || '--'}</td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-12 col-xl-12 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">All Children</h5>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search</label>
                <input type="text" placeholder="Search by name or dob" className="form-control" id="search" aria-describedby="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
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
                        <th scope="col">Parent Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childList && childList.map((child) => formatTableRow(child))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminChildren;