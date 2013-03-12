/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/ResultSet'
], function( _, Class, ResultSet ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.reader.Reader
	 * @extends Object
	 * 
	 * The intention of a Reader is to read raw data pulled in by a {@link Data.persistence.Proxy}, and convert
	 * it into a form which can be directly consumed by a {@link Data.Model Model} or {@link Data.Collection Collection}.
	 * 
	 * Each Reader subclass must implement the {@link #convertRaw} method, which is provided the raw data,
	 * and is expected to return a JavaScript object with the record(s) data and any metadata that exists in 
	 * the raw data. A "record" is defined simply as a plain JavaScript object that holds the properties and 
	 * values for a {@link Data.Model} model on the client-side app.
	 * 
	 * Reader subclasses may override certain methods such as {@link #processRecords} or {@link #processRecord}
	 * to apply transformations from the raw data to a form that will be consumed by a {@link Data.Model Model}
	 * or {@link Data.Collection Collection}.
	 */
	var Reader = Class.extend( Object, {
		abstractClass : true,
		
		/**
		 * @cfg {String} dataProperty
		 * 
		 * The name of the property which contains the data record(s) from the raw data. This may be a 
		 * dot-delimited string to a nested property, if applicable. 
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
		 * This may be a dot-delimited string to a nested property, if applicable. If left as an empty string,
		 * no total count metadata will be read.
		 */
		totalProperty : '',
		
		/**
		 * @cfg {String} messageProperty
		 * 
		 * The name of the property (if there is one) which holds an optional message to be stored with the 
		 * {@link Data.persistence.ResultSet ResultSet} that is returned from the {@link #read} method.
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * This may be a dot-delimited string to a nested property, if applicable. If left as an empty string,
		 * no message metadata will be read. 
		 */
		messageProperty : '',
		
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Reads the raw data, and returns a {@link Data.persistence.ResultSet} object which holds the data
		 * in JavaScript object form, along with any metadata present.
		 * 
		 * @param {Mixed} rawData The raw data to transform.
		 * @return {Data.persistence.ResultSet} A ResultSet object which holds the data in JavaScript object form,
		 *   and any associated metadata that was present in the `rawData`.
		 */
		read : function( rawData ) {
			var data    = this.convertRaw( rawData ),
			    records = this.extractRecords( data );
			
			records = this.processRecords( records );
			
			return new ResultSet( {
				records    : records,
				totalCount : this.extractTotalCount( data ) || records.length,
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
			if( !dataProperty || dataProperty === '.' ) {
				return data;
			} else {
				data = this.findPropertyValue( data, dataProperty );

				// <debug>
				if( data === undefined ) {
					throw new Error( "Reader could not find the data at property '" + dataProperty + "'" );
				}
				// </debug>
				return data;
			}
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
				return totalCount;
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
		 * a whole.
		 * 
		 * @protected
		 * @template
		 * @param {Object[]} records
		 * @return {Object[]} The records with any transformations applied.
		 */
		processRecords : function( records ) {
			for( var i = 0, len = records.length; i < len; i++ ) {
				records[ i ] = this.processRecord( records[ i ] );
			}
			return records;
		},
		
		
		/**
		 * Hook method which may be overridden to process the data of a single record.
		 * This method, by default, simply returns the object (`recordData`) provided to it,
		 * but may be overridden to apply transformations to the object before returning it.
		 * 
		 * This method, by default, is called once for each record in the data. This is unless 
		 * {@link #processRecords} is overridden, and the records are handled differently.
		 * 
		 * @protected
		 * @template
		 * @param {Object} recordData
		 * @return {Object} The recordData with any transformations applied.
		 */
		processRecord : function( recordData ) {
			return recordData;
		},
		
		
		// -----------------------------------
		
		
		/**
		 * Utility method which searches for a (possibly nested) property in a data object.
		 * The `propertyName` parameter accepts a dot-delimited string, which accesses a property
		 * deep within the object structure. For example: a `propertyName` of 'foo.bar' will access 
		 * property 'foo' from the `obj` provided, and then the property 'bar' from 'foo'.
		 * 
		 * @protected
		 * @param {Object} obj The object to search.
		 * @param {String} propertyName A single property name, or dot-delimited property name
		 *   to access nested properties.
		 * @return {Mixed} The value at the `propertyName`. If the property is not found, returns
		 *   `undefined`.
		 */
		findPropertyValue : function( obj, propertyName ) {
			if( !obj || !propertyName ) return;
			
			var propertyKeys = propertyName.split( '.' );
			for( var i = 0, len = propertyKeys.length; obj && i < len; i++ ) {
				obj = obj[ propertyKeys[ i ] ];
			}
			return obj;
		}
		
	} );
	
	return Reader;
	
} );