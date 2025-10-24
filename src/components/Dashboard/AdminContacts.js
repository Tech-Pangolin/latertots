import React, { useEffect } from "react";
import { useContactsRQ } from "../../Hooks/query-related/useContactsRQ";

const AdminContacts = () => {
  const { data: allContacts = [], isLoading, isError } = useContactsRQ();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [contactList, setContactList] = React.useState([]);

  useEffect(() => {
    if (searchTerm !== "" && contactList.length > 0) {
      const filteredContacts = contactList.filter(contact => {        
        return contact?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact?.Email?.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setContactList(filteredContacts);
    } else {
      // If search term is empty, restore all contacts
      setContactList(allContacts);
    }
  }, [searchTerm, allContacts]);

  const formatTableRow = (user) => {
    return (
      <tr key={user.id}>
        <th scope="row">{user.Name || '--'}</th>
        <td>{user.Email || '--'}</td>
        <td>{user.Phone || '--'}</td>
        <td>{user.Relation || '--'}</td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-12 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">All Contacts</h5>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search</label>
                <input type="text" placeholder="Search by name or email" className="form-control" id="search" aria-describedby="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="table-responsive">
                {isLoading && <p>Loading...</p>}
                {!isLoading && !isError && <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Relation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactList && contactList.map((user) => formatTableRow(user))}
                  </tbody>
                </table>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminContacts;