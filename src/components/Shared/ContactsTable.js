import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

function ContactsTable({ contacts }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Relation</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Phone</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {contacts.map(contact => (
        <TableRow key={contact.id}>
          <TableCell>{contact.Name}</TableCell>
          <TableCell>{contact.Relation}</TableCell>
          <TableCell>{contact.Email}</TableCell>
          <TableCell>{contact.Phone}</TableCell>
        </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ContactsTable;