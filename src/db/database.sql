-- CREATE DATABASE api;
-- USE api;

-- CREATE TABLE users (
--   id INT NOT NULL AUTO_INCREMENT,
--   username VARCHAR(50) NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   email VARCHAR(100),
--   token VARCHAR(255),
--   avatar VARCHAR(100),
--   role VARCHAR(255),
--   is_block INT default(0),
--   PRIMARY KEY (id)
-- );

-- CREATE TABLE rooms (
--   room_id INT NOT NULL AUTO_INCREMENT,
--   room_name VARCHAR(100) NOT NULL,
--   current INT DEFAULT(1),
--   max INT DEFAULT(20),
--   speed INT DEFAULT(1),
--   author_id INT NOT NULL,
--   created VARCHAR(255),
--   modified VARCHAR(255),
--   PRIMARY KEY (room_id)
-- );
CREATE TABLE tasks (
  task_id INT NOT NULL AUTO_INCREMENT,
  task_name VARCHAR(100) NOT NULL,
  current INT DEFAULT(1),
  begin_at VARCHAR(255),
  end_at VARCHAR(255),
  PRIMARY KEY (task_id),
  
);
CREATE TABLE score (
score_id INT NOT NULL AUTO_INCREMENT primary key ,
  last_score INT ,
  room_id INT,
  created_at VARCHAR,
  FOREIGN KEY(user_id) REFERENCES users(id) 
);
-- INSERT INTO users (username, password, role, is_block)
-- VALUES ('user1', '1', 'user', 0);

-- INSERT INTO users (username, password, role, is_block)
-- VALUES ('user2', '2', 'user', 0);

-- INSERT INTO users (username, password, email, avatar, role, is_block)
-- VALUES ('admin1', '1', 'admin1@gmail.com', 'avatar1.png', 'admin', 0);

-- INSERT INTO users (username, password, email, avatar, role, is_block)
-- VALUES ('admin2', '2', 'admin2@gmail.com', 'avatar2.png', 'admin', 0);

-- INSERT INTO users (username, password, email, avatar, role, is_block)
-- VALUES ('admin3', '$2a$10$VWJc1OnYdThT3CJzwk05GOumF5j3eRIvBsqfZDQ1IYM0./JPznKSm', 'admin3@gmail.com', 'avatar2.png', 'admin', 0);
-- -- $2a$10$VWJc1OnYdThT3CJzwk05GOumF5j3eRIvBsqfZDQ1IYM0./JPznKSm là băm của 3

-- INSERT INTO rooms (room_name, current, max, speed, author_id)
-- VALUES ('room1', 2, 10, 5, 1);

-- INSERT INTO rooms (room_name, current, max, speed, author_id)
-- VALUES ('room2', 0, 8, 3, 2);

-- INSERT INTO rooms (room_name, current, max, speed, author_id)
-- VALUES ('room3', 1, 25, 1, 6);
CREATE DATABASE api;

USE api;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  token VARCHAR(255),
  avatar VARCHAR(100),
  role VARCHAR(255),
  is_block INT default(0),
  PRIMARY KEY (id)
);

CREATE TABLE rooms (
  room_id INT NOT NULL AUTO_INCREMENT,
  room_name VARCHAR(100) NOT NULL,
  current INT DEFAULT(1),
  max INT DEFAULT(20),
  speed INT DEFAULT(1),
  author_id INT NOT NULL,
  created VARCHAR(255),
  modified VARCHAR(255),
  PRIMARY KEY (room_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1_id INT,
  user2_id INT,
  FOREIGN KEY (user1_id) REFERENCES users(id),
  FOREIGN KEY (user2_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT,
  sender_id INT,
  content VARCHAR(500),
  createdmessages DATETIME,
  unread BOOL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  content VARCHAR(255) NOT NULL,
  unread VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  object_id VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS push (
  id INT NOT NULL AUTO_INCREMENT,
  new_roommate VARCHAR(255),
  new_room VARCHAR(255),
  news VARCHAR(255),
  PRIMARY KEY (id)
);
 CREATE TABLE tasks (
  task_id INT NOT NULL AUTO_INCREMENT,
  task_name VARCHAR(100) NOT NULL,
  current INT DEFAULT(1),
  begin_at VARCHAR(255),
  end_at VARCHAR(255),
  PRIMARY KEY (task_id),
  
);
CREATE TABLE score (
score_id INT NOT NULL AUTO_INCREMENT primary key ,
  last_score INT ,
  room_id INT,
  created_at VARCHAR,
  FOREIGN KEY(user_id) REFERENCES users(id) 
);
INSERT INTO users (username, password, role, is_block)
VALUES ('user1', '1', 'user', 0);

INSERT INTO users (username, password, role, is_block)
VALUES ('user2', '2', 'user', 0);

INSERT INTO users (username, password, email, avatar, role, is_block)
VALUES ('admin1', '1', 'admin1@gmail.com', 'avatar1.png', 'admin', 0);

INSERT INTO users (username, password, email, avatar, role, is_block)
VALUES ('admin2', '2', 'admin2@gmail.com', 'avatar2.png', 'admin', 0);

INSERT INTO users (username, password, email, avatar, role, is_block)
VALUES ('admin3', '$2a$10$VWJc1OnYdThT3CJzwk05GOumF5j3eRIvBsqfZDQ1IYM0./JPznKSm', 'admin3@gmail.com', 'avatar2.png', 'admin', 0);
-- $2a$10$VWJc1OnYdThT3CJzwk05GOumF5j3eRIvBsqfZDQ1IYM0./JPznKSm là băm của 3

INSERT INTO rooms (room_name, current, max, speed, author_id)
VALUES ('room1', 2, 10, 5, 1);

INSERT INTO rooms (room_name, current, max, speed, author_id)
VALUES ('room2', 0, 8, 3, 2);

INSERT INTO rooms (room_name, current, max, speed, author_id)
VALUES ('room3', 1, 25, 1, 6);

INSERT INTO conversations (user1_id, user2_id) VALUES
  (5, 7);
  
INSERT INTO messages (conversation_id, sender_id, content, created, unread) VALUES
  (4, 5, 'alo', '2023-04-23 10:00:00', true),
  (4, 7, 'alooo', '2023-04-23 10:02:00', false);
  
INSERT INTO Notifications (type, content, unread, url, object_id)
VALUES 
    (0, 'New roomate: admin1', true, '', '1'),
    (1, 'New room: Room 101', false, '/room/101', '2'),
    (2, "It's lunch time!", false, '/room/99', '3');
INSERT INTO Push (new_roommate, new_room, news)
VALUES
('John', 'Room 101', 'New patient moved to new room'),
('Jane', NULL, "Patient's health is good"),
(NULL, 'Room 103', 'New room is available');

CREATE TABLE IF NOT EXISTS survey (
  id INT NOT NULL AUTO_INCREMENT,
  type INT(2) NOT NULL,
  content VARCHAR(255) NOT NULL,
  options_id INT ,
);
CREATE TABLE IF NOT EXISTS options(
  id INT PRIMARY KEY AUTO_INCREMENT,
  options_id INT ,
  answer VARCHAR(250) NOT NULL,
)
INSERT INTO survey(id,type,content,options_id)
VALUES
('1','1','khao sat 1',NULL),
('2','0','khao sat 1','1'),
('3','1','khao sat 2',NULL),
('4','0','khao sat 3','2'),
INSERT INTO options(options_id,answer)
VALUES
('1','A'),
('1','B'),
('1','C'),
('2','A'),
('2','B')