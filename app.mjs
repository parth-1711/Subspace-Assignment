// const express = require("express");
import express from 'express';
import fetch from 'node-fetch';
import _ from 'lodash';
// var _ = require("lodash");

const app = express();

const options = {
  method: "GET",
  headers: {
    "x-hasura-admin-secret":
      "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
  },
};

//Function to Analyze The retreived data from fetch request
const Analyze = async () => {
  let response = await fetch(
    "https://intent-kit-16.hasura.app/api/rest/blogs",
    options
  );
  let data = await response.json();
  let blogsArr = data.blogs;

  let numBlogs = _.size(blogsArr);

  let uniqueBlogs = _.uniqBy(blogsArr, "title");
  
  let longestblog = {};
  let len = 0;
  let count = 0;
  _.forEach(blogsArr, (obj) => {
    if (len < obj.title.length) {
      longestblog = obj;
      len = obj.title.length;
    }
    if (obj.title.toLowerCase().includes("privacy")) count++;
  });
  return {
    number_of_blogs: numBlogs,
    Longest_Blog_title: longestblog.title,
    Number_of_blogs_containing_privacy_in_title: count,
    unique_Blogs: uniqueBlogs,
  };
};

//memoizing the the analysis function
const memoizedAnalysis=_.memoize(async () => await Analyze());

app.get('/',(req,res)=>{
  res.json({message:"Go to /api/blog-stats endpoint to get analysis OR go to /api/blog-search endpoint to search blogs through query parameters."})
})

//get route to get blog stats
app.get("/api/blog-stats", async (req, res) => {
  try {
    let returnObj = await memoizedAnalysis();

    res.send(returnObj);
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
});

//search results based on query arguments paassed which can be a substring of title or a title or complete id
const fetchResults = async (queryArgs) => {
  let response = await fetch(
    "https://intent-kit-16.hasura.app/api/rest/blogs",
    options
  );
  let data = await response.json();
  let blogsArr = data.blogs;
  let result = [];
  _.forEach(blogsArr, (element) => {
    if (
      element.title.toLowerCase().includes(queryArgs.toLowerCase()) ||
      element.id === queryArgs
    ) {
      result.push(element);
    }
  });

  const Unique_results = _.uniqWith(result,(obj1,obj2)=>{
    return obj1.title.toLowerCase()===obj2.title.toLowerCase()
  });

  return {
    result_Found: result,
    Unique_results,
  };
};

//momoized search function
const memoizedSearch = _.memoize(async (query) => await fetchResults(query));

//get route for searching blogs
app.get("/api/blog-search", async (req, res) => {
  let query = req.query.query;
  try {
    const searchResults=await memoizedSearch(query);
    res.send(searchResults);
  } catch (error) {
    res.send({ message: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is up and running on port 3000...");
});
