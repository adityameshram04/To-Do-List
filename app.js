//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//for connecting to database locally
mongoose.connect("mongodb+srv://admin-aditya:Test123@cluster0.amq21.mongodb.net/todolistDB");

//for creating a new scheme: const schemaName = new Schema ({});
const itemsSchema = new mongoose.Schema({
  name: String
});

//for creating a mongoose model which acts as an interface between the database and javascript.
const Item = mongoose.model("Item", itemsSchema);

const task1 = new Item({
  name: "Welcome to your todo list!"
});

const task2 = new Item({
  name: "Hit the + button to add an item."
});

const task3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [task1, task2, task3];

// task1.save();

//creating a new schema for custom items list

const listSchema = new mongoose.Schema({
  name: String, //this will not be the items but the HEADING THAT GOES ON TOP OF THE LIST
  items: [itemsSchema] //embedding the itemschema into this listschema
});

//creating a model for this custom list
const List = mongoose.model("List", listSchema);







app.get("/", function(req, res) {

  //for querying through our database
  Item.find({}, function(err, foundItems){

    //we're doing this for inserting the default items for the first time only and not subsequent times.
    if(foundItems.length === 0){
      Item.insertMany([task1, task2, task3], function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("The first three default items are inserted successfully!");
        }
      });
      res.redirect("/");
    }

    else
    {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
       //Since we are using findOne it returns an object instead of a list when we use just "find"
       //Creating a new list
       const list = new List({
        name: customListName,
        items: [task1, task2, task3]
      });
      
      list.save();

      res.redirect("/" + customListName);

      }
      else{
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
    
  });
});


app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item ({
      name: itemName
    });

    if(listName === "Today"){
      item.save();
      res.redirect("/");
    }
    else{
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
    }

    
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }
      else{
        res.redirect("/");
        console.log("Checked item has been deleted!");
      }
    });
  }
    //here we are first finding the list and then updating it by deleteing what was checked
    else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
      });
    }

  });







app.get("/about", function(req, res){
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
