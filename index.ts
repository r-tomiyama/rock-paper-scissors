import express from "express";

const app: express.Express = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log("Start on port 3000.");
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.render("./index.ejs", { hoge: "hoge" });
});
