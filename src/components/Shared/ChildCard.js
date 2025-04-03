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
      <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Launch demo modal
      </button>

      <div className="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              ...
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary">Save changes</button>
            </div>
          </div>
        </div>
      </div>
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
          <Button size="small" startIcon={<AddIcon />}>
            Schedule
          </Button>
        </CardActions>
      </Card>
    </>
  );
}

export default ChildCard;
