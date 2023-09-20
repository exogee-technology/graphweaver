# REST with MySql Databases

It is possible to connect a database and an external REST API to Graphweaver and expose the data via the GraphQL API.

This example demonstrates how to do that with MySQL and the Star Wars API.

To run the example make sure that you have a local MySQL database and that you seed the database as below.

The todo table is in MySQL and looks like this:

```
CREATE DATABASE todo_app;
USE todo_app;

CREATE TABLE task (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  priority ENUM('HIGH', 'MEDIUM', 'LOW')
);

CREATE TABLE tag (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE task_tags (
  task_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES task(id),
  FOREIGN KEY (tag_id) REFERENCES tag(id)
);

-- Seed data for task table
-- Seed data for task table
INSERT INTO task (description, completed, user_id, priority)
VALUES
  ('Go for a run', false, 1, 'HIGH'),
  ('Write a blog post', false, 2, 'MEDIUM'),
  ('Organize the closet', true, 3, 'LOW'),
  ('Take the car for a service', false, 4, 'HIGH'),
  ('Prepare for the exam', false, 5, 'MEDIUM'),
  ('Plan a trip', true, 6, 'LOW'),
  ('Meet a friend for coffee', true, 7, 'HIGH'),
  ('Volunteer at the shelter', false, 8, 'LOW'),
  ('Attend a concert', true, 9, 'MEDIUM'),
  ('Learn a new skill', false, 10, 'HIGH'),
  ('Visit the museum', true, 1, 'LOW'),
  ('Get a haircut', false, 2, 'MEDIUM'),
  ('Take the dog to the vet', false, 3, 'HIGH'),
  ('Practice yoga', true, 4, 'LOW'),
  ('Make a budget', false, 5, 'MEDIUM'),
  ('Read the news', true, 6, 'LOW'),
  ('Go to the beach', true, 7, 'HIGH'),
  ('Take a nap', false, 8, 'LOW'),
  ('Learn a new recipe', false, 9, 'MEDIUM'),
  ('Do a puzzle', true, 10, 'HIGH'),
  ('Buy new shoes', false, 1, 'LOW'),
  ('Finish the book', false, 2, 'MEDIUM'),
  ('Make a reservation', true, 3, 'HIGH'),
  ('Create a playlist', true, 4, 'LOW'),
  ('Write a poem', false, 5, 'MEDIUM'),
  ('Try a new restaurant', true, 6, 'LOW'),
  ('Take a walk in the park', false, 7, 'HIGH'),
  ('Clean the car', false, 8, 'LOW'),
  ('Do some gardening', true, 9, 'MEDIUM'),
  ('Watch a TV show', true, 10, 'HIGH'),
  ('Finish the painting', false, 1, 'LOW'),
  ('Take a cooking class', false, 2, 'MEDIUM'),
  ('Go to the library', true, 3, 'HIGH'),
  ('Do some stretches', true, 4, 'LOW'),
  ('Prepare for the interview', false, 5, 'MEDIUM'),
  ('Go for a bike ride', true, 6, 'LOW'),
  ('Try a new hobby', false, 7, 'HIGH'),
  ('Get a massage', true, 8, 'LOW'),
  ('Do a home workout', false, 9, 'MEDIUM'),
  ('Listen to a podcast', true, 10, 'HIGH'),
  ('Make a donation', false, 1, 'LOW'),
  ('Visit a friend', false, 2, 'MEDIUM'),
  ('Take a day off', true, 3, 'HIGH'),
  ('Go on a hike', true, 4, 'LOW'),
  ('Write a letter', false, 5, 'MEDIUM'),
  ('Try a new sport', true, 6, 'LOW'),
  ('Buy a plant', false, 7, 'HIGH'),
  ('Read a magazine', true, 8, 'LOW'),
  ('Do some meditation', false, 9, 'MEDIUM'),
  ('Go to a concert', true, 10, 'HIGH'),
  ('Take a bubble bath', false, 1, 'LOW'),
  ('Try a new food', false, 2, 'MEDIUM'),
  ('Go on a road trip', true, 3, 'HIGH'),
  ('Do some cardio', true, 4, 'LOW'),
  ('Update the resume', false, 5, 'MEDIUM'),
  ('Take a dance class', true, 6, 'LOW'),
  ('Go to the zoo', false, 7, 'HIGH'),
  ('Listen to music', true, 8, 'LOW'),
  ('Do some yoga', false, 9, 'MEDIUM'),
  ('Watch a play', true, 10, 'HIGH'),
  ('Do some painting', false, 1, 'LOW'),
  ('Learn a new language', false, 2, 'MEDIUM'),
  ('Take a nap in the sun', true, 3, 'HIGH'),
  ('Try a new drink', true, 4, 'LOW'),
  ('Apply for a scholarship', false, 5, 'MEDIUM'),
  ('Go to the beach', true, 6, 'LOW'),
  ('Buy a new book', false, 7, 'HIGH'),
  ('Take a bubble bath', true, 8, 'LOW'),
  ('Do some stretching', false, 9, 'MEDIUM'),
  ('Watch a documentary', true, 10, 'HIGH'),
  ('Make a smoothie', false, 1, 'LOW'),
  ('Try a new hobby', false, 2, 'MEDIUM'),
  ('Go to a museum', true, 3, 'HIGH'),
  ('Do some weightlifting', true, 4, 'LOW'),
  ('Clean out the closet', false, 5, 'MEDIUM'),
  ('Take a photography class', true, 6, 'LOW'),
  ('Go to the park', false, 7, 'HIGH'),
  ('Listen to an audiobook', true, 8, 'LOW'),
  ('Do some Pilates', false, 9, 'MEDIUM'),
  ('Watch a comedy', true, 10, 'HIGH')
  ;

```

Once the database is up and running you can start the example with:

```
pnpm i
pnpm start
```

## Authorization

This example also demonstrates the use of the auth library. By default all requests are made by "Luke Skywalker" and Luke is only able to view and create tasks for himself.

However, if you send a header of `x-user-id: 4` to the server then this will change the logged-in user to "Darth Vadar".

Darth has access to edit and create all entities, he has the power of the dark side.
