var val = require("./src/validation");

val.errors('/aaa', "#%RAML 1.0").forEach(function(x) {
    console.log(x.message);
    console.log(x.start);
    console.log(x.end);
});