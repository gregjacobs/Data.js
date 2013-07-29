Data.js
=======

Data.js is a client-side data abstraction framework which provides Models and Collections (much like Backbone.js), but takes a more 
object oriented and structured approach. Some features include:

- **Structured models**: Models define the attributes they are going to be working with, both for documentation for developers, and
  to catch errors when getting/setting attributes that don't exist for the model (such as if the attribute name was typed incorrectly).
  This feature is similar to what Atlassian's Backbone.Brace plugin does for Backbone. [http://blogs.atlassian.com/2012/11/add-some-strength-to-your-backbone/](http://blogs.atlassian.com/2012/11/add-some-strength-to-your-backbone/) 

- **Data types and automatic conversions**: Developers should know what the type of attribute data they are working with inside their
  models, and the framework enforces this. If an attribute is defined as an integer type, and the string "1" is provided to it instead 
  by accident (such as from reading an attribute in an xml document), it is automatically converted to the number `1`. In this case, 
  `attr+1 == 2`, instead of an accidental `"11"`.

- **Persistence proxies**: Following an object oriented approach, different proxies may be configured on models for persisting model 
  data to and from a server or other persistent data store. This allows models to have different data sources. Instead of having one 
  function that is supposed to know about it all (`Backbone.sync`), models can be loaded and/or saved to a REST server, to a regular 
  AJAX endpoint, through JSONP, etc, and these can be mixed/matched depending on the model and its data source. The proxies are also
  extensible to allow other data sources, including local ones such as HTML5's localStorage.
  
- **Readers/Writers**: JSON and XML readers and writers are provided, to allow for converting to and from common data formats when 
  loading / persisting data with different services. These can also be configured and/or extended to allow for automatic data mapping 
  from a server side representation to the client side representation for seamless integration.
  
- **Nested Models/Collections**: Nested models and collections are available right out of the box using the appropriate Attribute type
  ("model" or "collection"), and are handled correctly. For instance, when retrieving the JavaScript object representation of a model
  or collection, the nested entity is also converted.

There are a few other features that are supported which solve issues in Backbone such as:

1. Giving a way to tell if a Model has changed since its last successful persistence operation. Also handles the case of if a Model
   has changed *during* a persistence operation (which correctly keeps track of the attributes that have been modified).
   
2. Allows for "patch" (or "incremental") updates to backend data. A Writer can be configured to only include the attributes that have 
   changed since the last persistence operation to the server, to optimize network traffic.

Even though this project is currently in use on a few production sites, it should still be considered alpha. More development and 1.0
release to come!

[Full API Docs](http://gregjacobs.github.com/Data.js/docs/)

