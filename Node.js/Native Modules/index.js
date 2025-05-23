const fs = require("fs");

// fs.writeFile("message.txt", "Hello from nodejs!",(err) => {
//   if (err) throw err;
//   console.log('successfully deleted /tmp/hello');
// });

//This code is for read data from file 
fs.readFile("./message.txt","utf-8",(err, data) => {
  if (err) throw err;
  console.log(data);
});