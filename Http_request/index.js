import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.send("<h1>Hello World!</h1>");
});

app.get("/about", (req, res) => {
    res.send("<h1>About Page</h1><br><h2>Hello I'm Harshal Lathiya</h2>");
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});