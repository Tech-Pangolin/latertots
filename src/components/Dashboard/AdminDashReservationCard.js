import React from 'react';
import { Avatar, Button, Card, CardActions, CardHeader, Typography } from '@mui/material';

export default function AdminDashReservationCard() {
  const userData = {
    name: 'ChildName',
    img: 'https://www.w3schools.com/howto/img_avatar.png',
    parentName: 'ParentName',
    date: 'Date_of_reservation',
    time: 'Times_of_reservation',
  }

  return (
    <>
      <Card variant='outlined' sx={{ marginBottom: '10px' }}>
        <CardHeader
          avatar={
            <Avatar
              src={userData.img}
              alt={userData.name}
              sx={{ width: 56, height: 56 }} ></Avatar>
          }
          title={
            <>
              <Typography variant="h6" >{userData.name}</Typography>
              {/* TODO: Should the parent name be a link to some kind of summary page in admin? */}
              <Typography variant="body2" color="text.secondary">{userData.parentName}</Typography> 
            </>
          }
          subheader={
            <>
              <Typography variant="body2" color="text.secondary">Date: {userData.date}</Typography>
              <Typography variant="body2" color="text.secondary">Time: {userData.time}</Typography>
            </>
          }
        />
        <CardActions sx={{ justifyContent: 'center' }}>
          <Button size="medium" variant='contained'>Approve</Button>
          <Button size="medium" >Decline</Button>
        </CardActions>
      </Card>
    </>
  );
}