/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class Data.attribute.Attribute
	 * @extends Object
	 * 
	 * Base attribute definition class for {@link Data.Model Models}. The Attribute itself does not store data, but instead simply
	 * defines the behavior of a {@link Data.Model Model's} attributes. A {@link Data.Model Model} is made up of Attributes. 
	 * 
	 * Note: You will most likely not instantiate Attribute objects directly. This is used by {@link Data.Model} with its
	 * {@link Data.Model#cfg-attributes attributes} prototype config. Anonymous config objects provided to {@link Data.Model#cfg-attributes attributes}
	 * will be passed to the Attribute constructor.
	 */
	var Attribute = Class.extend( Object, {
		abstractClass: true,
		
		
		/**
		 * @cfg {String} name (required)
		 * The name for the attribute, which is used by the owner Model to reference it.
		 */
		name : "",
		
		/**
		 * @cfg {String} type
		 * Specifies the type of the Attribute, in which a conversion of the raw data will be performed.
		 * This accepts the following general types, but custom types may be added using the {@link Data.attribute.Attribute#registerType} method.
		 * 
		 * - {@link Data.attribute.Mixed mixed}: Performs no conversions, and no special processing of given values. This is the default Attribute type (not recommended).
		 * - {@link Data.attribute.String string}
		 * - {@link Data.attribute.Integer int} / {@link Data.attribute.Integer integer}
		 * - {@link Data.attribute.Float float} (really a "double")
		 * - {@link Data.attribute.Boolean boolean} / {@link Data.attribute.Boolean bool}
		 * - {@link Data.attribute.Date date}
		 * - {@link Data.attribute.Model model}
		 * - {@link Data.attribute.Collection collection}
		 */
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * The default value for the Attribute, if it has no value of its own. This can also be specified as the config 'default', 
		 * but must be wrapped in quotes (as `default` is a reserved word in JavaScript).
		 *
		 * If the defaultValue is a function, the function will be executed each time a Model is created, and its return value used as 
		 * the defaultValue. This is useful, for example, to assign a new unique number to an attribute of a model. Ex:
		 * 
		 *     MyModel = Data.Model.extend( {
		 *         attributes : [
		 *             {
		 *                 name: 'uniqueId', 
		 *                 defaultValue: function( attribute ) {
		 *                     return _.uniqueId(); 
		 *                 }
		 *             }
		 *         ]
		 *     } );
		 * 
		 * Note that the function is passed the Attribute as its first argument, which may be used to query Attribute properties/configs.
		 * 
		 * If an Object is provided as the defaultValue, its properties will be recursed and searched for functions. The functions will
		 * be executed to provide default values for nested properties of the object in the same way that providing a Function for this config
		 * will do.
		 */
		
		/**
		 * @cfg {Function} set
		 * A function that can be used to convert the raw value provided to the attribute, to a new value which will be stored
		 * on the {@link Data.Model Model}. This function is passed the following arguments:
		 * 
		 * @cfg {Mixed} set.newValue The provided new data value to the attribute. If the attribute has no initial data value, its {@link #defaultValue}
		 *   will be provided to this argument upon instantiation of the {@link Data.Model Model}.
		 * @cfg {Mixed} set.oldValue The old value that the attribute held (if any).
		 * 
		 * The function should then do any processing that is necessary, and return the value that the Attribute should hold. For example,
		 * this `set` function will convert a string value to a 
		 * <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date" target="_blank">Date</a>
		 * object. Otherwise, it will return the value unchanged:
		 *     
		 *     {
		 *         name : 'myDateAttr',
		 *         
		 *         set : function( newValue, oldValue ) {
		 *             if( typeof value === 'string' ) {
		 *                 value = new Date( value );
		 *             }
		 *             return value;
		 *         }
		 *     }
		 * 
		 * Just as with {@link #get}, the `set` function is called in the scope of the {@link Data.Model Model} that owns the attribute. 
		 * This can be used to set other attributes of a "computed" attribute. Ex:
		 * 
		 *     {
		 *         // A "computed" attribute which combines the 'firstName' and 'lastName' attributes in this model (assuming they are there)
		 *         name : 'fullName',
		 *         
		 *         set : function( newValue, oldValue ) {
		 *             // A setter which takes the first and last name given (such as "Gregory Jacobs"), and splits them up into 
		 *             // their appropriate parts, to set the appropriate attributes for the computed attribute
		 *             var names = newValue.split( ' ' );  // split on the space between first and last name
		 *             
		 *             // Note: `this` refers to the model which is setting the value, so we can call the set() method
		 *             this.set( 'firstName', names[ 0 ] );
		 *             this.set( 'lastName', names[ 1 ] );
		 *         },
		 * 
		 *         get : function( value ) {
		 *             return this.get( 'firstName' ) + " " + this.get( 'lastName' );  // Combine firstName and lastName for the computed attribute. `this` refers to the model
		 *         }
		 *     }
		 * 
		 * The function is run in the context (the `this` reference) of the {@link Data.Model Model} instance that owns the attribute, in the that case 
		 * that other Attributes need to be queried, or need to be {@link Data.Model#set set} by the `set` function. However, in the case of querying 
		 * other Attributes for their value, be careful in that they may not be set to the expected value when the `set` function executes. For creating 
		 * computed Attributes that rely on other Attributes' values, use a {@link #get} function instead.
		 * 
		 * Notes:
		 * 
		 * - Both a `set` and a {@link #get} function can be used in conjunction.
		 * - The `set` function is called upon instantiation of the {@link Data.Model Model} if the Model is passed an initial value
		 *   for the Attribute, or if the Attribute has a {@link #defaultValue}.
		 * 
		 * 
		 * When using {@link #type typed} Attributes, providing a `set` function overrides the Attribute's {@link #method-set set} method, which
		 * does the automatic conversion that the Attribute subclass advertises. If you would like to still use the original {@link #method-set set}
		 * method in conjunction with pre-processing and/or post-processing the value, you can call the original {@link #method-set set} method as
		 * such:
		 * 
		 *     {
		 *         // Some integer value attribute, which may need to convert string values (such as "123") to an actual integer 
		 *         // (done behind the scenes via `parseInt()`)
		 *         name : 'myValue',
		 *         type : 'int',
		 *         
		 *         set : function( newValue, oldValue ) {
		 *             // Pre-process the raw newValue here, if desired
		 *             
		 *             // Call the original `set` method, which does the conversion to an integer if need be
		 *             newValue = this._super( arguments );
		 *             
		 *             // Post-process the converted newValue here, if desired
		 *             
		 *             // And finally, return the value that should be stored for the attribute
		 *             return newValue;
		 *         }
		 *     }
		 */
		
		/**
		 * @cfg {Function} get
		 * A function that can be used to change the value that is returned when the Model's {@link Data.Model#get get} method is called
		 * on the Attribute. This is useful to create "computed" attributes, which may be created based on other Attributes' values.  The function is 
		 * passed the argument of the underlying stored value, and should return the computed value.
		 * 
		 * @cfg {Mixed} get.value The value that the Attribute currently has stored in the {@link Data.Model Model}.
		 * 
		 * For example, if we had a {@link Data.Model Model} with `firstName` and `lastName` Attributes, and we wanted to create a `fullName` 
		 * Attribute, this could be done as in the example below. Note that just as with {@link #cfg-set}, the `get` function is called in the 
		 * scope of the {@link Data.Model Model} that owns the attribute. 
		 * 
		 *     {
		 *         name : 'fullName',
		 *         get : function( value ) {  // in this example, the Attribute has no value of its own, so we ignore the arg
		 *             return this.get( 'firstName' ) + " " + this.get( 'lastName' );   // `this` refers to the model that owns the Attribute
		 *         }
		 *     }
		 * 
		 * Note: if the intention is to convert a provided value which needs to be stored on the {@link Data.Model Model} in a different way,
		 * use a {@link #cfg-set} function instead. 
		 * 
		 * However, also note that both a {@link #cfg-set} and a `get` function can be used in conjunction.
		 */
		
		/**
		 * @cfg {Function} raw
		 * A function that can be used to convert an Attribute's value to a raw representation, usually for persisting data on a server.
		 * This function is automatically called (if it exists) when a persistence {@link Data.persistence.proxy.Proxy proxy} is collecting
		 * the data to send to the server. The function is passed two arguments, and should return the raw value.
		 * 
		 * @cfg {Mixed} raw.value The underlying value that the Attribute currently has stored in the {@link Data.Model Model}.
		 * @cfg {Data.Model} raw.model The Model instance that this Attribute belongs to.
		 * 
		 * For example, a Date object is normally converted to JSON with both its date and time components in a serialized string (such
		 * as "2012-01-26T01:20:54.619Z"). To instead persist the Date in m/d/yyyy format, one could create an Attribute such as this:
		 * 
		 *     {
		 *         name : 'eventDate',
		 *         set : function( value, model ) { return new Date( value ); },  // so the value is stored as a Date object when used client-side
		 *         raw : function( value, model ) {
		 *             return (value.getMonth()+1) + '/' + value.getDate() + '/' + value.getFullYear();  // m/d/yyyy format 
		 *         }
		 *     }
		 * 
		 * The value that this function returns is the value that is used when the Model's {@link Data.Model#raw raw} method is called
		 * on the Attribute.
		 */
		
		/**
		 * @cfg {Boolean} persist
		 * True if the attribute should be persisted by its {@link Data.Model Model} using the Model's {@link Data.Model#proxy proxy}.
		 * Set to false to prevent the attribute from being persisted.
		 */
		persist : true,
		
		
		
		
		statics : {
			/**
			 * An object (hashmap) which stores the registered Attribute types. It maps type names to Attribute subclasses.
			 * 
			 * @private
			 * @static
			 * @property {Object} attributeTypes
			 */
			attributeTypes : {},
			
			
			/**
			 * Static method to instantiate the appropriate Attribute subclass based on a configuration object, based on its `type` property.
			 * 
			 * @static
			 * @method create
			 * @param {Object} config The configuration object for the Attribute. Config objects should have the property `type`, 
			 *   which determines which type of Attribute will be instantiated. If the object does not have a `type` property, it will default 
			 *   to `mixed`, which accepts any data type, but does not provide any type checking / data consistency. Note that already-instantiated 
			 *   Attributes will simply be returned unchanged. 
			 * @return {Data.attribute.Attribute} The instantiated Attribute.
			 */
			create : function( config ) {
				var type = config.type ? config.type.toLowerCase() : undefined;
			
				if( config instanceof Attribute ) {
					// Already an Attribute instance, return it
					return config;
					
				} else if( this.hasType( type || "mixed" ) ) {
					return new this.attributeTypes[ type || "mixed" ]( config );
					
				} else {
					// No registered type with the given config's `type`, throw an error
					throw new Error( "Data.attribute.Attribute: Unknown Attribute type: '" + type + "'" );
				}
			},
			
			
			/**
			 * Static method used to register implementation Attribute subclass types. When creating an Attribute subclass, it 
			 * should be registered with the Attribute superclass (this class), so that it can be instantiated by a string `type` 
			 * name in an anonymous configuration object. Note that type names are case-insensitive.
			 * 
			 * This method will throw an error if a type name is already registered, to assist in making sure that we don't get
			 * unexpected behavior from a type name being overwritten.
			 * 
			 * @static
			 * @method registerType
			 * @param {String} typeName The type name of the registered class. Note that this is case-insensitive.
			 * @param {Function} jsClass The Attribute subclass (constructor function) to register.
			 */
			registerType : function( type, jsClass ) {
				type = type.toLowerCase();
				
				if( !this.attributeTypes[ type ] ) { 
					this.attributeTypes[ type ] = jsClass;
				} else {
					throw new Error( "Error: Attribute type '" + type + "' already exists" );
				}
			},
			
			
			/**
			 * Retrieves the Component class (constructor function) that has been registered by the supplied `type` name. 
			 * 
			 * @method getType
			 * @param {String} type The type name of the registered class.
			 * @return {Function} The class (constructor function) that has been registered under the given type name.
			 */
			getType : function( type ) {
				return this.attributeTypes[ type.toLowerCase() ];
			},
			
			
			/**
			 * Determines if there is a registered Attribute type with the given `typeName`.
			 * 
			 * @method hasType
			 * @param {String} typeName
			 * @return {Boolean}
			 */
			hasType : function( typeName ) {
				if( !typeName ) {  // any falsy type value given, return false
					return false;
				} else {
					return !!this.attributeTypes[ typeName.toLowerCase() ];
				}
			}
		},
		
		
		// End Statics
		
		// -------------------------------
		
		
		
		/**
		 * Creates a new Attribute instance. Note: You will normally not be using this constructor function, as this class
		 * is only used internally by {@link Data.Model}.
		 * 
		 * @constructor 
		 * @param {Object/String} config An object (hashmap) of the Attribute object's configuration options, which is its definition. 
		 *   Can also be its Attribute {@link #name} provided directly as a string.
		 */
		constructor : function( config ) {
			var me = this;
			
			// If the argument wasn't an object, it must be its attribute name
			if( typeof config !== 'object' ) {
				config = { name: config };
			}
			
			// Copy members of the attribute definition (config) provided onto this object
			_.assign( me, config );
			
			
			// Each Attribute must have a name.
			var name = me.name;
			if( name === undefined || name === null || name === "" ) {
				throw new Error( "no 'name' property provided to Data.attribute.Attribute constructor" );
				
			} else if( typeof me.name === 'number' ) {  // convert to a string if it is a number
				me.name = name.toString();
			}
			
			
			// Normalize defaultValue
			if( me[ 'default' ] ) {  // accept the key as simply 'default'
				me.defaultValue = me[ 'default' ];
			}
		},
		
		
		/**
		 * Retrieves the name for the Attribute.
		 * 
		 * @method getName
		 * @return {String}
		 */
		getName : function() {
			return this.name;
		},
		
		
		/**
		 * Retrieves the default value for the Attribute. 
		 * 
		 * @method getDefaultValue
		 * @return {Mixed}
		 */
		getDefaultValue : function() {
			var defaultValue = this.defaultValue;
			
			if( typeof defaultValue === "function" ) {
				defaultValue = defaultValue( this );
			}
			
			// If defaultValue is an object, clone it, to not edit the original object structure
			if( typeof defaultValue === 'object' ) {
				defaultValue = _.cloneDeep( defaultValue );
			}
			
			return defaultValue;
		},
		
		
		
		/**
		 * Determines if the Attribute should be persisted.
		 * 
		 * @method isPersisted
		 * @return {Boolean}
		 */
		isPersisted : function() {
			return this.persist;
		},
		
		
		/**
		 * Determines if the Attribute has a user-defined setter (i.e. the {@link #cfg-set set} config was provided).
		 * 
		 * @method hasUserDefinedSetter
		 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-set set} function. 
		 */
		hasUserDefinedSetter : function() {
			return this.hasOwnProperty( 'set' );
		},
		
		
		/**
		 * Determines if the Attribute has a user-defined getter (i.e. the {@link #cfg-get get} config was provided).
		 * 
		 * @method hasUserDefinedGetter
		 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-get get} function. 
		 */
		hasUserDefinedGetter : function() {
			return this.hasOwnProperty( 'get' );
		},
		
		
		// ---------------------------
		
		
		/**
		 * Allows the Attribute to determine if two values of its data type are equal, and the model
		 * should consider itself as "changed". This method is passed the "old" value and the "new" value
		 * when a value is {@link Data.Model#set set} to the Model, and if this method returns `false`, the
		 * new value is taken as a "change".
		 * 
		 * This may be overridden by subclasses to provide custom comparisons, but the default implementation is
		 * to directly compare primitives, and deep compare arrays and objects.
		 * 
		 * @method valuesAreEqual
		 * @param {Mixed} oldValue
		 * @param {Mixed} newValue
		 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
		 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
		 */
		valuesAreEqual : function( oldValue, newValue ) {
			return _.isEqual( oldValue, newValue );
		},
		
		
		// ---------------------------
		
		
		/**
		 * Method that allows pre-processing for the value that is to be set to a {@link Data.Model}.
		 * After this method has processed the value, it is provided to the {@link #cfg-set} function (if
		 * one exists) or the {@link #method-set set} method, and then finally, the return value from 
		 * {@link #cfg-set set} will be provided to {@link #afterSet}, and then set as the data on the 
		 * {@link Data.Model Model}.
		 * 
		 * Note that the default implementation simply returns the raw value unchanged, but this may be overridden
		 * in subclasses to provide a conversion.
		 * 
		 * @method beforeSet
		 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
		 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
		 * @return {Mixed} The converted value.
		 */
		beforeSet : function( model, newValue, oldValue ) {
			return newValue;
		},
		
		
		/**
		 * Indirection method that is called by a {@link Data.Model} when the {@link #method-set} method is to be called. This method provides
		 * a wrapping function that allows for `this._super( arguments )` to be called when a {@link #cfg-set} config is provided, to call the 
		 * original conversion method from a {@link #cfg-set} config function.
		 * 
		 * Basically, it allows:
		 *     var MyModel = Data.Model.extend( {
		 *         attributes: [
		 *             {
		 *                 name: 'myAttr',
		 *                 type: 'int',
		 *                 set: function( newValue, oldValue ) {
		 *                     // Preprocess the new value (if desired)
		 *                     
		 *                     newValue = this._super( [ newValue, oldValue ] );  // run original conversion provided by 'int' attribute
		 *                     
		 *                     // post process the new value (if desired)
		 *                 }
		 *             }
		 *         ]
		 *     } );
		 * 
		 * @method doSet
		 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method, after it has been processed
		 *   by the {@link #beforeSet} method..
		 * @param {Mixed} oldValue The old (previous) value that the model held.
		 */
		doSet : function( model, newValue, oldValue ) {
			if( this.hasOwnProperty( 'set' ) ) {  // a 'set' config was provided
				// Call the provided 'set' function in the scope of the model
				return this.set.call( model, newValue, oldValue );
				
			} else {
				// No 'set' config provided, just call the set() method on the prototype
				return this.set( model, newValue, oldValue );
			}
		},
		
		
		
		/**
		 * Method that allows processing of the value that is to be set to a {@link Data.Model}. This method is executed after
		 * the {@link #beforeSet} method, and before the {@link #afterSet} method, and can be overridden by the {@link #cfg-set set}
		 * config. 
		 * 
		 * @method set
		 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method, after it has been processed
		 *   by the {@link #beforeSet} method..
		 * @param {Mixed} oldValue The old (previous) value that the model held.
		 */
		set : function( model, newValue, oldValue ) {
			return newValue;
		},
		
		
		/**
		 * Method that allows post-processing for the value that is to be set to a {@link Data.Model}.
		 * This method is executed after the {@link #beforeSet} method, and the {@link #cfg-set} function (if one is provided), and is given 
		 * the value that the {@link #cfg-set} function returns. If no {@link #cfg-set} function exists, this will simply be executed 
		 * immediately after {@link #beforeSet}, after which the return from this method will be set as the data on the {@link Data.Model Model}.
		 * 
		 * Note that the default implementation simply returns the value unchanged, but this may be overridden
		 * in subclasses to provide a conversion.
		 * 
		 * @method afterSet
		 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} value The value provided to the {@link Data.Model#set} method, after it has been processed by the
		 *   {@link #beforeSet} method, and any provided {@link #cfg-set} function.
		 * @return {Mixed} The converted value.
		 */
		afterSet : function( model, value ) {
			return value;
		}
		
	} );
	
	
	return Attribute;
	
} );
