-- import data from countries.csv

CREATE TABLE countries(
  id SERIAL PRIMARY KEY,
  country_code CHAR(2),
  country_name VARCHAR(50)
);

-- DROP TABLE IF EXISTS visited_countries, users;


CREATE TABLE users(
id SERIAL PRIMARY KEY,
name VARCHAR(15) UNIQUE NOT NULL,
color VARCHAR(15) NOT NULL
);

CREATE TABLE visited_countries(
id SERIAL PRIMARY KEY,
country_code CHAR(2) NOT NULL,
user_id INTEGER REFERENCES users(id) NOT NULL
UNIQUE (country_code , user_id)
);


-- SELECT *
-- FROM visited_countries
-- JOIN users
-- ON users.id = user_id;