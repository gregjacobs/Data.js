/*global define */
/*jshint boss:true */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class data.persistence.writer.Writer
	 * 
	 * The purpose of a Write is to take {@link data.Model Model}/{@link data.Collection Collection} data, and convert
	 * it into the serialized form that a {@link data.persistence.proxy.Proxy Proxy} should use to store the data.
	 * For example, a {@link data.persistence.writer.Json JSON Writer} would take a {@link Data.Model Model's} data,
	 * and convert it to a JSON string, so that it may be sent to say, a backend web server.
	 * 
	 * 
	 * 
	 * 
	 * 
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
	var Writer = Class.extend( Object, {
		abstractClass : true,
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * "Writes" the data by converting the {@link Data.Model Models} to their serialized form, and returns
		 * the serialized form. 
		 * 
		 * @param { ... } ?
		 * @return {Mixed} The serialized data.
		 */
		write : function(  ) {
			var records = [];
			
			// TODO
			
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
		 * Extracts the records data from the JavaScript object produced as a result of {@link #convertRaw}.
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
					throw new Error( "Reader could not find the data at property '" + dataProperty + "'" );
				}
				// </debug>
			}
			
			return ( _.isArray( data ) ) ? data : [ data ];  // Wrap in an array if it is a single object 
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
	
	return Writer;
	
} );