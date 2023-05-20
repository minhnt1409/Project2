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
  author_name VARCHAR(255) NOT NULL,
  created VARCHAR(255),
  modified VARCHAR(255),
  PRIMARY KEY (room_id)
);

create table comments
(
    comment_id int not null primary key auto_increment,
    deleted bool null,
    created datetime null,
    created_by nvarchar(255) null,
    modified_date bigint null,
    modified_by nvarchar(255) null,
    content text null,
    user_id int null,
    room_id INT NOT NULL
    author_id INT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    auuthor_avatar VARCHAR(255) NOT NULL,
    PRIMARY KEY (comment_id),
    FOREIGN KEY (author_id,author_name,author_avatar) REFERENCES users(id,username,avatar)
);

create table blocks
(
    id int not null primary key auto_increment,
    deleted bool null,
    created bigint null,
    created_by nvarchar(255) null,
    modified_date bigint null,
    modified_by nvarchar(255) null,
    id_blocks int null,
    id_blocked int null
);

create table report
(
    report_id int not null primary key auto_increment,
    deleted bool null,
    created bigint null,
    created_by nvarchar(255) null,
    modified_date bigint null,
    modified_by nvarchar(255) null,
    user_id int null,
    room_id int null,
    content text null,
    PRIMARY KEY (report_id),
);

CREATE TABLE IF NOT EXISTS push (
    id INT NOT NULL AUTO_INCREMENT,
    new_roommate VARCHAR(255),
    new_room VARCHAR(255),
    news VARCHAR(255),
    PRIMARY KEY (id)
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