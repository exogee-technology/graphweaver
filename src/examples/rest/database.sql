/*******************************************************************************
   Drop database if it exists
********************************************************************************/
DROP DATABASE IF EXISTS `todo_app`;


/*******************************************************************************
   Create database
********************************************************************************/
CREATE DATABASE todo_app;
USE todo_app;

CREATE TABLE task (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id BIGINT NOT NULL,
  priority ENUM('HIGH', 'MEDIUM', 'LOW')
);

CREATE TABLE tag (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE task_tags (
  task_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES task(id),
  FOREIGN KEY (tag_id) REFERENCES tag(id)
);

CREATE TABLE credential (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE api_key (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  secret VARCHAR(255) NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  roles TEXT NOT NULL
);

CREATE TABLE authentication (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  user_id BIGINT NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES credential(id)
);

INSERT INTO credential (id, username, password)
VALUES
  (1, 'luke', '$argon2id$v=19$m=65536,t=3,p=4$Gn/jQ7cAqwb0ZieRlzFXOw$Nyp/WnlHan1kKYaUAjQkidVvKSB2AUdAzLctPkD6sZo'),
  (4, 'darth', '$argon2id$v=19$m=65536,t=3,p=4$vM5N5I6+Ed46GWe7YCH0pQ$Lc7+o27PIhE4eK4cDvKz2TT9e/UW2LCcf7ExAX7y7gQ')
  ;

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