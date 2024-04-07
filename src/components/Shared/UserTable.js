import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

function UsersTable({ users }) {
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Cell</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Zip</TableCell>
                    {/* Add other fields as needed */}
                </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell key={`${user.id}-name`}>{user.Name}</TableCell>
                  <TableCell key={`${user.id}-role`}>{user.Role}</TableCell>
                  <TableCell key={`${user.id}-email`}>{user.Email}</TableCell>
                  <TableCell key={`${user.id}-cell`}>{user.CellNumber}</TableCell>
                  <TableCell key={`${user.id}-address`}>{user.StreetAddress}</TableCell>
                  <TableCell key={`${user.id}-city`}>{user.City}</TableCell>
                  <TableCell key={`${user.id}-state`}>{user.State}</TableCell>
                  <TableCell key={`${user.id}-zip`}>{user.Zip}</TableCell>
                  {/* Render other fields as needed */}
                </TableRow>
              ))}
            </TableBody>
        </Table>
    );
}

export default UsersTable;