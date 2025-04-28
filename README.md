# Latertots Childcare Management Application

Latertots is a childcare management application designed to simplify the process of managing childcare reservations. It's built with React and uses Firebase for authentication and data storage.

## Features

- **User Registration and Authentication**: Users can register for an account and log in. The application uses Firebase Authentication for secure user management.

- **Child Registration**: Users can register their children in the system. This information is used when making a reservation.

- **Contact Registration**: Users can register their contacts. This information is used when making a reservation.

- **Reservation Management**: Users can create, view, and delete reservations. Reservations are stored in Firebase Firestore.

- **Calendar View**: Users can view their reservations in a calendar. The application uses FullCalendar for the calendar view.

## Running the Application

To run the application, you need to have Node.js and npm installed. You can then install the application's dependencies and start the development server:

```sh
npm install
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Testing the Application

To run the application's tests, use the following command:

```sh
npm test
```

## Editing db schema and access rules

Local --> Cloud
```sh
# Push rules
npx firebase deploy --only firestore:rules

# Push indexes
npx firebase deploy --only firestore:indexes

```
No changes are present on the server until the command is run.

Cloud --> Local
```sh
npx firebase init firestore
```
In case there have been edits directly through the web interface, it's good practice to pull down and overwrite or merge before any attempt to push changes.


## Contributing

If you want to contribute to the application, please create a new branch for your changes and submit a pull request.