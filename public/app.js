// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $(".articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
  }
});

// Whenever someone clicks a p tag
$(document).on("click", "button", function(event) {
  // Empty the notes from the note section
  event.preventDefault();

  var id = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "POST",
    url: "/saveArticle/" + id,
  })
    // With that done, add the note information to the page
    .done(function(data) {
     	if(data === "Success"){
     		//Remove the div from the page
     	}
    });
});