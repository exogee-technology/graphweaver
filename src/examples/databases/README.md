# Multiple Databases

It is possible to connect more than one database to GraphWeaver and expose the data via the API.

This example demonstrates how to do that with a MySQL and PostgreSQL database.

To run the example make sure that you have a local MySQL and PostgreSQL database and that you seed each database as below.

The user table in PostgreSQL looks like this:

```
CREATE DATABASE todo_app;

CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for user table
INSERT INTO user (username, email)
VALUES
  ('john_doe', 'john.doe@example.com'),
  ('jane_smith', 'jane.smith@example.com'),
  ('mike_jones', 'mike.jones@example.com'),
  ('sarah_wilson', 'sarah.wilson@example.com'),
  ('david_lee', 'david.lee@example.com'),
  ('amy_garcia', 'amy.garcia@example.com'),
  ('jason_lam', 'jason.lam@example.com'),
  ('jenny_kim', 'jenny.kim@example.com'),
  ('kevin_wu', 'kevin.wu@example.com'),
  ('lisa_choi', 'lisa.choi@example.com');
```

The todo table is in MySQL and looks like this:

```
CREATE DATABASE todo_app;

CREATE TABLE task (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id INT NOT NULL
);

-- Seed data for task table
INSERT INTO task (description, completed, user_id)
VALUES
  ('Buy groceries', false, 1),
  ('Clean the house', true, 1),
  ('Do laundry', false, 2),
  ('Walk the dog', false, 2),
  ('Pay bills', true, 1),
  ('Buy a birthday present for mom', false, 3),
  ('Finish the report for work', false, 4),
  ('Prepare for the meeting', true, 4),
  ('Call the doctor', false, 5),
  ('Send an email to the client', true, 5),
  ('Go to the gym', false, 6),
  ('Pick up the kids from school', true, 6),
  ('Pay rent', false, 7),
  ('Schedule a dentist appointment', false, 7),
  ('Update the website', true, 8),
  ('Submit the application', true, 8),
  ('Water the plants', false, 9),
  ('Cook dinner', false, 9),
  ('Read a book', true, 10),
  ('Watch a movie', true, 10),
  ('Go for a run', false, 1),
  ('Write a blog post', false, 2),
  ('Organize the closet', true, 3),
  ('Take the car for a service', false, 4),
  ('Prepare for the exam', false, 5),
  ('Plan a trip', true, 6),
  ('Meet a friend for coffee', true, 7),
  ('Volunteer at the shelter', false, 8),
  ('Attend a concert', true, 9),
  ('Learn a new skill', false, 10),
  ('Visit the museum', true, 1),
  ('Get a haircut', false, 2),
  ('Take the dog to the vet', false, 3),
  ('Practice yoga', true, 4),
  ('Make a budget', false, 5),
  ('Read the news', true, 6),
  ('Go to the beach', true, 7),
  ('Take a nap', false, 8),
  ('Learn a new recipe', false, 9),
  ('Do a puzzle', true, 10),
  ('Buy new shoes', false, 1),
  ('Finish the book', false, 2),
  ('Make a reservation', true, 3),
  ('Create a playlist', true, 4),
  ('Write a poem', false, 5),
  ('Try a new restaurant', true, 6),
  ('Take a walk in the park', false, 7),
  ('Clean the car', false, 8),
  ('Do some gardening', true, 9),
  ('Watch a TV show', true, 10),
  ('Finish the painting', false, 1),
  ('Take a cooking class', false, 2),
  ('Go to the library', true, 3),
  ('Do some stretches', true, 4),
  ('Prepare for the interview', false, 5),
  ('Go for a bike ride', true, 6),
  ('Try a new hobby', false, 7),
  ('Get a massage', true, 8),
  ('Do a home workout', false, 9),
  ('Listen to a podcast', true, 10),
  ('Make a donation', false, 1),
  ('Visit a friend', false, 2),
  ('Take a day off', true, 3),
  ('Go on a hike', true, 4),
  ('Write a letter', false, 5),
  ('Try a new sport', true, 6),
  ('Buy a plant', false, 7),
  ('Read a magazine', true, 8),
  ('Do some meditation', false, 9),
  ('Go to a concert', true, 10),
  ('Take a bubble bath', false, 1),
  ('Try a new food', false, 2),
  ('Go on a road trip', true, 3),
  ('Do some cardio', true, 4),
  ('Update the resume', false, 5),
  ('Take a dance class', true, 6),
  ('Go to the zoo', false, 7),
  ('Listen to music', true, 8),
  ('Do some yoga', false, 9),
  ('Watch a play', true, 10),
  ('Do some painting', false, 1),
  ('Learn a new language', false, 2),
  ('Take a nap in the sun', true, 3),
  ('Try a new drink', true, 4),
  ('Apply for a scholarship', false, 5),
  ('Go to the beach', true, 6),
  ('Buy a new book', false, 7),
  ('Take a bubble bath', true, 8),
  ('Do some stretching', false, 9),
  ('Watch a documentary', true, 10),
  ('Make a smoothie', false, 1),
  ('Try a new hobby', false, 2),
  ('Go to a museum', true, 3),
  ('Do some weightlifting', true, 4),
  ('Clean out the closet', false, 5),
  ('Take a photography class', true, 6),
  ('Go to the park', false, 7),
  ('Listen to a audiobook', true, 8),
  ('Do some Pilates', false, 9),
  ('Watch a comedy', true, 10);
```

Once the database is up and running you can start the example with:

`pnpm start`
