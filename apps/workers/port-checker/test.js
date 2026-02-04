fetch("http://127.0.0.1:8787", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    host: "google.com",
    ports: [80, 443]
  })
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
