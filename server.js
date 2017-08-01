

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
var Article = require("./models/article.js");

var Note = require("./models/Note.js");

//use body parser with app
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
// mongoose.connect("mongodb://localhost/mongoproject");
mongoose.connect("mongodb://heroku_hgj0850d:ugn2dnd6f80tg9c46u7frnni3@ds127983.mlab.com:27983/heroku_hgj0850d");
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

app.get("/", function(req, res){
  console.log('home route was hit');
  res.render("index");
})

// A GET request to scrape the nyt website
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
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          // console.log(doc);
          // console.log(doc);
        }
      });

    });
  });

  Article.find({"saved": false}).limit(20).sort({"created_at" : -1}).exec(function(err, doc){
      if (err) {
      console.log(err);
    }
    // Otherwise, save the result as an handlebars object
    else {
      
      var hbsObject = {
          articles: doc

      }
      console.log(doc)
      res.render("index", hbsObject)
    }
  })

  // // Tell the browser that we finished scraping the text
  // res.send("Scrape Complete");
});



app.get("/saved", function(req, res){
    console.log('saved was hit!!!!')
    Article.find({"saved": true}).populate("note").
    exec(function(error, doc){
         if (error) {
        console.log(error);
      }
      else{
         var hbsObject = {
            articles: doc
        }
        console.log("doc " + doc);
       res.render("saved", hbsObject) 
      }
    })
  })

//When save button is clicked 
app.post("/save/:id",function(req,res){
  
  // var id = new mongoose.Types.ObjectId(req.params.id);

  Article.findOneAndUpdate({
    "_id": req.params.id
  },{
    $set: {"saved": true}, 

  },{ new: true }).exec(function(err, doc){
      if (err) {
        res.send(err);
     }
     else{

      var hbsObject = {
          articles: doc

      }
      console.log("worked")
      res.redirect("/saved")
      
      console.log(doc)

     }
  });

})

//to delete a note
app.delete("/delete/:id", function(req, res){
  // Article = Article.toObject();
  Article.remove({"_id": req.params.id})
  .exec(function(err,doc){
      if (err) {
            res.send(err);
          }
        else{
          console.log(doc)
          return res.redirect("/saved")
          }
        
  })
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {


  // TODO: Finish the route so it grabs all of the articles
  Article.find({}, function(error, doc){
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
      // Or send the doc to the browserz
      else {
        res.send(doc);
      }

    });
  // then responds with the article with the note included


});

//this route will show all of the notes in a given article
app.get("/:id", function(req, res) {
console.log(req.params.id)
 
  Article.findOne({
    "_id": req.params.id
  }).populate("note").exec(function(error, doc){
      if (error) {
        res.send(error);
      }
      // Or send the doc to the browser
      else {
          var hbsObject = {
            notes: doc
        }

        console.log('worked')
        console.log(doc);
        res.render("saved", hbsObject);
      }      
    })

 });



// Create a new note or replace an existing note
app.post("/saved/:id", function(req, res) {
console.log("working a little");
  var newNote = new Note(req.body);
  // console.log(newNote.title)

  newNote.save(function(error, doc){
     if (error) {
      res.send(error);
    }
      else{
        Article.findOneAndUpdate({"_id": req.params.id},
         {$push: {"note": doc._id} }, {new: true})
        .exec(function(err, newdoc){
            if (err) {
            res.send(err);
          }
          else{
            console.log(newNote)
            res.redirect("/saved")
          }
        })
      //   Note.find({"_id": req.params.id}).
      //   exec(function(err, newdoc){
      //       if (err) {
      //       res.send(err);
      //     }
      //     else{
      //       console.log("newdoc " + newdoc)
            
      //       var hbsObject = {
      //       notes: doc
      //       }
      //       res.render("/saved", hbsObject);
      //     }
      //   })
      // }

  }
});
})





// Listen on port 3000
app.listen(process.env.PORT || 3000, function() {
  console.log("App running on port 3000!");
});