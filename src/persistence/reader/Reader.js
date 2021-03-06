/*global define */
/*jshint boss:true */
define( [
	'lodash',
	'Class',
	'data/persistence/ResultSet'
], function( _, Class, ResultSet ) {
	
	/**
	 * @abstract
	 * @class data.persistence.reader.Reader
	 * @extends Object
	 * 
	 * The purpose of a Reader is to read raw data pulled in by a {@link data.persistence.proxy.Proxy}, and convert
	 * it into a form which can be directly consumed by a {@link data.Model Model} or {@link data.Collection Collection}.
	 * 
	 * Each Reader subclass must implement the {@link #convertRaw} method, which is provided the raw data,
	 * and is expected to return a JavaScript object with the record(s) data and any metadata that exists in 
	 * the raw data. A "record" is defined simply as a plain JavaScript object that holds the properties and 
	 * values for a {@link data.Model} model on the client-side app.
	 * 
	 * Reader subclasses may override certain methods such as {@link #processRecords} or {@link #processRecord}
	 * to apply transformations from the raw data to a form that will be consumed by a {@link data.Model Model}
	 * or {@link data.Collection Collection}.
	 */
	var Reader = Class.create( {
		abstractClass : true,
		
		
		/**
		 * @cfg {String} dataProperty
		 * 
		 * The name of the property which contains the data record(s) from the raw data. This may be a 
		 * dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "data\\.property"). 
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * Defaults to '.', meaning the record(s) data is at the root level of the data.
		 */
		dataProperty : '.',
		
		/**
		 * @cfg {String} totalProperty
		 * 
		 * The name of the property (if there is one) which holds the metadata for the total number of records 
		 * on the backing collection (such as a server-side database). This is used for loading windowed (paged) 
		 * datasets, and is only needed if not loading all of the data at once.
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "metadata\\.total"). If left as an empty string, no total count metadata will be read.
		 */
		totalProperty : '',
		
		/**
		 * @cfg {String} messageProperty
		 * 
		 * The name of the property (if there is one) which holds an optional message to be stored with the 
		 * {@link data.persistence.ResultSet ResultSet} that is returned from the {@link #read} method.
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "metadata\\.message"). If left as an empty string, no message metadata will be read. 
		 */
		messageProperty : '',
		
		/**
		 * @cfg {Object} dataMappings
		 * 
		 * An Object which maps raw data property names to the target {@link data.Model#cfg-attributes attribute} 
		 * names of the {@link data.Model} which will be populated as a result of the {@link #read}.
		 * 
		 * For example, if we have a model defined as such:
		 * 
		 *     var Person = Model.extend( {
		 *         attributes : [ 'id', 'name' ]
		 *     } );
		 * 
		 * And the raw data that comes from a server (after being transformed by {@link #convertRaw} into a plain
		 * JavaScript object) looks like this:
		 * 
		 *     {
		 *         personId   : 10,
		 *         personName : "John Smith"
		 *     }
		 * 
		 * Then we could set the `dataMappings` property to be the following, to automatically map the data to the
		 * correct target property (attribute) names:
		 * 
		 *     dataMappings : {
		 *         'personId'   : 'id',
		 *         'personName' : 'name'
		 *     }
		 * 
		 * 
		 * The key names in this map are the raw data property names, and the values are the target property 
		 * (attribute) names. Note that all raw properties do not need to be specified; only the ones you want 
		 * mapped.
		 * 
		 * 
		 * ### Mapping to Nested Objects
		 * 
		 * The key names in the map may be a dot-delimited path to a nested object in the data record. Using the above
		 * `Person` model, say we were reading raw data that looked like this:
		 * 
		 *     {
		 *         personId : 10,
		 *         personInfo : {
		 *             name : "John Smith"
		 *         }
		 *     }
		 *     
		 * The `dataMappings` config to read this raw data would then look like this:
		 * 
		 *     dataMappings : {
		 *         'personId'        : 'id',
		 *         'personInfo.name' : 'name',
		 *         
		 *         'personInfo' : ''  // if the `ignoreUnknownAttrsOnLoad` config has been set to false on the collection/model that is
		 *                            // being loaded, we can remove it manually by setting this top level key to an empty string. 
		 *                            // See "Removing Unneeded Source Properties" below.
		 *     }
		 * 
		 * 
		 * #### Escaping for Dots ('.') in the Raw Property Name
		 * 
		 * If there are properties in the raw data that have dots (periods) as part of their names, then the dots in the 
		 * mappings may be escaped with a backslash. However, in string literals in the map, this must be a double backslash
		 * to get the actual backslash character. Say we were consuming this raw data:
		 * 
		 *     {
		 *         'person.id'   : 10,
		 *         'person.name' : "John Smith"
		 *     }
		 * 
		 * Then our `dataMappings` would look like this:
		 * 
		 *     dataMappings : {
		 *         'person\\.id'   : 'id',
		 *         'person\\.name' : 'name'
		 *     }
		 * 
		 * 
		 * ### Removing Unneeded Source Properties
		 * 
		 * There is a special form for removing source data properties that are unneeded, so that they do not get 
		 * set to the target {@link data.Model} if {@link data.Model#ignoreUnknownAttrsOnLoad} has been set to false. 
		 * Setting the value in the map to an empty string will remove the particular source data property as part 
		 * of the mapping process. Ex:
		 * 
		 *     dataMappings : {
		 *         'personId'   : 'id',
		 *         'personName' : 'name',
		 *         
		 *         'lastDentalAppointmentDate' : ''  // we don't need this... remove this property from the raw data
		 *                                           // so it doesn't attempt to be set to our Person model
		 *     }
		 *     
		 *     
		 * ### More Advanced Transformations
		 * 
		 * If you need more advanced transformations than the `dataMappings` config provides, override the 
		 * {@link #processRecord} method in a subclass. See {@link #processRecord} for details. 
		 */
		
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Reads the raw data/metadata, and returns a {@link data.persistence.ResultSet} object which holds the data
		 * in JavaScript Object form, along with any of the metadata present.
		 * 
		 * @param {Mixed} rawData The raw data to transform.
		 * @return {data.persistence.ResultSet} A ResultSet object which holds the data in JavaScript object form,
		 *   and any associated metadata that was present in the `rawData`.
		 */
		read : function( rawData ) {
			var data    = this.convertRaw( rawData ),
			    records = this.extractRecords( data );
			
			records = this.processRecords( records );
			
			return new ResultSet( {
				records    : records,
				totalCount : this.extractTotalCount( data ),
				message    : this.extractMessage( data )
			} );
		},
		
		
		/**
		 * Abstract method which should be implemented to take the raw data, and convert it into
		 * a JavaScript Object.
		 * 
		 * @abstract
		 * @protected
		 * @param {Mixed} rawData
		 * @return {Object}
		 */
		convertRaw : Class.abstractMethod,
		

		/**
		 * Extracts the records' data from the JavaScript object produced as a result of {@link #convertRaw}.
		 * The default implementation uses the {@link #dataProperty} config to pull out the object which holds
		 * the record(s) data.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {Object[]} The data records. If a single record is found, it is wrapped in an array
		 *   (forming a one element array).
		 */
		extractRecords : function( data ) {
			var dataProperty = this.dataProperty;
			if( dataProperty && dataProperty !== '.' ) {
				data = this.findPropertyValue( data, dataProperty );

				// <debug>
				if( data === undefined ) {
					throw new Error( "Reader could not find the data at the property '" + dataProperty + "'" );
				}
				// </debug>
			}
			
			return ( _.isArray( data ) ) ? data : [ data ];  // Wrap in an array if it is a single object 
		},
		
		
		/**
		 * Extracts the total count metadata (if any) from the JavaScript object produced as a result of 
		 * {@link #convertRaw}. The default implementation uses the {@link #totalProperty} config to pull 
		 * out and return the totalCount value.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {Number} The total count. Returns `undefined` if no total count metadata property 
		 *   was found.
		 */
		extractTotalCount : function( data ) {
			var totalProperty = this.totalProperty;
			if( totalProperty ) {
				var totalCount = this.findPropertyValue( data, totalProperty );
				
				// <debug>
				if( totalCount === undefined ) {
					throw new Error( "Reader could not find the total count property '" + totalProperty + "' in the data." );
				}
				// </debug>
				return parseInt( totalCount, 10 );
			}
		},

		
		/**
		 * Extracts the message metadata (if any) from the JavaScript object produced as a result of 
		 * {@link #convertRaw}. The default implementation uses the {@link #messageProperty} config to pull 
		 * out and return the message.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {String} The message metadata, if any. Returns `undefined` if none was found.
		 */
		extractMessage : function( data ) {
			var messageProperty = this.messageProperty;
			if( messageProperty ) {
				var message = this.findPropertyValue( data, messageProperty );
				
				// <debug>
				if( message === undefined ) {
					throw new Error( "Reader could not find the message property '" + messageProperty + "' in the data." );
				}
				// </debug>
				return message;
			}
		},
		
		
		/**
		 * Hook method which may be overridden to process the list of records in the data.
		 * This method, by default, simply calls {@link #processRecord} with each record in
		 * the data, but may be overridden to apply transformations to the records list as
		 * a whole. If your intention is to transform each record (model) one by one, override
		 * {@link #processRecord} instead.
		 * 
		 * @protected
		 * @template
		 * @param {Object[]} records
		 * @return {Object[]} The `records` with any transformations applied.
		 */
		processRecords : function( records ) {
			for( var i = 0, len = records.length; i < len; i++ ) {
				records[ i ] = this.processRecord( records[ i ] );
			}
			return records;
		},
		
		
		/**
		 * Hook method which may be overridden to process the data of a single record.
		 * This method, by default, applies any data mappings specified in a {@link #dataMappings}
		 * config (by calling {@link #applyDataMappings}, and then returns the newly transformed record 
		 * object. If overriding this method in a subclass, call this superclass method when you want 
		 * the {@link #dataMappings} to be applied (and any other future config-driven transformations
		 * that may be implemented).
		 * 
		 * This method, by default, is called once for each record in the data. This is unless 
		 * {@link #processRecords} has been redefined in a subclass, and the records are handled 
		 * differently.
		 * 
		 * @protected
		 * @template
		 * @param {Object} recordData
		 * @return {Object} The `recordData` with any transformations applied.
		 */
		processRecord : function( recordData ) {
			return this.applyDataMappings( recordData );
		},
		
		
		// -----------------------------------
		
		
		/**
		 * Utility method which applies the {@link #dataMappings} to a given record (i.e. the plain
		 * object that holds the properties which will be later set to a {@link data.Model}.
		 * 
		 * This method is by default, executed by {@link #processRecord} (unless {@link #processRecord}
		 * is redefined in a subclass).
		 * 
		 * @protected
		 * @param {Object} recordData
		 * @return {Object} The `recordData` with the {@link #dataMappings} applied.
		 */
		applyDataMappings : function( recordData ) {
			var me = this,  // for closure
			    dataMappings = this.dataMappings;
			
			if( dataMappings ) {
				_.forOwn( dataMappings, function( targetPropName, sourcePropPath ) {
					// Copy value to target property.
					// Empty string target property can be used to simply delete the source data property (which we'll do next),
					// so don't create a new target property in this case
					if( targetPropName !== '' ) {
						recordData[ targetPropName ] = me.findPropertyValue( recordData, sourcePropPath );
					}
					
					// Delete the source property.
					// TODO: implement deleting of nested mapped properties. For now, only deletes top level source properties
					var pathKeys = me.parsePathString( sourcePropPath );
					if( pathKeys.length === 1 ) {  // a top level property
						delete recordData[ pathKeys[ 0 ] ];  // use the pathKeys array, as it will have '\.' sequences processed to '.'
					}
				} );
			}
			return recordData;
		},
		
		
		/**
		 * Utility method which searches for a (possibly nested) property in a data object.
		 * The `propertyName` parameter accepts a dot-delimited string, which accesses a property
		 * deep within the object structure. For example: a `propertyName` of 'foo.bar' will access 
		 * property 'foo' from the `obj` provided, and then the property 'bar' from 'foo'.
		 * 
		 * Dots may be escaped by a backslash (specified as a double backslash in a string literal)
		 * so that property names which have dots within them may be accessed. For example, a
		 * `propertyName` of 'foo\\.bar' will access the property "foo.bar" from the `obj` provided. 
		 * 
		 * @protected
		 * @param {Object} obj The object to search.
		 * @param {String} propertyPath A single property name, or dot-delimited path to access nested properties. 
		 *   Dots escaped with a backslash will be taken as literal dots (i.e. not as nested keys).
		 * @return {Mixed} The value at the `propertyName`. If the property is not found, returns
		 *   `undefined`.
		 */
		findPropertyValue : function( obj, propertyPath ) {
			if( !obj || !propertyPath ) return;
			
			// Walk down the nested object structure for the value
			var pathKeys = this.parsePathString( propertyPath );
			for( var i = 0, len = pathKeys.length; obj && i < len; i++ ) {
				obj = obj[ pathKeys[ i ] ];
			}
			return obj;
		},
		
		
		/**
		 * Utility method to parse a dot-delimited object path string into a list of nested keys. Dots
		 * in the string which are prefixed by a backslash are taken literally. (Note: for escaped dots,
		 * need to specify a double backslash in JS string literals.)
		 * 
		 * Ex:
		 * 
		 *     'prop' -> [ 'prop' ]
		 *     'prop.nested' -> [ 'prop', 'nested' ]
		 *     'prop.nested.deepNested' -> [ 'prop', 'nested', 'deepNested' ]
		 *     'prop\\.value' -> [ 'prop.value' ]
		 *     'prop.nested.namespace\\.value' -> [ 'prop', 'nested', 'namespace.value' ]
		 * 
		 * @protected
		 * @param {String} pathString The dot-delimited path string.
		 * @return {String[]} A list (array) of the nested keys. 
		 */
		parsePathString : function( pathString ) {
			var dotRe = /\./g,    // match all periods
			    dotMatch,
			    escapedDotRe = /\\\./g,
			    pathKeys = [],    // list where each element is a nested property key, each one level below the one before it
			    keyStartIdx = 0;  // for parsing, this is the start of the key that is currently being parsed in the loop
			
			while( dotMatch = dotRe.exec( pathString ) ) {
				var dotMatchIdx = dotMatch.index;
				
				if( pathString.charAt( dotMatchIdx - 1 ) !== "\\" ) {  // a non-escaped period was matched
					var key = pathString.substring( keyStartIdx, dotMatchIdx ).replace( escapedDotRe, '.' );  // replace any '\.' sequences with simply '.' before pushing to the array (i.e. remove the escape sequence)
					pathKeys.push( key );
					
					keyStartIdx = dotMatchIdx + 1;
				}
			}
			var lastKey = pathString.substring( keyStartIdx, pathString.length ).replace( escapedDotRe, '.' );  // replace any \. sequences with simply . before pushing to the array (i.e. remove the escape sequence)
			pathKeys.push( lastKey );  // push the last (or possibly only) key
			
			return pathKeys;
		}
		
	} );
	
	return Reader;
	
} );