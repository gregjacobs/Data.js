/*global define */
/*jshint forin:true, eqnull:true */
define( [
	'require',
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/DataComponent',
	
	'data/persistence/Util',
	'data/persistence/proxy/Proxy',
	'data/persistence/operation/Load',
	'data/persistence/operation/Save',
	'data/persistence/operation/Destroy',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy',
	
	'data/attribute/Attribute',
	'data/attribute/DataComponent',
	'data/attribute/Collection',
	'data/attribute/Model',
	
	// All attribute types included so developers don't have to specify these when they declare attributes in their models.
	// These are not included in the arguments list though, as they are not needed specifically by the Model implementation.
	'data/attribute/Boolean',
	'data/attribute/Date',
	'data/attribute/Float',
	'data/attribute/Integer',
	'data/attribute/Mixed',
	'data/attribute/Model',
	'data/attribute/Number',
	'data/attribute/Object',
	'data/attribute/Primitive',
	'data/attribute/String',

	'data/NativeObjectConverter' // circular dependency, not included in args list
], function( 
	require,
	jQuery,
	_,
	Class,
	Data,
	DataComponent,
	
	PersistenceUtil,
	Proxy,
	LoadOperation,
	SaveOperation,
	DestroyOperation,
	CreateRequest,
	ReadRequest,
	UpdateRequest,
	DestroyRequest,
	
	Attribute,
	DataComponentAttribute,
	CollectionAttribute,
	ModelAttribute
) {
	
	/**
	 * @class data.Model
	 * @extends data.DataComponent
	 * 
	 * Generalized key/value data storage class, which has a number of data-related features, including the ability to persist 
	 * its data to a backend server.
	 * 
	 * Basically, a Model represents some object of data that your application uses. For example, in an online store, one might 
	 * define two Models: one for Users, and the other for Products. These would be `User` and `Product` models, respectively. Each 
	 * of these Models would in turn, have {@link data.attribute.Attribute Attributes} (data fields) that each Model is made up of. 
	 * Ex: A User model may have: `userId`, `firstName`, and `lastName` Attributes.
	 * 
	 * ## Defining a Model
	 * 
	 * An example `User` model, in User.js:
	 * 
	 *     define( [
	 *         'data/Model'
	 *     ], function( Model ) {
	 *     
	 *         var User = Model.extend( {
	 *             attributes : [
	 *                 { name: 'id',        type: 'int' },
	 *                 { name: 'firstName', type: 'string' },
	 *                 { name: 'lastName',  type: 'string' },
	 *                 { name: 'isAdmin',   type: 'boolean', defaultValue: false }
	 *             ]
	 *         } );
	 *     
	 *         return User;
	 *     
	 *     } );
	 * 
	 * As you can see, a Model is made up of attributes (data fields). Each may have a `type`, which is enforced to ensure data
	 * consistency. The basic types are:
	 * 
	 * - {@link data.attribute.Integer int/integer}: An integer value. Ex: 0, 1, 2, etc.
	 * - {@link data.attribute.Float float}: A floating point value. Ex: 1.1, 2.42, etc.
	 * - {@link data.attribute.String string}: A string value. Ex: "", "abc", etc.
	 * - {@link data.attribute.Boolean bool/boolean}: A Boolean true/false value.
	 * - {@link data.attribute.Object object}: An object value. Any object may be placed in this type (including arrays), but it 
	 *   is most often preferable that nested objects be either of the `model` or `collection` types.
	 * - {@link data.attribute.Date date}: A JavaScript Date object. String dates provided to this type will be parsed into a JS 
	 *   Date object.
	 * - {@link data.attribute.Model model}: A nested child Model, or related Model in a relational setup. Defaults to `null`.
	 *   An empty model may be initialized by setting the `defaultValue` to an empty object (`{}`).
	 * - {@link data.attribute.Collection collection}: A nested child Collection, or related Collected in a relational setup.
	 *   Defaults to `null`. An empty collection may be initialized by setting the `defaultValue` to an empty array (`[]`).
	 * 
	 * Each Attribute type is implemented as a class in the `data.attribute` package. See each particular Attribute subclass for
	 * additional configuration options that are available to that particular type. 
	 * 
	 * Note: if no `type` is specified, the default is the {@link data.attribute.Mixed mixed} type. This type is not recommended 
	 * however, since it provides no type checking, and conveys little meaning as to how to use the value for the attribute.
	 * 
	 * ### Default Values
	 * 
	 * A {@link data.attribute.Attribute#defaultValue defaultValue} may be provided to initialize the attribute upon Model 
	 * construction.
	 * 
	 * If no {@link data.attribute.Attribute#defaultValue defaultValue} is provided, then attributes are defaulted as follows:
	 * 
	 * - All primitive types (int, float, string, boolean) default to a valid value of the type. This is the value `0` for 
	 *   `int`/`float` types, an empty string ("") for the `string` type, and `false` for the `boolean` type. This is the case 
	 *   unless the {@link data.attribute.Primitive#useNull useNull} config is set to `true`, in which case the attribute will 
	 *   default to `null`.
	 * - All object types (object, date, model, collection, etc.) default to `null`.
	 * 
	 * ### Creating new Attribute types
	 * 
	 * Since each Attribute type is implemented as a class in the `data.attribute` package, new Attribute types may be added
	 * within your application by extending the appropriate base class and implementing/overriding the appropriate methods. See
	 * the source code of the {@link data.attribute.Attribute} types for examples on how to do this.
	 * 
	 * 
	 * ## Getting/Setting Attribute Values
	 * 
	 * Using our `User` model from above:
	 * 
	 *     require( [
	 *         'User'
	 *     ], function( User ) {
	 *     
	 *         // Create a new User
	 *         var user = new User( {
	 *             id        : 1,
	 *             firstName : "John",
	 *             lastName  : "Doe",
	 *             isAdmin   : true
	 *         } );
	 *         
	 *         // Retrieve some values about the user:
	 *         user.get( 'id' );         // 1
	 *         user.get( 'firstName' );  // "John"
	 *         user.get( 'lastName' );   // "Doe"
	 *         user.get( 'isAdmin' );    // true
	 *         
	 *         
	 *         // Set some values about the user:
	 *         user.set( 'firstName', "Johnny" );
	 *         user.set( 'lastName', "Depp" );
	 *         user.set( 'isAdmin', false );
	 *         
	 *         // Setting multiple values at once:
	 *         user.set( { firstName: "Johnny", lastName: "Depp", isAdmin: false } );
	 *         
	 *     } );
	 *     
	 * See methods {@link #set} and {@link #get} for more details.
	 * 
	 * 
	 * ## Using Models/Collections as Nested or Related Attributes
	 * 
	 * Models may hold nested models and collections, allowing for a hierarchical data structure. For example:
	 * 
	 *     // Address.js
	 *     define( [
	 *         'data/Model'
	 *     ], function( Model ) {
	 *         
	 *         var Address = Model.extend( {
	 *             attributes : [
	 *                 { name: 'street', type: 'string' },
	 *                 { name: 'city',   type: 'string' },
	 *                 { name: 'state',  type: 'string' },
	 *                 { name: 'zip',    type: 'int' }
	 *             ]
	 *         } );
	 *         
	 *         return Address;
	 *         
	 *     } );
	 *     
	 *     
	 *     // User.js
	 *     define( [
	 *         'data/Model',
	 *         
	 *         'Address'
	 *     ], function( Model, Address ) {
	 *     
	 *         var User = Model.extend( {
	 *             attributes : [
	 *                 { name: 'id',        type: 'int' },
	 *                 { name: 'firstName', type: 'string' },
	 *                 { name: 'lastName',  type: 'string' },
	 *                 
	 *                 { name: 'address',   type: 'model', model: Address }  // specify the Model type: Address
	 *             ]
	 *         } );
	 *     
	 *     } );
	 *     
	 *     
	 *     // Implementation
	 *     require( [
	 *         'User'
	 *     ], function( User ) {
	 *         
	 *         var user = new User( {
	 *             id: 1, 
	 *             firstName : "John",
	 *             lastName  : "Doe",
	 *             
	 *             address : {
	 *                 street : "123 Main Street",
	 *                 city   : "Anchorage",
	 *                 state  : "AK",
	 *                 zip    : 99501
	 *             }
	 *         } );
	 *         
	 *         
	 *         var address = user.get( 'address' );
	 *         address.get( 'street' );  // "123 Main Street"
	 *         address.get( 'city' );    // "Anchorage"
	 *         address.get( 'state' );   // "AK"
	 *         address.get( 'zip' );     // 99501
	 *     } );
	 * 
	 * 
	 * ### Nesting the Same Type of Model as an Attribute
	 * 
	 * The same type of model can be used for a parent/child relationship, but due to the nature of RequireJS and circular 
	 * dependencies, we need to use late binding for the nested model type. For example:
	 * 
	 *     define( [
	 *         'data/Model'
	 *     ], function( Model ) {
	 *     
	 *         var User = Model.extend( {
	 *             attributes : [
	 *                 { name: 'id',        type: 'int' },
	 *                 { name: 'firstName', type: 'string' },
	 *                 { name: 'lastName',  type: 'string' },
	 *                 
	 *                 {
	 *                     name: 'trainee',
	 *                     type: 'model',
	 *                     model: function() { return User; }  // when needed, the function will be executed to provide the Model type
	 *                 }
	 *             ]
	 *         } );
	 *     
	 *         return User;
	 *         
	 *     } );
	 *     
	 *     
	 * ### Nesting Other Types of Models/Collections that may have Circular Dependencies
	 * 
	 * See example in {@link data.attribute.Model} for the {@link data.attribute.Model#model model} config.
	 * 
	 * 
	 * ## Listening to Model Events
	 * 
	 * Events are fired when changes occur to the Model. See the 'Events' section of this documentation for a list of all
	 * available events, but as a simple example:
	 * 
	 *     require( [
	 *         'User'  // from above examples
	 *     ], function( Tasks ) {
	 *     
	 *         var user = new User( { id: 1, firstName: "John", lastName: "Doe" } );
	 *         
	 *         // Event listener #1:
	 *         user.on( 'change', function( model, attrName, newValue, oldValue ) {
	 *             console.log( "Model change: '" + attrName + "' from '" + oldValue + "' to '" + newValue + "'" ); 
	 *         } );
	 *         
	 *         // Event listener #2:
	 *         user.on( 'change:firstName', function( model, newValue, oldValue ) {
	 *             console.log( "Model firstName change from '" + oldValue + "' to '" + newValue + "'" );
	 *         } );
	 *         
	 *         
	 *         user.set( 'firstName', "Johnny" );
	 *             // console log from listener #1: "Model change: 'firstName' from 'John' to 'Johnny'
	 *             // console log from listener #2: "Model firstName change from 'John' to 'Johnny'
	 *         
	 *     } );
	 * 
	 * See {@link #on} for details.
	 */
	var Model = Class.extend( DataComponent, {
		
		inheritedStatics : {
			
			/**
			 * @private
			 * @inheritable
			 * @static
			 * @property {String} __Data_modelTypeId
			 * 
			 * A static property that is unique to each data.Model subclass, which uniquely identifies the subclass.
			 */
			
			
			// Subclass-specific setup
			/**
			 * @ignore
			 */
			onClassCreated : function( newModelClass ) {
				DataComponent.onClassCreated( newModelClass );  // call "superclass" method
				
				// Assign a unique id to this class, which is used in maps that hold the class
				newModelClass.__Data_modelTypeId = _.uniqueId();
				
				
				// Now handle initializing the Attributes, merging this subclass's attributes with the superclass's attributes
				var classPrototype = newModelClass.prototype,
				    superclassPrototype = newModelClass.superclass,
				    superclassAttributes = superclassPrototype.attributes || {},    // will be an Object (map) of attributeName -> Attribute instances
				    newAttributes = {},
				    attributeDefs = [],  // will be an array of Attribute configs (definitions) on the new subclass 
				    attributeObj,   // for holding each of the attributeDefs, one at a time
				    i, len;
				
				// Grab the 'attributes' property from the new subclass's prototype. If this is not present,
				// will use the empty array instead.
				if( classPrototype.hasOwnProperty( 'attributes' ) ) {
					attributeDefs = classPrototype.attributes;
				}
				
				// Instantiate each of the new subclass's Attributes, and then merge them with the superclass's attributes
				for( i = 0, len = attributeDefs.length; i < len; i++ ) {
					attributeObj = attributeDefs[ i ];
					
					// Normalize to a data.attribute.Attribute configuration object if it is a string
					if( typeof attributeObj === 'string' ) {
						attributeObj = { name: attributeObj };
					}
					
					// Create the actual Attribute instance
					var attribute = Attribute.create( attributeObj );
					newAttributes[ attribute.getName() ] = attribute;
				}
				
				newModelClass.prototype.attributes = _.defaults( _.clone( newAttributes ), superclassAttributes );  // newAttributes take precedence; superclassAttributes are used in the case that a newAttribute doesn't exist for a given attributeName
			},
			
			
			/**
			 * Retrieves the Attribute objects that are present for the Model, in an Object (map) where the keys
			 * are the Attribute names, and the values are the {@link data.attribute.Attribute} objects themselves.
			 * 
			 * @inheritable
			 * @static
			 * @return {Object} An Object (map) where the keys are the attribute {@link data.attribute.Attribute#name names},
			 *   and the values are the {@link data.attribute.Attribute Attribute} instances themselves.
			 */
			getAttributes : function() {
				// Note: `this` refers to the class (constructor function) that the static method was called on
				return this.prototype.attributes;
			}
			
		},
		
		
		/**
		 * @cfg {Number} version
		 * 
		 * The version number for the Model's {@link #cfg-attributes}. 
		 * 
		 * This may be used in conjunction with, for instance, a {@link data.persistence.proxy.WebStorage WebStorage} 
		 * Proxy, which stores the Model's data along with this version number. The version number can then be used to 
		 * perform a migration of old stored data into the format of a newer version of the Model by way of a migration
		 * method. See {@link data.persistence.proxy.WebStorage#migrate} for details.
		 */
		version : 1,
		
		/**
		 * @cfg {String[]/Object[]} attributes
		 * 
		 * Array of {@link data.attribute.Attribute Attribute} declarations. These are objects with any number of properties, but they
		 * must have the property 'name'. See the configuration options of {@link data.attribute.Attribute} for more information. 
		 * 
		 * Anonymous config objects defined here will become instantiated {@link data.attribute.Attribute} objects. An item in the array may also simply 
		 * be a string, which will specify the name of the {@link data.attribute.Attribute Attribute}, with no other {@link data.attribute.Attribute Attribute} 
		 * configuration options.
		 * 
		 * Attributes defined on the prototype of a Model, and its superclasses, are combined to become a single set of attributes come
		 * instantiation time. This means that the data.Model base class can define the 'id' attribute, and then subclasses
		 * can define their own attributes to append to it. So if a subclass defined the attributes `[ 'name', 'phone' ]`, then the
		 * final concatenated array of attributes for the subclass would be `[ 'id', 'name', 'phone' ]`. This works for however many
		 * levels of subclasses there are.
		 * 
		 * Example:
		 * 
		 *     attributes : [
		 *         'id',    // name-only; no other configs for this attribute (not recommended! should declare the {@link data.attribute.Attribute#type type})
		 *         { name: 'firstName', type: 'string' },
		 *         { name: 'lastName',  type: 'string' },
		 *         {
		 *             name : 'fullName',
		 *             get  : function( value ) {  // // in this example, the Attribute has no value of its own, so we ignore the arg
		 *                 return this.get( 'firstName' ) + ' ' + this.get( 'lastName' );  // `this` refers to the model that owns the Attribute
		 *             }
		 *         }
		 *     ]
		 * 
		 */
		
		/**
		 * @cfg {String} idAttribute
		 * The attribute that should be used as the ID for the Model. 
		 */
		idAttribute : 'id',
		
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the Model's data to/from persistent
		 * storage. If this is not specified, the Model may not {@link #method-load} or {@link #method-save} its data.
		 * 
		 * Note that this may be specified as part of a Model subclass (so that all instances of the Model inherit
		 * the proxy), or on a particular model instance using {@link #setProxy}.
		 */
		
		/**
		 * @cfg {Boolean} ignoreUnknownAttrsOnLoad
		 * 
		 * `true` to ignore any unknown attributes that come from an external data source (server, local storage, etc)
		 * when {@link #method-load loading} the Model. This defaults to `true` in case say, a web service adds additional
		 * properties to a response object, which would otherwise trigger an error for an unknown attribute when the data is
		 * set to the Model.
		 * 
		 * This may be useful to set to `false` for development purposes however, to make sure that your server or other
		 * persistent storage mechanism is providing all of the correct data, and that there are no mistyped property 
		 * names, spelling errors, or anything of that nature. One way to do this on a global level for development purposes
		 * is:
		 * 
		 *     require( [
		 *         'data/Model'
		 *     ], function( Model ) {
		 *         
		 *         // Check all attributes from external data sources when in "development" mode
		 *         Model.prototype.ignoreUnknownAttrsOnLoad = false;
		 *         
		 *     } );
		 */
		ignoreUnknownAttrsOnLoad : true,
		
		/**
		 * @private
		 * @property {Object} attributes
		 * 
		 * An Object map of the combined Attributes, which have been put together from the current Model subclass, and all of
		 * its superclasses.
		 */
		
		/**
		 * @private
		 * @property {Object} data
		 * 
		 * An Object (map) that holds the current data for the {@link data.attribute.Attribute Attributes}. The property names in this object match 
		 * the attribute names.  This map holds the current data as it is modified by {@link #set}.
		 */
		
		/**
		 * @private 
		 * @property {Object} modifiedData
		 * A map that serves two functions:
		 * 
		 * 1) Properties are set to it when an attribute is modified. The property name is the attribute {@link data.attribute.Attribute#name}. 
		 *    This allows it to be used to determine which attributes have been modified. 
		 * 2) The *original* (non-committed) data of the attribute (before it was {@link #set}) is stored as the value of the 
		 *    property. When rolling back changes (via {@link #method-rollback}), these values are copied back onto the {@link #data} object
		 *    to overwrite the data to be rolled back.
		 * 
		 * Went back and forth with naming this `originalData` and `modifiedData`, because it stores original data, but is used
		 * to determine which data is modified... 
		 */
		
		/**
		 * @private
		 * @property {Number} setCallCount
		 * 
		 * This variable supports the {@link #changeset} event, by keeping track of the number of calls to {@link #method-set}.
		 * When {@link #method-set} is called, this variable is incremented by 1. Just before {@link #method-set} returns, this variable is decremented
		 * by 1. If at the end of the {@link #method-set} method this variable reaches 0 again, the {@link #changeset} event is fired
		 * with all of the attribute changes since the first call to {@link #method-set}. This handles the recursive nature of the {@link #method-set} method,
		 * and the fact that {@link #method-set} may be called by Attribute {@link data.attribute.Attribute#cfg-set set} functions, and handlers of the
		 * {@link #change} event.
		 */
		setCallCount : 0,
		
		/**
		 * @private
		 * @property {Object} changeSetNewValues
		 * 
		 * An Object (map) which holds the changes to attributes for the {@link #changeset} event to fire with. This map collects the 
		 * changed values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
		 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
		 */
		
		/**
		 * @private
		 * @property {Object} changeSetOldValues
		 * 
		 * A map which holds the changes to attributes for the {@link #changeset} event to fire with. This map collects the 
		 * previous ("old") values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
		 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
		 */
		
		/**
		 * @private
		 * @property {String} id (readonly)
		 * The id for the Model. This property is set when the attribute specified by the {@link #idAttribute} config
		 * is {@link #set}. 
		 * 
		 * *** Note: This property is here solely to maintain compatibility with Backbone's Collection, and should
		 * not be accessed or used, as it will most likely be removed in the future.
		 */
		
		/**
		 * @protected
		 * @property {Boolean} loading
		 * 
		 * Flag that is set to `true` while the Model is loading.
		 */
		loading : false,
		
		/**
		 * @protected
		 * @property {Boolean} saving
		 * 
		 * Flag that is set to `true` while the Model is saving.
		 */
		saving : false,
		
		/**
		 * @protected
		 * @property {Boolean} destroying
		 * 
		 * Flag that is set to `true` while the Model is destroying.
		 */
		destroying : false,
		
		/**
		 * @protected
		 * @property {Boolean} destroyed
		 * 
		 * Flag that is set to true once the Model has been successfully destroyed.
		 */
		destroyed : false,
		
		
		
		/**
		 * Creates a new Model instance.
		 * 
		 * @constructor 
		 * @param {Object} [data] Any initial data for the {@link #cfg-attributes attributes}, specified in an Object (map). See {@link #set}.
		 *   If not passing any initial data, but want to pass the second argument (`options`), provide `null`.
		 * @param {Object} [options] Any options for Model construction/initialization. This may be an object with the following properties:
		 * @param {Boolean} [options.ignoreUnknownAttrs=false] Set to `true` if unknown attributes should be ignored in the data object provided
		 *   to the first argument of this method. This is useful if you have an object which contains many properties, but your model does not
		 *   define matching attributes for each one of them. This option is **not recommended**, as it bypasses the check which can help you 
		 *   determine that you have possibly typed an attribute name incorrectly, and it may then be difficult at the time when a bug arises 
		 *   because of it (especially in a large software system) to determine where the source of the problem was. This is also set by some 
		 *   internal constructor calls to create models, such as when loading data into a {@link data.Collection} (based on the 
		 *   {@link data.Collection#ignoreUnknownAttrsOnLoad} config).
		 */
		constructor : function( data, options ) {
			options = options || {};
			
			// Default the data to an empty object
			data = data || {};
			
			// Call superclass constructor
			this._super( arguments );
			
			
			this.addEvents(				
				/**
				 * Fires when a {@link data.attribute.Attribute} in the Model has changed its value.
				 * 
				 * This event has two forms:
				 * 
				 * 1. The form documented as this event, where the `attributeName` is provided, and
				 * 2. The form where a particular attribute name may be listened to directly. In this second form,
				 *    one may subscribe to the event by adding a colon and then the attribute name to the event name. 
				 *    For example, if you want to just respond to `title` attribute changes on a model, you could subscribe
				 *    to the `change:title` event. Ex:
				 *    
				 *        model.on( 'change:title', function( model, newValue, oldValue ) { ... } );
				 *        
				 *    In this second form, the `attributeName` argument is *not* provided, as you are only listening for 
				 *    changes on one particular attribute.
				 * 
				 * @event change
				 * @param {data.Model} model This Model instance.
				 * @param {String} attributeName The name of the attribute that was changed.
				 * @param {Mixed} newValue The new value, processed by the attribute's {@link data.attribute.Attribute#get get} function if one exists. 
				 * @param {Mixed} oldValue The old (previous) value, processed by the attribute's {@link data.attribute.Attribute#get get} function if one exists. 
				 */
				'change',
				
				/**
				 * Fires once at the end of one of more (i.e. a set) of Attribute changes to the model. Multiple changes may be made to the model in a "set" by
				 * providing the first argument to {@link #method-set} as an object, and/or may also result from having {@link data.attribute.Attribute#cfg-set Attribute set} 
				 * functions which modify other Attributes. Or, one final way that changes may be counted in a "set" is if handlers of the {@link #change} event end up
				 * setting Attributes on the Model as well.
				 * 
				 * Note: This event isn't quite production-ready, as it doesn't take into account changes from nested {@Link data.DataComponent DataComponents}
				 * ({@link data.Model Models} and {@link data.Collection Collections}), but can be used for a set of flat changes in the Model.
				 * 
				 * @event changeset
				 * @param {data.Model} model This Model instance.
				 * @param {Object} newValues An Object (map) of the new values of the Attributes that changed. The object's keys (property names) are the
				 *   {@link data.attribute.Attribute#name Attribute names}, and the object's values are the new values for those Attributes.
				 * @param {Object} oldValues An Object (map) of the old values of the Attributes that changed. The object's keys (property names) are the
				 *   {@link data.attribute.Attribute#name Attribute names}, and the object's values are the old values that were held for those Attributes.
				 */
				'changeset',
				
				/**
				 * Fires when the data in the model is {@link #method-commit committed}. This happens if the
				 * {@link #method-commit commit} method is called, and after a successful {@link #method-save}.
				 * 
				 * @event commit
				 * @param {data.Model} model This Model instance.
				 */
				'commit',
				
				/**
				 * Fires when the data in the model is {@link #method-rollback rolled back}. This happens when the
				 * {@link #method-rollback rollback} method is called.
				 * 
				 * @event rollback
				 * @param {data.Model} model This Model instance.
				 */
				'rollback',
				
				/**
				 * Fires when the Model begins a {@link #method-load} request, through its {@link #proxy}. The 
				 * {@link #event-load} event will fire when the load is complete.
				 * 
				 * @event loadbegin
				 * @param {data.Model} This Model instance.
				 */
				'loadbegin',
				
				/**
				 * Fires when the Model is {@link #method-load loaded} from its external data store (such as a web server), 
				 * through its {@link #proxy}. This is a catch-all event for "load completion".
				 * 
				 * This event fires for all three of successful, failed, and aborted "load" requests. Success/failure/cancellation
				 * of the load request may be determined using the `operation`'s {@link data.persistence.operation.Operation#wasSuccessful wasSuccessful},
				 * {@link data.persistence.operation.Operation#hasErrored hasErrored}, or 
				 * {@link data.persistence.operation.Operation#wasAborted wasAborted} methods.
				 * 
				 * @event load
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Load} operation The LoadOperation object that represents the load.
				 */
				'load',
				
				/**
				 * Fires when an active LoadOperation has made progress. This is fired when an individual request has 
				 * completed, or when the {@link #proxy} reports progress otherwise.
				 * 
				 * @event loadprogress
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Load} operation The LoadOperation which has made progress.
				 */
				'loadprogress',
				
				/**
				 * Fires when the Model has successfully loaded data from its {@link #method-load} method.
				 * 
				 * @event loadsuccess
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Load} operation The LoadOperation which was successful.
				 */
				'loadsuccess',
				
				/**
				 * Fires when the Model has failed to load data from its {@link #method-load} method.
				 * 
				 * @event loaderror
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Load} operation The LoadOperation which has errored.
				 */
				'loaderror',
				
				/**
				 * Fires when the Model's {@link data.persistence.operation.Load LoadOperation} has been canceled 
				 * by client code while it is still {@link #method-load loading}.
				 * 
				 * @event loadcancel
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Load} operation The LoadOperation which was aborted (canceled).
				 */
				'loadcancel',
				
				/**
				 * Fires when the Model begins a {@link #method-save} request, through its {@link #proxy}. The 
				 * {@link #event-save} event will fire when the save is complete.
				 * 
				 * @event savebegin
				 * @param {data.Model} This Model instance.
				 */
				'savebegin',
				
				/**
				 * Fires when the active SaveOperation has made progress. This is fired when an individual request has 
				 * completed, or when the {@link #proxy} reports progress otherwise.
				 * 
				 * @event saveprogress
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Save} operation The SaveOperation which has made progress.
				 */
				'saveprogress',
				
				/**
				 * Fires when the Model is {@link #method-save saved} to its external data store (such as a web server),
				 * through its {@link #proxy}.
				 * 
				 * This event fires for all three of successful, failed, and aborted "save" requests. Success/failure/cancellation
				 * of the destroy request may be determined using the `operation`'s {@link data.persistence.operation.Operation#wasSuccessful wasSuccessful},
				 * {@link data.persistence.operation.Operation#hasErrored hasErrored}, or 
				 * {@link data.persistence.operation.Operation#wasAborted wasAborted} methods.
				 * 
				 * @event save
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Save} operation The SaveOperation object that represents the save.
				 */
				'save',
				
				/**
				 * Fires when the Model has been successfully {@link #method-save saved} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * @event savesuccess
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Save} operation The SaveOperation which was successful.
				 */
				'savesuccess',
				
				/**
				 * Fires when the Model has been failed to be {@link #method-save saved} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * @event saveerror
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Save} operation The SaveOperation which has errored.
				 */
				'saveerror',
				
				/**
				 * Fires when the {@link #method-save saving} of the Model has been aborted (canceled).
				 * 
				 * Note: when aborting a "save" operation, it is possible that the request still made it through and data was 
				 * updated on it on its external data store (such as a web server). This may cause an inconsistency between
				 * the state of the model on the client-side, and the state of the model on the server-side. Therefore, it is
				 * not recommended that the "save" operation be canceled, unless it is going to be attempted again, or the
				 * page is going to be refreshed.
				 * 
				 * @event savecancel
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Save} operation The SaveOperation which was aborted (canceled).
				 */
				'savecancel',
				
				/**
				 * Fires when the Model begins a {@link #method-destroy} request, through its {@link #proxy}. The 
				 * {@link #event-destroy} event will fire when the destroy is complete.
				 * 
				 * @event destroybegin
				 * @param {data.Model} This Model instance.
				 */
				'destroybegin',
				
				/**
				 * Fires when the active DestroyOperation has made progress. This is fired when an individual request has 
				 * completed, or when the {@link #proxy} reports progress otherwise.
				 * 
				 * @event destroyprogress
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Destroy} operation The DestroyOperation which has made progress.
				 */
				'destroyprogress',
				
				/**
				 * Fires when the Model has been {@link #method-destroy destroyed} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * This event fires for all three of successful, failed, and aborted "destroy" requests. Success/failure/cancellation
				 * of the destroy request may be determined using the `operation`'s {@link data.persistence.operation.Operation#wasSuccessful wasSuccessful},
				 * {@link data.persistence.operation.Operation#hasErrored hasErrored}, or 
				 * {@link data.persistence.operation.Operation#wasAborted wasAborted} methods.
				 * 
				 * @event destroy
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Destroy} operation The DestroyOperation object that represents the destroy.
				 */
				'destroy',
				
				/**
				 * Fires when the Model has been successfully {@link #method-destroy destroyed} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * @event destroysuccess
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Destroy} operation The DestroyOperation which was successful.
				 */
				'destroysuccess',
				
				/**
				 * Fires when the Model has been failed to be {@link #method-destroy destroyed} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * @event destroyerror
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Destroy} operation The DestroyOperation which has errored.
				 */
				'destroyerror',
				
				/**
				 * Fires when the {@link #method-destroy destruction} of the Model has been aborted (canceled).
				 * 
				 * Note: when aborting a "destroy" operation, it is possible that the request still made it through and was 
				 * destroyed on it on its external data store (such as a web server). This may cause an inconsistency between
				 * the state of the model on the client-side, and the state of the model on the server-side. Therefore, it is
				 * not recommended that the "destroy" operation be canceled, unless it is going to be attempted again, or the
				 * page is going to be refreshed.
				 * 
				 * @event destroycancel
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Destroy} operation The DestroyOperation which was aborted (canceled).
				 */
				'destroycancel'
			);
			
			
			// Set the default values for attributes that don't have an initial value.
			var attributes = this.attributes,  // this.attributes is a map of the Attribute objects, keyed by their name
			    attributeDefaultValue;
			for( var name in attributes ) {
				if( data[ name ] === undefined && ( attributeDefaultValue = attributes[ name ].getDefaultValue() ) !== undefined ) {
					data[ name ] = attributeDefaultValue;
				}
			}
			
			// Initialize the underlying data object, which stores all attribute values
			this.data = {};
			
			// Initialize the data map for storing attribute names of modified data, and their original values (see property description)
			this.modifiedData = {};
			
			// Set the initial data / defaults, if we have any
			this.set( data, { ignoreUnknownAttrs: options.ignoreUnknownAttrs } );
			this.commit();  // and because we are initializing, the data is not considered modified
			
			// Call hook method for subclasses
			this.initialize();
		},
		
		
		/**
		 * Hook method for subclasses to initialize themselves. This method should be overridden in subclasses to 
		 * provide any model-specific initialization.
		 * 
		 * Note that it is good practice to always call the superclass `initialize` method from within yours (even if
		 * your class simply extends data.Model, which has no `initialize` implementation itself). This is to future proof it
		 * from being moved under another superclass, or if there is ever an implementation made in this class.
		 * 
		 * Ex:
		 * 
		 *     MyModel = Model.extend( {
		 *         initialize : function() {
		 *             MyModel.superclass.initialize.apply( this, arguments );   // or could be MyModel.__super__.initialize.apply( this, arguments );
		 *             
		 *             // my initialization logic goes here
		 *         }
		 *     }
		 * 
		 * @protected
		 * @method initialize
		 */
		initialize : Data.emptyFn,
		
		
		/**
		 * Retrieves the Attribute objects that are present for the Model, in an Object (map) where the keys
		 * are the Attribute names, and the values are the {@link data.attribute.Attribute} objects themselves.
		 * 
		 * @return {Object} An Object (map) where the keys are the attribute {@link data.attribute.Attribute#name names},
		 *   and the values are the {@link data.attribute.Attribute Attribute} instances themselves.
		 */
		getAttributes : function() {
			return this.attributes;
		},
		
		
		// --------------------------------
		
		
		/**
		 * Retrieves the Model's {@link #version}.
		 * 
		 * @return {Number}
		 */
		getVersion : function() {
			return this.version;
		},
		
		
		/**
		 * Retrieves the ID for the Model. This uses the configured {@link #idAttribute} to retrieve
		 * the correct ID attribute for the Model.
		 * 
		 * @return {Mixed} The ID for the Model.
		 */
		getId : function() {
			// Provide a friendlier error message than what get() provides if the idAttribute is not an Attribute of the Model
			if( !( this.idAttribute in this.attributes ) ) {
				throw new Error( "Error: The `idAttribute` (currently set to an attribute named '" + this.idAttribute + "') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it." );
			}
			return this.get( this.idAttribute );
		},
		
		
		/**
		 * Retrieves the "ID attribute" for the Model, if there is a valid id attribute. The Model has a valid ID attribute if there exists
		 * an attribute which is referenced by the {@link #idAttribute} config. Otherwise, returns null.
		 * 
		 * @return {data.attribute.Attribute} The Attribute that represents the ID attribute, or null if there is no valid ID attribute.
		 */
		getIdAttribute : function() {
			return this.attributes[ this.idAttribute ] || null;
		},
		
		
		/**
		 * Retrieves the name of the "ID attribute" for the Model. This will be the attribute referenced by the {@link #idAttribute}
		 * config.
		 * 
		 * @return {String} The name of the "ID attribute".
		 */
		getIdAttributeName : function() {
			return this.idAttribute;
		},
		
		
		/**
		 * Determines if the Model has a valid {@link #idAttribute}. Will return true if there is an {@link #cfg-attributes attribute}
		 * that is referenced by the {@link #idAttribute}, or false otherwise.
		 * 
		 * @return {Boolean}
		 */
		hasIdAttribute : function() {
			return !!this.attributes[ this.idAttribute ];
		},
	
		
		// --------------------------------
		
		
		/**
		 * Sets the value for a {@link data.attribute.Attribute Attribute} given its `name`, and a `value`. For example, a call could be made as this:
		 * 
		 *     model.set( 'attribute1', 'value1' );
		 * 
		 * As an alternative form, multiple valuse can be set at once by passing an Object into the first argument of this method. Ex:
		 * 
		 *     model.set( { key1: 'value1', key2: 'value2' } );
		 * 
		 * Note that in this form, the method will ignore any property in the Object (map) that don't have associated Attributes.
		 * 
		 * When attributes are set, their {@link data.attribute.Attribute#cfg-set} method is run, if they have one defined.
		 * 
		 * @param {String/Object} attributeName The attribute name for the Attribute to set, or an Object (map) of name/value pairs.
		 * @param {Mixed} [newValue] The value to set to the attribute. Required if the `attributeName` argument is a string (i.e. not a map).
		 * @param {Object} [options] Any options to pass to the method. This should be the second argument if providing an Object to the 
		 *   first parameter. This should be an object which may contain the following properties:
		 * @param {Boolean} [options.ignoreUnknownAttrs=false] Set to `true` if unknown attributes should be ignored in the data object provided
		 *   to the first argument of this method. This is useful if you have an object which contains many properties, but your model does not
		 *   define matching attributes for each one of them. This option is **not recommended**, as it bypasses the check which can help you 
		 *   determine that you have possibly typed an attribute name incorrectly, and it may then be difficult at the time when a bug arises 
		 *   because of it (especially in a large software system) to determine where the source of the problem was.
		 */
		set : function( attributeName, newValue, options ) {
			// If coming into the set() method for the first time (non-recursively, not from an attribute setter, not from a 'change' handler, etc),
			// reset the maps which will hold the newValues and oldValues that will be provided to the 'changeset' event. These will be used by the
			// `doSet()` method.
			if( this.setCallCount === 0 ) {
				this.changeSetNewValues = {};
				this.changeSetOldValues = {};
			}
			
			// Increment the setCallCount, for use with the 'changeset' event. The 'changeset' event only fires when all calls to set() have exited.
			this.setCallCount++;
			
			var changeSetNewValues = this.changeSetNewValues,
			    changeSetOldValues = this.changeSetOldValues;
			
			if( typeof attributeName === 'string' ) {
				options = options || {};
				this.doSet( attributeName, newValue, options, changeSetNewValues, changeSetOldValues );
				
			} else {  // Object (map) provided as first arg
				options = newValue || {};    // 2nd arg is the `options` object with this form
				var values = attributeName,  // for clarity
				    attributes = this.attributes,
				    attrsWithSetters = [];
				
				for( attributeName in values ) {
					if( values.hasOwnProperty( attributeName ) ) {
						var attribute = attributes[ attributeName ];
						
						if( !attribute ) {  // no matching attribute for the current attributeName (property name) in the data object
							if( options.ignoreUnknownAttrs )
								continue;
							
							// <debug>
							throw new Error( "data.Model.set(): An attribute with the attributeName '" + attributeName + "' was not found." );
							// </debug>
						}
						
						if( attribute.hasUserDefinedSetter() ) {   // defer setting the values on attributes with user-defined setters until all attributes without user-defined setters have been set
							attrsWithSetters.push( attributeName );
						} else {
							this.doSet( attributeName, values[ attributeName ], options, changeSetNewValues, changeSetOldValues );
						}
					}
				}
				
				// Handle any attributes that have a setter (i.e. a `set` config) after the ones that don't have setters
				for( var i = 0, len = attrsWithSetters.length; i < len; i++ ) {
					attributeName = attrsWithSetters[ i ];
					this.doSet( attributeName, values[ attributeName ], options, changeSetNewValues, changeSetOldValues );
				}
			}
			
			// Handle firing the 'changeset' event, which fires once for all of the attribute changes to the Model (i.e. when all calls to set() have exited)
			this.setCallCount--;
			if( this.setCallCount === 0 ) {
				this.fireEvent( 'changeset', this, changeSetNewValues, changeSetOldValues );
			}
		},
		
		
		/**
		 * Called internally by the {@link #set} method, this method performs the actual setting of an attribute's value.
		 * 
		 * @protected
		 * @param {String} attributeName The attribute name for the Attribute to set.
		 * @param {Mixed} newValue The value to set to the attribute.
		 * @param {Object} options The `options` object provided to {@link #set}. See {@link #set} for details.
		 * @param {Object} changeSetNewValues A reference to the collector map which holds the current changeset's new values. This is
		 *   an "output" parameter, and is modified by this method by storing the new value for a given attribute name.
		 * @param {Object} changeSetOldValues A reference to the collector map which holds the current changeset's old values. This is
		 *   an "output" parameter, and is modified by this method by storing the old value for a given attribute name.
		 */
		doSet : function( attributeName, newValue, options, changeSetNewValues, changeSetOldValues ) {
			var attribute = this.attributes[ attributeName ],
			    modelData = this.data,
			    modelModifiedData = this.modifiedData;
			
			if( !attribute ) {
				if( options.ignoreUnknownAttrs ) return;  // simply return; nothing to do
				
				// <debug>
				throw new Error( "data.Model.set(): An attribute with the attributeName '" + attributeName + "' was not found." );
				// </debug>
			}
			
			// Get the current (old) value of the attribute, and its current "getter" value (to provide to the 'change' event as the oldValue)
			var oldValue = modelData[ attributeName ],
			    oldGetterValue = this.get( attributeName );
			
			// Call the Attribute's set() method (or user-provided 'set' config function) to do any implemented conversion
			newValue = attribute.set( this, newValue, oldValue );
			
			// ----------------------------------------------------------------------------------------------------------------------------
			// *** Temporary workaround to get the 'change' event to fire on an Attribute whose set() config function does not
			// return a new value to set to the underlying data. This will be resolved once dependencies are 
			// automatically resolved in the Attribute's get() function.
			if( attribute.hasUserDefinedSetter() && newValue === undefined ) {  // the attribute will only have a 'set' property of its own if the 'set' config was provided
				// This is to make the following block below think that there is already data in for the attribute, and
				// that it has the same value. If we don't have this, the change event will fire twice, the
				// the model will be considered modified, and the old value will be put into the `modifiedData` map.
				if( !modelData.hasOwnProperty( attributeName ) ) {
					modelData[ attributeName ] = undefined;
				}
				
				// Fire the events with the value of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// Store the 'change' in the 'changeset' maps
				changeSetNewValues[ attributeName ] = newValue;
				if( !changeSetOldValues.hasOwnProperty( attributeName ) ) {  // only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple sets occur for an attribute during the changeset.
					changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// Now manually fire the events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
			// ----------------------------------------------------------------------------------------------------------------------------
			
			// Allow the Attribute to post-process the newValue (the value returned from the Attribute's set() function)
			newValue = attribute.afterSet( this, newValue );
			
			// Only change the underlying data if there is no current value for the attribute, or if newValue is different from the current
			if( !modelData.hasOwnProperty( attributeName ) || !attribute.valuesAreEqual( oldValue, newValue ) ) {   // let the Attribute itself determine if two values of its datatype are equal
				// Store the attribute's *current* value (not the newValue) into the "modifiedData" attributes map.
				// This should only happen the first time the attribute is set, so that the attribute can be rolled back even if there are multiple
				// set() calls to change it.
				if( !modelModifiedData.hasOwnProperty( attributeName ) ) {
					modelModifiedData[ attributeName ] = oldValue;
				}
				modelData[ attributeName ] = newValue;
				
				
				// Now that we have set the new raw value to the internal `data` map, we want to fire the events with the value
				// of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// Store the 'change' values in the changeset maps, for use when the 'changeset' event fires (from set() method)
				changeSetNewValues[ attributeName ] = newValue;
				if( !changeSetOldValues.hasOwnProperty( attributeName ) ) {  // Only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple set()'s occur for an attribute during the changeset.
					changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// And finally, fire the 'change' events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
		},
		
		
		/**
		 * Retrieves the value for the attribute given by `attributeName`. If the {@link data.attribute.Attribute Attribute} has a
		 * {@link data.attribute.Attribute#get get} function defined, that function will be called, and its return value
		 * will be used as the return of this method.
		 * 
		 * @param {String} attributeName The name of the Attribute whose value to retieve.
		 * @return {Mixed} The value of the attribute returned by the Attribute's {@link data.attribute.Attribute#get get} function (if
		 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link data.attribute.Attribute#get get}
		 * function, and the value has never been set.  
		 */
		get : function( attributeName ) {
			// <debug>
			if( !( attributeName in this.attributes ) ) {
				throw new Error( "data.Model::get() error: attribute '" + attributeName + "' was not found on the Model." );
			}
			// </debug>
			
			var value = this.data[ attributeName ],
			    attribute = this.attributes[ attributeName ];
			
			// If there is a `get` function on the Attribute, run it now to convert the value before it is returned.
			if( typeof attribute.get === 'function' ) {
				value = attribute.get( this, value );  // provide the underlying value
			}
			
			return value;
		},
		
		
		/**
		 * Retrieves the *raw* value for the attribute given by `attributeName`. If the {@link data.attribute.Attribute Attributes} has a
		 * {@link data.attribute.Attribute#raw raw} function defined, that function will be called, and its return value will be used
		 * by the return of this method. If not, the underlying data that is currently stored will be returned, bypassing any
		 * {@link data.attribute.Attribute#get get} function defined on the {@link data.attribute.Attribute Attribute}.
		 * 
		 * @param {String} attributeName The name of the Attribute whose raw value to retieve.
		 * @return {Mixed} The value of the attribute returned by the Attribute's {@link data.attribute.Attribute#raw raw} function (if
		 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link data.attribute.Attribute#raw raw}
		 * function, and the value has never been set.
		 */
		raw : function( attributeName ) {
			// <debug>
			if( !this.attributes.hasOwnProperty( attributeName ) ) {
				throw new Error( "data.Model::raw() error: attribute '" + attributeName + "' was not found on the Model." );
			}
			// </debug>
			
			var value = this.data[ attributeName ],
			    attribute = this.attributes[ attributeName ];
			
			// If there is a `raw` function on the Attribute, run it now to convert the value before it is returned.
			if( typeof attribute.raw === 'function' ) {
				value = attribute.raw( this, value );  // provide the underlying value
			}
			
			return value;
		},
		
		
		/**
		 * Returns the default value specified for an Attribute.
		 * 
		 * @param {String} attributeName The attribute name to retrieve the default value for.
		 * @return {Mixed} The default value for the attribute.
		 */
		getDefault : function( attributeName ) {
			return this.attributes[ attributeName ].getDefaultValue();
		},
		
		
		/**
		 * Determines if the Model has a given attribute (attribute).
		 * 
		 * @param {String} attributeName The name of the attribute (attribute) name to test for.
		 * @return {Boolean} True if the Model has the given attribute name.
		 */
		has : function( attributeName ) {
			return !!this.attributes[ attributeName ];
		},	
		
		
		// --------------------------------
		
		
		/**
		 * Determines if the Model is a new model, and has not yet been persisted to the server.
		 * It is a new Model if it lacks an id.
		 * 
		 * @return {Boolean} True if the model is new, false otherwise.
		 */
		isNew : function() {
			if( !this.hasIdAttribute() ) {
				return true;
			} else {
				return !this.getId();  // Any falsy value makes the model be considered "new". This includes null, 0, and ""
			}
		},
		
		
		/**
		 * Determines if any attribute(s) in the model are modified, or if a given attribute has been modified, since the last 
		 * {@link #method-commit} or {@link #method-rollback}.
		 * 
		 * @override
		 * @param {String} [attributeName] Provide this argument to test if a particular attribute has been modified. If this is not 
		 *   provided, the model itself will be checked to see if there are any modified attributes. 
		 * 
		 * @param {Object} [options] An Object (map) of options to change the behavior of this method. This may be provided as the first argument to the
		 *   method if no `attributeName` is to be provided. Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link data.attribute.Attribute#persist persisted} 
		 *   attribute is modified. 
		 * 
		 * @return {Boolean} True if the attribute has been modified, false otherwise.
		 */
		isModified : function( attributeName, options ) {
			if( typeof attributeName === 'object' ) {  // 'options' provided as first argument, fix the parameter variables
				options = attributeName;
				attributeName = undefined;
			}
			
			options = options || {};
			
			var attributes = this.attributes,
			    data = this.data,
			    modifiedData = this.modifiedData;
			
			if( !attributeName ) {
				// First, check if there are any modifications to primitives (i.e. non-nested Models/Collections).
				// If the 'persistedOnly' option is true, we only consider attributes that are persisted.
				for( var attr in modifiedData ) {
					if( modifiedData.hasOwnProperty( attr ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attr ].isPersisted() ) ) ) {
						return true;  // there is any property in the modifiedData map, return true (unless 'persistedOnly' option is set, in which case we only consider persisted attributes)
					}
				}
				
				// No local modifications to primitives, check all embedded collections/models to see if they have changes
				var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
				    dataComponent;
				
				for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
					var attrName = embeddedDataComponentAttrs[ i ].getName();
					
					if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
						return true;
					}
				}
				return false;
				
			} else {
				// Handle an attributeName being provided to this method
				var attribute = attributes[ attributeName ];
				
				if( attribute instanceof DataComponentAttribute && attribute.isEmbedded() && data[ attributeName ].isModified( options ) ) {   // DataComponent (Model or Collection) attribute is modified
					return true;
				} else if( modifiedData.hasOwnProperty( attributeName ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attributeName ].isPersisted() ) ) ) {  // primitive (non Model or Collection) attribute is modified
					return true;
				}
				
				return false;
			}
		},
		
		
		/**
		 * Retrieves the values for all of the attributes in the Model. The Model attributes are retrieved via the {@link #get} method,
		 * to pre-process the data before it is returned in the final Object (map), unless the `raw` option is set to true,
		 * in which case the Model attributes are retrieved via {@link #raw}. 
		 * 
		 * @override
		 * 
		 * @param {Object} [options] An Object (map) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} An Object (map) of the data, where the property names are the keys, and the values are the {@link data.attribute.Attribute Attribute} values.
		 */
		getData : function( options ) {
			return require( 'data/NativeObjectConverter' ).convert( this, options );
		},
		
		
		/**
		 * Retrieves the values for all of the {@link data.attribute.Attribute attributes} in the Model whose values have been changed since
		 * the last {@link #method-commit} or {@link #method-rollback}. 
		 * 
		 * The Model attributes are retrieved via the {@link #get} method, to pre-process the data before it is returned in the final Object (map), 
		 * unless the `raw` option is set to true, in which case the Model attributes are retrieved via {@link #raw}.
		 * 
		 * 
		 * @param {Object} [options] An Object (map) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details. Options specific to this method include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return only changed attributes that are 
		 *   {@link data.attribute.Attribute#persist persisted}. In the case of nested models, a nested model will only be returned in the resulting
		 *   map if one if its {@link data.attribute.Attribute#persist persisted} attributes are modified. 
		 * 
		 * @return {Object} A map of the attributes that have been changed since the last {@link #method-commit} or {@link #method-rollback}.
		 *   The map's property names are the attribute names, and the map's values are the new values.
		 */
		getChanges : function( options ) {
			options = options || {};
			
			// Provide specific attribute names to the NativeObjectConverter's convert() method, which are only the
			// names for attributes which hold native JS objects that have changed (not embedded models/arrays)
			options.attributeNames = _.keys( this.modifiedData );
			
			// Add any modified embedded model/collection to the options.attributeNames array
			var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
			    data = this.data,
			    dataComponent,
			    collection,
			    attrName,
			    i, len;
		
			for( i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
				attrName = embeddedDataComponentAttrs[ i ].getName();
				
				if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
					options.attributeNames.push( attrName );
				}
			}
			
			// Add any shallow-modified 'related' (i.e. non-embedded) collections to the options.attributeNames array
			var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
			for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
				attrName = relatedCollectionAttrs[ i ].getName();
				
				if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
					options.attributeNames.push( attrName );
				}
			}
			
			return require( 'data/NativeObjectConverter' ).convert( this, options );
		},
		
		
		/**
		 * Commits modified attributes' data. Data can no longer be reverted after a commit has been performed. Note: When developing with a {@link #proxy},
		 * this method should normally not need to be called explicitly, as it will be called upon the successful persistence of the Model's data
		 * to the server.
		 * 
		 * @override
		 */
		commit : function() {
			this.modifiedData = {};  // reset the modifiedData map. There is no modified data.
			
			// Go through all embedded models/collections, and "commit" those as well
			var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
			    data = this.data,
			    attrName,
			    dataComponent,
			    collection;
			
			for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
				attrName = embeddedDataComponentAttrs[ i ].getName();
				
				if( ( dataComponent = data[ attrName ] ) ) {
					dataComponent.commit();
				}
			}
			
			// Shallowly commit any 'related' (i.e. non-embedded) collections
			var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
			for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
				attrName = relatedCollectionAttrs[ i ].getName();
				
				if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
					collection.commit( { shallow: true } );
				}
			}
			
			this.fireEvent( 'commit', this );
		},
		
		
		/**
		 * Rolls back the Model attributes that have been changed since the last commit or rollback.
		 * 
		 * @override
		 */
		rollback : function() {
			// Loop through the modifiedData map, which holds the *original* values, and set them back to the data map.
			var modifiedData = this.modifiedData;
			for( var attributeName in modifiedData ) {
				if( modifiedData.hasOwnProperty( attributeName ) ) {
					this.data[ attributeName ] = modifiedData[ attributeName ];
				}
			}
			
			this.modifiedData = {};
			
			this.fireEvent( 'rollback', this );
		},
		
		
		// --------------------------------
		
		
		/**
		 * Creates a clone of the Model, by copying its instance data. Note that the cloned model will *not* have a value
		 * for its {@link #idAttribute} (as it is a new model, and multiple models of the same type cannot exist with
		 * the same id). You may optionally provide a new id for the clone with the `id` parameter. 
		 * 
		 * Note: This is a very early, alpha version of the method, where the final version will most likely
		 * account for embedded models, while copying embedded models and other such nested data. Will also handle 
		 * circular dependencies. I don't recommend using it just yet.
		 * 
		 * @param {Mixed} [id] A new id for the Model. Defaults to undefined.
		 * @return {data.Model} The new Model instance, which is a clone of the Model this method was called on.
		 */
		clone : function( id ) {
			var data = _.cloneDeep( this.getData() );
			
			// Remove the id, so that it becomes a new model. If this is kept here, a reference to this exact
			// model will be returned instead of a new one, as the framework does not allow duplicate models with
			// the same id. Otherwise, if a new id is passed, it will be set to the new model.
			if( typeof id === 'undefined' ) {
				delete data[ this.idAttribute ];
			} else {
				data[ this.idAttribute ] = id;
			}
			
			return new this.constructor( data );
		},
		
		
		// --------------------------------
		
		// Persistence Functionality
		
		
		/**
		 * Determines if the Model is currently {@link #loading}, via its {@link #proxy}.
		 * 
		 * @return {Boolean} `true` if the Model is currently loading a set of data, `false` otherwise.
		 */
		isLoading : function() {
			return this.loading;
		},
		
		
		/**
		 * Determines if the Model is currently {@link #method-save saving} its data, via its {@link #proxy}
		 * 
		 * @return {Boolean} `true` if the Model is currently saving its set of data, `false` otherwise.
		 */
		isSaving : function() {
			return this.saving;
		},
		
		
		/**
		 * Determines if the Model is currently {@link #method-destroy destroying} itself, via its {@link #proxy}.
		 * 
		 * @return {Boolean} `true` if the Model is currently saving its set of data, `false` otherwise.
		 */
		isDestroying : function() {
			return this.destroying;
		},
		
		
		/**
		 * Determines if the Model has been {@link #method-destroy destroyed}.
		 * 
		 * @return {Boolean} `true` if the Model has been destroyed, `false` otherwise.
		 */
		isDestroyed : function() {
			return this.destroyed;
		},
		
		
		/**
		 * (Re)Loads the Model's attributes from its persistent storage (such as a web server), using the configured 
		 * {@link #proxy}. Any changed data will be discarded. 
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Load} The LoadOperation that was executed, which provides
		 *   information about the operation and the request(s) that took place.
		 * 
		 * 
		 * ## Aborting a Load Operation
		 * 
		 * It is possible to abort a 'load' operation using the returned Operation's {@link data.persistence.operation.Operation#abort abort}
		 * method. The `cancel` and `complete` callbacks are called, as well as `cancel` and `always` handlers on the Promise.
		 * 
		 * Note that the load request to the {@link #proxy} may or may not be aborted (canceled) itself, but even if it returns at a later
		 * time, the data will not populate the Model in this case.
		 * 
		 * 
		 * ## Examples
		 * 
		 * Simple model loading:
		 * 
		 *     var model = new UserModel();  // assume `UserModel` is pre-configured with an Ajax proxy
		 *     
		 *     // Load the model, and attach handlers to determine when the model has finished loading
		 *     var operation = model.load();
		 *     operation.done( function() { alert( "Model Loaded" ); } );
		 *     operation.fail( function() { alert( "Model Failed To Load" ); } );
		 * 
		 * 
		 * Passing options:
		 *     
		 *     var model = new UserModel();  // assume `UserModel` is pre-configured with an Ajax proxy
		 *     
		 *     var operation = model.load( { 
		 *         params : {
		 *             paramA : 1,
		 *             paramB : 2
		 *         }
		 *     } );
		 *     
		 * 
		 * Aborting an in-progress 'load' operation:
		 * 
		 *     var model = new UserModel();  // assume `UserModel` is pre-configured with an Ajax proxy
		 *     
		 *     var operation = model.load();
		 *     
		 *     // ...
		 *     
		 *     operation.abort();
		 *     
		 * 
		 * Responding to all of the Operation's Promise events:
		 * 
		 *     var model = new UserModel();  // assume `UserModel` is pre-configured with an Ajax proxy
		 *     
		 *     // Load the model, and attach handlers to determine when the model has finished loading
		 *     var operation = model.load()
		 *         .done( function() { alert( "Model Loaded Successfully" ); } )
		 *         .fail( function() { alert( "Model Load Error" ); } )
		 *         .cancel( function() { alert( "Model Load Aborted" ); } )
		 *         .always( function() { alert( "Model Load Complete (success, error, or aborted)" ); } )
		 * 
		 * 
		 * Passing callbacks instead of using the Operation's Promise interface (not recommended as it may result in "callback soup"
		 * for complex asynchonous operations, but supported):
		 * 
		 *     var model = new UserModel();  // assume `UserModel` is pre-configured with an Ajax proxy
		 *     
		 *     var operation = model.load( {
		 *         success : function() { alert( "Model Loaded Successfully" ); },
		 *         error   : function() { alert( "Model Load Error" ); },
		 *         cancel  : function() { alert( "Model Load Aborted" ); },
		 *         always  : function() { alert( "Model Load Complete (success, error, or aborted)" ); }
		 *     } );
		 *     
		 * 
		 * Determining when multiple models have loaded, taking advantage of jQuery's ability to combine multiple Promise
		 * objects into a master Promise:
		 * 
		 *     var model1 = new UserModel(),
		 *         model2 = new UserModel(),
		 *         model3 = new UserModel();
		 *     
		 *     jQuery.when( model1.load(), model2.load(), model3.load() ).then( function() {
		 *         alert( "All 3 models have loaded" );
		 *     } );
		 * 
		 * 
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the request. See {@link data.persistence.request.Request#params} for details.
		 * @param {Function} [options.success] Function to call if the save is successful.
		 * @param {Function} [options.failure] Function to call if the save fails.
		 * @param {Function} [options.cancel] Function to call if the loading has been canceled, by the returned
		 *   Operation being {@link data.persistence.operation.Operation#abort aborted}.
		 * @param {Function} [options.progress] Function to call when progress has been made on the Operation. This is
		 *   called when an individual request has completed, or when the {@link #proxy} reports progress otherwise.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of a success or fail state.
		 * @param {Object} [options.scope] The object to call the `success`, `failure`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer.
		 * @return {data.persistence.operation.Operation} An Operation object which represents the 'load' operation. This
		 *   object acts as a Promise object as well, which may have handlers attached for when the load completes. The 
		 *   Operation's Promise is both resolved or rejected with the arguments listed above in the method description.
		 *   The 'load' operation may be aborted by calling the {@link data.persistence.operation.Operation#abort abort}
		 *   method on this object.
		 */
		load : function( options ) {
			options = PersistenceUtil.normalizePersistenceOptions( options );
			var proxy = this.getProxy();
			
			// <debug>
			if( !proxy ) throw new Error( "data.Model::load() error: Cannot load. No proxy configured." );
			// </debug>
			
			// Set the `loading` flag while the Model is loading. Will be set to false in onLoadSuccess or onLoadError
			this.loading = true;
			this.fireEvent( 'loadbegin', this );
			
			// Make a request to load the data from the proxy
			var id = ( this.hasIdAttribute() ) ? this.getId() : undefined,
			    request = new ReadRequest( { modelId: id, params: options.params } ),
			    operation = new LoadOperation( { dataComponent: this, proxy: proxy, requests: request } );
			
			// Attach any user-provided callbacks to the operation. The `scope` was attached above.
			operation.progress( options.progress ).done( options.success ).fail( options.error ).cancel( options.cancel ).always( options.complete );
			
			operation.executeRequests().then(
				_.bind( this.onLoadSuccess, this ),
				_.bind( this.onLoadError, this )
			);
			operation.progress( _.bind( this.onLoadProgress, this, operation ) );
			operation.cancel( _.bind( this.onLoadCancel, this, operation ) );  // handle if the Operation is aborted (canceled) by the user
			
			return operation;
		},
		
		
		/**
		 * Handles the {@link #proxy} making progress on the current load operation.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Load} operation The LoadOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which are required to complete the load operation.
		 */
		onLoadProgress : function( operation ) {
			this.fireEvent( 'loadprogress', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully loading a set of data as a result of the {@link #method-load}
		 * method being called.
		 * 
		 * Resolves the `operation` object created by {@link #method-load}.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Load} operation The LoadOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the load operation.
		 */
		onLoadSuccess : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete after the operation has been aborted. In this case, simply return out. 
			
			var requests = operation.getRequests();
			this.set( requests[ 0 ].getResultSet().getRecords()[ 0 ], { ignoreUnknownAttrs: this.ignoreUnknownAttrsOnLoad } );  // only ignore unknown attributes in the response data object if the `ignoreUnknownAttrsOnLoad` config is set to `true`
			this.loading = false;
			
			this.commit();
			
			operation.resolve();
			this.fireEvent( 'loadsuccess', this, operation );
			this.fireEvent( 'load', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to load a set of data as a result of the {@link #method-load} method 
		 * being called.
		 * 
		 * Rejects the `operation` object created by {@link #method-load}.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Load} operation The LoadOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the load operation.
		 */
		onLoadError : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete (in an error state) after the operation has been aborted. In this case, simply return out.
			
			this.loading = false;
			
			operation.reject();
			this.fireEvent( 'loaderror', this, operation );
			this.fireEvent( 'load', this, operation );
		},
		
		
		/**
		 * Handles a {@link data.persistence.operation.Load LoadOperation} being canceled (aborted) by a client of 
		 * the Model.
		 *  
		 * @protected
		 * @param {data.persistence.operation.Load} operation The LoadOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the load operation.
		 */
		onLoadCancel : function( operation ) {
			this.loading = false;
			
			// Note: the operation was already aborted. No need to call operation.abort() here.
			this.fireEvent( 'loadcancel', this, operation );
			this.fireEvent( 'load', this, operation );
		},
		
		
		/**
		 * Persists the Model data to persistent storage, using the configured {@link #proxy}. If the request to persist the Model's 
		 * data is successful, the Model's data will be {@link #method-commit committed} upon completion.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Save} The SaveOperation that was executed, which provides
		 *   information about the operation and the request(s) that took place.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Boolean} [options.syncRelated=true] `true` to synchronize (persist) the "related" child models/collections 
		 *   of this Model (if it has any). Related models/collections must be stored under {@link data.attribute.Model}
		 *   or {@link data.attribute.Collection} Attributes for this to work. The models/collections that would be synchronized
		 *   would be the child models/{@link data.Collection collections} that are related to the Model (i.e. not 
		 *   {@link data.attribute.DataComponent#embedded embedded} in the Model). 
		 *   
		 *   Set to `false` to only save the data in this Model, leaving any related child models/collections to be persisted 
		 *   individually, at another time.
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the request. See {@link data.persistence.request.Request#params} for details.
		 * @param {Function} [options.success] Function to call if the save is successful.
		 * @param {Function} [options.error] Function to call if the save fails.
		 * @param {Function} [options.cancel] Function to call if the save has been canceled, by the returned
		 *   Operation being {@link data.persistence.operation.Operation#abort aborted}. See note in the description of the
		 *   return of this method for a caveat on aborting (canceling) "save" operations.
		 * @param {Function} [options.progress] Function to call when progress has been made on the Operation. This is
		 *   called when an individual request has completed, or when the {@link #proxy} reports progress otherwise.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer. 
		 * @return {data.persistence.operation.Operation} An Operation object which represents the 'save' operation. This
		 *   object acts as a Promise object as well, which may have handlers attached for when the save completes. The 
		 *   Operation's Promise is both resolved or rejected with the arguments listed above in the method description.
		 *   
		 *   The 'save' operation may be aborted (canceled) by calling the {@link data.persistence.operation.Operation#abort abort}
		 *   method on this object. However, note that when aborting a 'save' operation, it is possible that the request still completed
		 *   and the Model was saved on its external data store (such as a web server). This may cause an inconsistency between the 
		 *   state of the model on the client-side, and the state of the model on the server-side. Therefore, it is not recommended that 
		 *   the 'save' operation be canceled, unless it is going to be attempted again after sufficient time where the data store
		 *   (server) has finished the original operation, or the page is going to be refreshed.
		 */
		save : function( options ) {			
			options = PersistenceUtil.normalizePersistenceOptions( options );
			
			var me = this,  // for closures
			    syncRelated = ( options.syncRelated === undefined ) ? true : options.syncRelated;  // defaults to true
			
			// <debug>
			if( !this.getProxy() ) throw new Error( "data.Model::save() error: Cannot save. No proxy." );  // No proxy, cannot save. Throw an error
			if( !this.hasIdAttribute() ) throw new Error( "data.Model::save() error: Cannot save. Model does not have an idAttribute that relates to a valid attribute." );
			// </debug>
			
			// Set the `saving` flag while the Model is saving. Will be set to false in onSaveSuccess or onSaveError
			this.saving = true;
			this.fireEvent( 'savebegin', this );
			
			var saveOperation = this.createSaveOperation( options );
			
			// First, synchronize any nested related (i.e. non-embedded) Models and Collections of the model.
			// Chain the synchronization of collections to the synchronization of this Model itself to create
			// the `modelSavePromise` (if the `syncRelated` option is true)
			if( syncRelated ) {
				jQuery.when( this.syncRelatedCollections(), this.syncRelatedModels() ).then( 
					function() { me.executeSaveOperation( saveOperation ); },
					function() { me.onSaveError( saveOperation ); }  // one of the sync tasks failed: fail the Operation
				);
			} else {  // not synchronizing related collections/models, execute the SaveOperation immediately
				this.executeSaveOperation( saveOperation );
			}
			
			// Set up any callbacks provided in the options
			saveOperation.progress( options.progress ).done( options.success ).fail( options.error ).cancel( options.cancel ).always( options.complete );
			
			return saveOperation.promise();
		},
		
		
		/**
		 * Creates a {@link data.persistence.operation.Save SaveOperation} to save the model. This method is called by 
		 * {@link #method-save}, and the SaveOperation object is created before actually executing it for the case that
		 * related (i.e. non-{@link data.attribute.DataComponent#embedded embedded}) models/collections need to be persisted
		 * first.
		 * 
		 * @protected
		 * @param {Object} options The `options` object provided to the {@link #method-save} method.
		 * @return {data.persistence.operation.Save} The SaveOperation object that will be used to persist this model.
		 */
		createSaveOperation : function( options ) {
			// Create and return the SaveOperation object
			var RequestClass = this.isNew() ? CreateRequest : UpdateRequest,
			    writeRequest = new RequestClass( { models : [ this ], params: options.params } ),
			    operation = new SaveOperation( { dataComponent: this, proxy: this.getProxy(), requests: writeRequest } );
			
			return operation;
		},
		
		
		/**
		 * Private method that performs the actual save (persistence) of this Model. This method is called from 
		 * {@link #method-save} at the appropriate time. It is delayed from being called if the Model first has to 
		 * persist non-{@link data.attribute.DataComponent#embedded embedded}) child collections.
		 * 
		 * @private
		 * @param {data.persistence.operation.Save} operation The SaveOperation to execute.
		 * @param {Object} originalPersistedSnapshotData
		 */
		executeSaveOperation : function( operation, originalPersistedSnapshotData ) {
			operation.executeRequests().then(
				_.bind( this.onSaveSuccess, this ),
				_.bind( this.onSaveError, this )
			);
			
			operation.progress( _.bind( this.onSaveProgress, this, operation ) );
			operation.cancel( _.bind( this.onSaveCancel, this, operation ) );  // handle if the Operation is aborted (canceled) by the user
		},
		
		
		/**
		 * Private utility method which is used to synchronize all of the nested related (i.e. not 'embedded') 
		 * collections for this Model. Returns a Promise object which is resolved when all collections have been 
		 * successfully synchronized.
		 * 
		 * @private
		 * @return {jQuery.Promise} A Promise object which is resolved when all collections have been successfully
		 *   synchronized. If any of the requests to synchronize collections should fail, the Promise will be rejected.
		 *   If there are no nested related collections, the promise is resolved immediately.
		 */
		syncRelatedCollections : function() {
			// Create and return single Promise object out of all the Collection synchronization promises
			var collectionSyncPromises = _.chain( this.getRelatedCollectionAttributes() )
				.map( function( attr ) { return this.get( attr.getName() ); }, this )  // retrieve an array of the actual collections under the Model
				.compact()  // remove any null values (for attributes that have not been set to a collection yet)
				.map( function( collection ) { return collection.sync(); } )  // sync all collections, and retrieve a list of the sync promises
				.value();
			
			return jQuery.when.apply( jQuery, collectionSyncPromises );
		},
		
		
		/**
		 * Private utility method which is used to save all of the nested related (i.e. not 'embedded') 
		 * models for this Model. Returns a Promise object which is resolved when all models have been 
		 * successfully saved.
		 * 
		 * @private
		 * @return {jQuery.Promise} A Promise object which is resolved when all related models have been successfully
		 *   saved. If any of the requests to save a model should fail, the Promise will be rejected.
		 *   If there are no nested related models, the promise is resolved immediately.
		 */
		syncRelatedModels : function() {
			// Create and return single Promise object out of all the Model save promises
			var modelSavePromises = _.chain( this.getRelatedModelAttributes() )
				.map( function( attr ) { return this.get( attr.getName() ); }, this )  // retrieve an array of the actual child models under the Model
				.compact()  // remove any null values (for attributes that have not been set to a model yet)
				.map( function( model ) { return model.save(); } )  // save all models, and retrieve a list of the save promises
				.value();
			
			return jQuery.when.apply( jQuery, modelSavePromises );
		},
		
		
		/**
		 * Handles the {@link #proxy} making progress on the current save operation.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Save} operation The SaveOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which are required to complete the operation.
		 */
		onSaveProgress : function( operation ) {
			this.fireEvent( 'saveprogress', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully saving the Model as a result of the {@link #method-save}
		 * method being called.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Save} operation The SaveOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the operation.
		 */
		onSaveSuccess : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete (in an error state) after the operation has been aborted. In this case, simply return out.
			
			this.saving = false;
			
			// Handle a server-side update, if any. This is when a server (or any proxy) returns a model's state in the 
			// response to the save request, to provide any updates to attributes. This is most useful for 'create' requests 
			// where the ID of the model will be returned, in order to update the client model.
			var resultSet = operation.getRequests()[ 0 ].getResultSet(),
			    updateData = ( resultSet ) ? resultSet.getRecords()[ 0 ] : null;
			
			if( updateData ) this.set( updateData );
			
			this.commit();  // model is no longer modified
			
			operation.resolve(); 
			this.fireEvent( 'savesuccess', this, operation );
			this.fireEvent( 'save', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to destroy the Model a result of the {@link #method-destroy} method 
		 * being called.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Save} operation The SaveOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the operation.
		 */
		onSaveError : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete (in an error state) after the operation has been aborted. In this case, simply return out.
			
			this.saving = false;
			
			operation.reject();
			this.fireEvent( 'saveerror', this, operation );
			this.fireEvent( 'save', this, operation );
		},
		
		
		/**
		 * Handles a {@link data.persistence.operation.Save SaveOperation} being canceled (aborted) by a client of 
		 * the Model.
		 *  
		 * @protected
		 * @param {data.persistence.operation.Save} operation The SaveOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the save operation.
		 */
		onSaveCancel : function( operation ) {
			this.saving = false;
			
			// Note: the operation was already aborted. No need to call operation.abort() here.
			this.fireEvent( 'savecancel', this, operation );
			this.fireEvent( 'save', this, operation );
		},
		
		
		
		/**
		 * Destroys the Model on the backend, using the configured {@link #proxy}.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Destroy} The DestroyOperation that was executed, which provides
		 *   information about the operation and the request(s) that took place.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the request. See {@link data.persistence.request.Request#params} for details.
		 * @param {Function} [options.success] Function to call if the destroy (deletion) is successful.
		 * @param {Function} [options.error] Function to call if the destroy (deletion) fails.
		 * @param {Function} [options.cancel] Function to call if the destroy (deletion) has been canceled, by the returned
		 *   Operation being {@link data.persistence.operation.Operation#abort aborted}. See note in the description of the
		 *   return of this method for a caveat on aborting (canceling) "destroy" operations.
		 * @param {Function} [options.progress] Function to call when progress has been made on the Operation. This is
		 *   called when an individual request has completed, or when the {@link #proxy} reports progress otherwise.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer. 
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the destroy (deletion) completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 * @return {data.persistence.operation.Operation} An Operation object which represents the 'destroy' operation. This
		 *   object acts as a Promise object as well, which may have handlers attached for when the destroy completes. The 
		 *   Operation's Promise is both resolved or rejected with the arguments listed above in the method description.
		 *   
		 *   The 'destroy' operation may be aborted by calling the {@link data.persistence.operation.Operation#abort abort}
		 *   method on this object. However, note that when aborting a 'destroy' operation, it is possible that the request still 
		 *   completed and the Model was destroyed on its external data store (such as a web server). This may cause an inconsistency 
		 *   between the state of the model on the client-side, and the state of the model on the server-side. Therefore, it is not 
		 *   recommended that the 'destroy' operation be canceled, unless it is going to be attempted again, or the page is going to be refreshed.
		 */
		destroy : function( options ) {
			options = PersistenceUtil.normalizePersistenceOptions( options );
			var proxy = this.getProxy();
			
			// No proxy, cannot destroy. Throw an error
			// <debug>
			if( !proxy ) throw new Error( "data.Model::destroy() error: Cannot destroy model on server. No proxy." );
			// </debug>
			
			
			// Set the `destroying` flag while the Model is destroying. Will be set to false in onDestroySuccess 
			// or onDestroyError
			this.destroying = true;
			this.fireEvent( 'destroybegin', this );
			
			var id = ( this.hasIdAttribute() ) ? this.getId() : undefined,
			    request = new DestroyRequest( { models : [ this ], params : options.params } ),
			    operation = new DestroyOperation( { dataComponent: this, proxy: proxy, requests: request } );
			
			// Attach any user-provided callbacks to the operation. The `scope` was attached above.
			operation.progress( options.progress ).done( options.success ).fail( options.error ).cancel( options.cancel ).always( options.complete );
			
			if( this.isNew() ) {
				// If it is a new model, there is nothing on the server to destroy. Simply call the success handler to 
				// fire the event.
				this.onDestroySuccess( operation );
				
			} else {
				// Make a request to destroy the data on the server
				operation.executeRequests().then(
					_.bind( this.onDestroySuccess, this ),
					_.bind( this.onDestroyError, this )
				);
				operation.progress( _.bind( this.onDestroyProgress, this, operation ) );
				operation.cancel( _.bind( this.onDestroyCancel, this, operation ) );  // handle if the Operation is aborted (canceled) by the user
			}
			
			return operation;
		},
		
		
		/**
		 * Handles the {@link #proxy} making progress on the current destroy operation.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Destroy} operation The DestroyOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which are required to complete the operation.
		 */
		onDestroyProgress : function( operation ) {
			this.fireEvent( 'destroyprogress', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully destroying the Model as a result of the {@link #method-destroy}
		 * method being called.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Destroy} operation The DestroyOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the destroy (delete) operation.
		 */
		onDestroySuccess : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete after the operation has been aborted. In this case, simply return out. 
			
			this.destroying = false;
			this.destroyed = true;
			
			operation.resolve();
			this.fireEvent( 'destroysuccess', this, operation );
			this.fireEvent( 'destroy', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to destroy the Model a result of the {@link #method-destroy} method 
		 * being called.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Destroy} operation The DestroyOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the destroy (delete) operation.
		 */
		onDestroyError : function( operation ) {
			if( operation.wasAborted() ) return;  // the requests for the operation may still complete after the operation has been aborted. In this case, simply return out. 
			
			this.destroying = false;
			
			operation.reject();
			this.fireEvent( 'destroyerror', this, operation );
			this.fireEvent( 'destroy', this, operation );
		},
		
		
		/**
		 * Handles a {@link data.persistence.operation.Destroy DestroyOperation} being canceled (aborted) by a client of 
		 * the Model.
		 *  
		 * @protected
		 * @param {data.persistence.operation.Destroy} operation The DestroyOperation object which holds metadata, and all of the 
		 *   {@link data.persistence.request.Request Request(s)} which were required to complete the destroy operation.
		 */
		onDestroyCancel : function( operation ) {
			this.destroying = false;
			
			// Note: the operation was already aborted. No need to call operation.abort() here.
			this.fireEvent( 'destroycancel', this, operation );
			this.fireEvent( 'destroy', this, operation );
		},
		
		
		// ------------------------------------
		
		// Utility methods
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.DataComponent DataComponent Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.DataComponent[]}
		 */
		getDataComponentAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return ( attr instanceof DataComponentAttribute ); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.DataComponent DataComponent Attributes} 
		 * which are also {@link data.attribute.DataComponent#embedded}. This is a convenience method that supports the methods which
		 * use the embedded DataComponent Attributes. 
		 * 
		 * @protected
		 * @return {data.attribute.DataComponent[]} The array of embedded DataComponent Attributes.
		 */
		getEmbeddedDataComponentAttributes : function() {
			return _.filter( this.getDataComponentAttributes(), function( attr ) { return attr.isEmbedded(); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]}
		 */
		getCollectionAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return attr instanceof CollectionAttribute; } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes},
		 * but are *not* {@link data.attribute.Collection#embedded embedded} attributes (i.e. they are "related" attributes).
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]} 
		 */
		getRelatedCollectionAttributes : function() {
			return _.filter( this.getCollectionAttributes(), function( attr ) { return !attr.isEmbedded(); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Model Model Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.Model[]}
		 */
		getModelAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return attr instanceof ModelAttribute; } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes},
		 * but are *not* {@link data.attribute.Collection#embedded embedded} attributes (i.e. they are "related" attributes).
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]} 
		 */
		getRelatedModelAttributes : function() {
			return _.filter( this.getModelAttributes(), function( attr ) { return !attr.isEmbedded(); } );
		}
		
	} );
	
	
	return Model;
	
} );
