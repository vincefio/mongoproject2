// express

// express-handlebars

// mongoose

// body-parser

// cheerio

// request

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

var methodOverride = require("method-override");

// Override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");



// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Require our userModel model
var Example = require("./models/article.js");

var Note = require("./models/Note.js");

//use body parser with app
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/mongoproject");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("h2.story-heading").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Example(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          // console.log(doc);
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {


  // TODO: Finish the route so it grabs all of the articles
  Example.find({}, function(error, doc){
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Or send the doc to the browser
    else {
      // res.send(doc);
      // res.render("index");
      // console.log('hey this happened')
      res.render("index", {article: doc});
      //renders index page, and sends key article and value doc
    }
  })

});

// This will grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {


  // TODO
  // ====

  // Finish the route so it finds one article using the req.params.id,
  Article.findOneAndUpdate({"_id": req.params.id}, {$push: {"note": doc._id}})
    // Article.findOne({
    //   _id: req.params.id
    // })
  // and run the populate method with "note",
    .populate("note")
    .exec(function(error, doc){
        if (error) {
        res.send(error);
      }
      // Or send the doc to the browser
      else {
        res.send(doc);
      }

    });
  // then responds with the article with the note included


});



// Create a new note or replace an existing note
app.post("/saveArticle/:id", function(req, res) {

  //1. Save the article OUR article list
  //2. res.json("Success!");

  // var newNote = new Example(req.body);

  // newNote.save(function(error, doc){
  //     if (error) {
  //       res.send(error);
  //     }
  //     // Or send the doc to the browser
  //     else {
  //       Example.findOneAndUpdate({"_id": req.params.id}, {"note": doc._id})
  //       .exec(function(error, doc){
  //          if (error) {
  //         res.send(error);
  //       }
  //       // Or send the doc to the browser
  //       else {
  //         res.send(doc);
  //       }

  //       })
  //     }
  // })
});




// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});