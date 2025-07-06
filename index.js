import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { render } from "ejs";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "admin",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = -1;

let users = [
  // { id: 1, name: "Angela", color: "teal" },
  // { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users on users.id = visited_countries.user_id where users.id = $1",
    [currentUserId]
  );
  let countries = [];
  if(result.rows.length == 0) return countries;
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser(){
  const result = await db.query("select * from users");
  for(const user of result.rows){
    if(user.id == currentUserId) return user;
  }
}

async function updateUsers(){
  const result = await db.query("select * from users;");
  let temp = [];
  for(const user of result.rows){
    temp.push(user);
  }
  users = temp;
}


app.get("/", async (req, res) => {
    const countries = await checkVisisted();
    const user = await getCurrentUser();
    await updateUsers();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: user!== undefined ? user.color : "teal",
    });
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  try{
    const result = await db.query("insert into users(name, color) values ($1, $2) RETURNING *;",
    [req.body.name, req.body.color]);
    currentUserId = result.rows[0].id;
    // console.log(result);
    res.redirect("/");
  }
  catch(error){
    console.error(error);
    res.render("new.ejs", {error: "Enter valid name and color !!!"});
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser();
  if(currentUser === undefined || currentUserId == -1){
    // console.log(currentUser);
    res.redirect("/");
    return;
  }
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1;",
      [input.toLowerCase()]
    );
    // if country not found ? 
  
    if(result.rows[0] === undefined){
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser!==undefined ? currentUser.color : "teal",
        error: "Enter a valid country name !!!"
      });
      return;
    }

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      const result = await db.query("select country_code from visited_countries join users on users.id = visited_countries.user_id where users.id = $1",
        [currentUserId]
      );

      // checking if already exists
      for(let country of result.rows){
        if(countryCode == country.country_code){
          const countries = await checkVisisted();
          res.render("index.ejs", {
            countries: countries,
            total: countries.length,
            users: users,
            color: currentUser!==undefined ? currentUser.color : "teal",
            error: "Country name already exists !!!"
          });
          return;
        }
      }
      // inserting the value if not already found
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUser.id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);      
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
