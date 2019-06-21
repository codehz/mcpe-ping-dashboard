const ping = require("mcpe-ping");
const express = require("express");
const dot = require("dot-prop");
const ejs = require("ejs");
const htmlminify = require('html-minifier');
const fs = require("fs");
const path = require("path");

app = express();
app.set('view engine', 'ejs');
app.engine('ejs', (path, data, cb) => {
  ejs.renderFile(path, data, {}, (err, data) => {
    try {
      if (err) cb(err);
      else cb(null, htmlminify.minify(data, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true
      }));
    } catch (e) {
      cb(e);
    }
  })
});
const xping = (host, port) => new Promise((resolve, reject) => {
  ping(host, port, (err, data) => {
    if (err) resolve({});
    else resolve(data);
  });
});
const mapped = async (arr) => {
  const ret = [];
  for (const item of arr) {
    ret.push(await item);
  }
  return ret;
};

app.get("/servers/:group", async (req, resp) => {
  try {
    const servers = JSON.parse(await fs.promises.readFile(path.join(__dirname, "config", req.params.group + '.json'), 'utf-8'));
    const data = await mapped(servers.map(({ host, port }) => xping(host, port)));
    resp.render('status', { data, servers });
  } catch (e) {
    console.error(e)
    resp.json(e);
  }
});
app.get("/ping/:host/:port/:path?", (req, resp) => {
  const { host, port, path = '' } = req.params;
  ping(host, +port, (err, data) => {
    try {
      if (err) {
        resp.json(err);
      } else if (path) {
        resp.end(dot.get(data, path) + '');
      } else {
        resp.json(data);
      }
    } catch (e) {
      resp.json(e);
    }
  }, 5000);
});

app.listen(+(process.env.PORT || 1234));
