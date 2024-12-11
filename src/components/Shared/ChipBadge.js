import React from 'react';
import { Avatar, Chip } from '@mui/material';
import { darken, lighten, margin, readableColor, rgb } from 'polished';

const ChipBadge = ({ text, color, num, clickHandler }) => {
  const defaultBackgroundColor = rgb(237, 84, 197);

  const chipStyle = {
    backgroundColor: color || defaultBackgroundColor,
    color: readableColor(color || defaultBackgroundColor, 'black', 'white'),
    margin: '2px'
  }

  const badgeStyle = {
    backgroundColor: lighten(0.3, color || defaultBackgroundColor),
    color: darken(0.4, color || defaultBackgroundColor),
    fontWeight: 900
  }

  const numberBadge = (num) => <Avatar style={badgeStyle}>{`${num}`}</Avatar>;

  if (num) {
    return (<Chip label={text} style={chipStyle} avatar={numberBadge(num)} onClick={clickHandler}/>);
  } else {
    return (<Chip label={text} style={chipStyle} onClick={clickHandler}/>);
  }
};

export default ChipBadge;