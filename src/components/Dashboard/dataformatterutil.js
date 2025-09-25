export const formatAllUsersData = (data) => {

  
    return data.map(user => ({
        id: user.id,
        email: user.Email,
        name: user.Name,
        phone: user.Phone,
        children: user.children || [],
    }));
};


export const formatAllChildrenData = (data) => {  
    console.log(data)
  let formattedData = [];
  for(const user of data){
    if(user.children && user.children.length > 0){
        for(const child of user.children){
            child.parentName = user.Name;
            child.parentEmail = user.Email;
            child.parentPhone = user.CellNumber;
            formattedData.push(child);
        }
    }
  } 
  return formattedData;
};
    