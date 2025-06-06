import React from 'react';
import { Card, CardMedia, CardContent, CardActions, IconButton, Typography, Button, Rating } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { calculateAge } from '../../Helpers/util';
import { useNavigate } from 'react-router-dom';

function ChildCard({ child, onNameClick }) {
  const navigate = useNavigate();

  const getAvatarImgName = () => {
    switch (child.Gender) {
      case 'male':
        return 'boy_avatar.png';
      case 'female':
        return 'girl_avatar.png';
      default:
        return 'green_avatar.png';
    }
  }

  const handleEditClick = () => {
    // Navigate to the child registration page with the child object in the location state
    navigate(`/addChild/${child.id}`, { state: { child: child } });
  }


  return (
    <>
      
      <Card sx={{ maxWidth: 275, mx: '20px' }}>
        <div style={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="140"
            image={process.env.PUBLIC_URL + getAvatarImgName()}
            alt="Image description"
            sx={{ objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton aria-label="favorite" onClick={handleEditClick}>
              <EditIcon />
            </IconButton>
          </div>
        </div>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" onClick={() => onNameClick(child)}>
            {child.Name}
          </Typography>
          {/* <Rating name="read-only" value={3} readOnly /> */}
          <Typography variant="body2" color="text.secondary">
            Age: {calculateAge(child.DOB)} years
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" startIcon={<AddIcon />} onClick={() => navigate(`/schedule/`)}>
            Schedule
          </Button>
        </CardActions>
      </Card>
    </>
  );
}

export default ChildCard;
