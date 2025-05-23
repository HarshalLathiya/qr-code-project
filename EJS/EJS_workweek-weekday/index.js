import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
    const today = new Date();
    let day = today.getDay();
    let date = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
    // console.log(day);
    let type = "a weekday";
    let adv = "it's time to work hard";
    if (day === 0 || day === 6)//Sunday = 0,saturday=6
    {
        let type = "The weekday";
        let adv = "It's time to have some fun!";
    }
    res.render("index.ejs",{currentDate: date,daytype: type,advice: adv,});
}); 

app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});