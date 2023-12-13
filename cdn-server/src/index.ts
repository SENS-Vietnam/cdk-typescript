// @ts-nocheck
import { Hono } from "hono";

const app = new Hono();

const domain = "http://localhost:3000";

const render = () => {
  fetch("/date")
    .then((r) => {
      const h = Object.fromEntries(r.headers);
      const t = Object.entries(h).map(
        ([k, v]) => k.toUpperCase() + " : " + `<span style="color:forestgreen">${v}</span>`
      );

      const ul = document.getElementById("header");
      t.map((i) => {
        const li = document.createElement("li");
        li.innerHTML = i;
        ul?.appendChild(li);
      });

      return r.text();
    })
    .then((text) => {
      document.getElementById("date").innerHTML = text;
    });
};

app.get("/", (c) => {
  c.header("cache-control", "s-maxage=2");
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body style='font-size:20px'>
    <h4>Hello world</h4>
    <p style='font-size:24px;color:blueviolet' id='date'></p>
    <hr/>
    <ul id='header' style="display:grid;gap:8px;"></ul>
    <script>
    eval(${render.toString()})();
    </script>
</body>
</html>`);
});
app.get("/test", (c) => c.text("Test data!"));
app.get("/date", (c) => {
  const date = new Date();
  c.header("cache-control", "s-maxage=10, stale-while-revalidate=20");
  const header = c.req.header()["if-modified-since"];
  console.log({ header });
  c.header("Last-Modified", new Date(date.getTime() - 5_000).toUTCString());
  // if (header < `Tue, 12 Dec 2023 15:55:10 GMT`) {
  //   c.status(304);
  // } else {
  //   c.status(200);
  // }
  return c.html(
    `Current date is: ${date.getMinutes()}m:${date.getSeconds()}s:${date.getMilliseconds()}`
  );
});

export default app;
