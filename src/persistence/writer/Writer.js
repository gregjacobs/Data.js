/*global define */
/*jshint boss:true */
define( [
	'lodash',
	'Class',
	'data/Collection'
], function( _, Class, Collection ) {
	
	/**
	 * @abstract
	 * @class data.persistence.writer.Writer
	 * 
	 * The purpose of a Writer is to take {@link data.Model Model}/{@link data.Collection Collection} data, and convert
	 * it into the serialized form that a {@link data.persistence.proxy.Proxy Proxy} should use to store the data.
	 * For example, a {@link data.persistence.writer.Json Json Writer} would take a {@link Data.Model Model's} data,
	 * and convert it to a JSON string, so that it can be sent to a backend web server.
	 * 
	 * Each Writer subclass must implement the {@link #writeRecords} and {@link #writeRecord} methods, which are provided
	 * plain JavaScript Objects which represent the {@link data.Model Models} with the properties and values that are
	 * to be serialized. 
	 * 
	 * The overall process of the Writer is this:
	 * 
	 * 1. Take a {@link data.Model Model's} data and convert it into a plain JavaScript Object. This intermediate JavaScript
	 *    Object is referred to as a "record" at this point. This process is performed by either the {@link #processModels} 
	 *    or {@link #processModel} method, depending on if multiple Models or a single Model was provided to {@link #write}.
	 * 2. Convert each of the intermediate JavaScript Object's ("record") values into the form that the serialization expects.
	 *    For example, a JavaScript Date Object value may be converted into the string "mm/dd/yyyy hh:mm:ss" for serialization. 
	 *    This is performed by the {@link #processValue} method, which is called once for each value in the record.
	 * 3. Finally, serialize the intermediate JavaScript Object (record) into the target serialization form (json, xml, etc).
	 *    This is performed by either {@link #writeRecords} or {@link #writeRecord},depending on if multiple Models or a single
	 *    Model was provided to {@link #write}.
	 * 
	 * Writer subclasses may override certain methods such as {@link #processModels}, {@link #processModel}, or
	 * {@link #processValue} to implement functionality or transformations other than what is provided by the particular 
	 * Writer subclass in use.
	 */
	var Writer = Class.extend( Object, {
		abstractClass : true,
		
		
		// TODO: Need config that would specify to always use the "multiple" form, even when a single model
		//       is to be written (ex: a json writer should return an array, and an xml writer should return a root element 
		//       with the single model inside of it)
		
		// TODO: Need to implement "patch" updates, where only the changed attributes are written.
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Writes the output data by converting the {@link data.Model Models} to their serialized form.
		 * 
		 * @param {data.Model/data.Model[]/data.Collection} dataComponent The data component to write into serialized form.
		 *   This may either be one or more {@link data.Model}s, or a {@link data.Collection}. 
		 * @return {Mixed} The serialized data. This is usually a string, such as if converting to JSON or XML.
		 *   The serialized data will reflect the input `dataComponent`. If the input `dataComponent` is an array of 
		 *   {@link data.Model Models}, or a {@link data.Collection Collection}, then all entities will exist in the
		 *   serialized form. If a single {@link data.Model} is provided, then the serialized form will reflect just
		 *   the single entity. 
		 */
		write : function( dataComponent ) {
			var isArray = _.isArray( dataComponent );
			if( isArray || dataComponent instanceof Collection ) {  // Array of Models, or Collection
				var models = ( isArray ) ? dataComponent : dataComponent.getRange(),
				    records = this.processModels( models );
				
				return this.writeRecords( records );
				
			} else {  // Single model
				var record = this.processModel( dataComponent );
				return this.writeRecord( record );
			}
		},
		
		
		/**
		 * Abstract method which should write a list (array) of one or more {@link data.Model Models} in their
		 * processed intermediate JavaScript Object ("record") form, returning their serialized form. This method
		 * is provided the return value of the {@link #processModels} method.
		 * 
		 * @abstract
		 * @protected
		 * @param {Object[]} records The models which have been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {Mixed} The serialized form of the array of {@link data.Model Models}.
		 */
		writeRecords : Class.abstractMethod,
		
		
		/**
		 * Abstract method which should write a single {@link data.Model Model} in its processed intermediate JavaScript
		 * Object ("record") form, returning its serialized form. This method is provided the return value of the
		 * {@link #processModel} method.
		 * 
		 * @abstract
		 * @protected
		 * @param {Object} record The model which has been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {Mixed} The serialized form of the {@link data.Model Model}.
		 */
		writeRecord : Class.abstractMethod,
		
		
		
		/**
		 * Processes an array of Models, and returns a JavaScript Array of nested plain JavaScript *Objects* ("records")
		 * that represent the model data. The JavaScript Objects represent the Model's data after being processed 
		 * by {@link #processModel}. This is an intermediate form, which can then easily be converted to the target
		 * serialized form.
		 * 
		 * @protected
		 * @param {data.Model[]} models
		 * @return {Object[]} The array of "records", which are the `models` processed into plain JavaScript Objects, 
		 *   in preparation for serialization.
		 */
		processModels : function( models ) {
			return _.map( models, function( m ) { return this.processModel( m ); }, this );
		},
		
		
		/**
		 * Processes a single Model, and returns a plain JavaScript *Object* ("record") that represents the Model's data. 
		 * This JavaScript Object is an intermediate form, which can then easily be converted to the target serialized form.
		 * 
		 * @protected
		 * @param {data.Model} model
		 * @return {Object} The plain JavaScript Object ("record") representation of the `model`, which is prepared to be
		 *   serialized. Properties of this Object should hold the values that will be directly serialized. 
		 */
		processModel : function( model ) {
			var data = model.getData( { persistedOnly: true } );
			
			_.forOwn( data, function( value, key ) {
				data[ key ] = this.processValue( value, key, model );
			}, this );
			return data;
		},
		
		
		/**
		 * Processes a single attribute value of a {@link data.Model Model}, returning the value in the form of how
		 * it should be serialized. For example, a JavaScript Date object might be converted to a string
		 * that represents the full date/time value (ex: "mm/dd/yyyy hh:mm:ss").
		 * 
		 * For now, this method simply returns the `value` provided to it, but will be extended in the future to 
		 * automatically convert Date objects and possibly other types as well.
		 * 
		 * @protected
		 * @param {Mixed} value The value of the attribute.
		 * @param {String} attributeName The attribute name in the Model.
		 * @param {data.Model} model The Model being serialized.
		 * @return {Mixed} The serialization-form value of the attribute.
		 */
		processValue : function( value, attributeName, model ) {
			return value;
		}
		
	} );
	
	return Writer;
	
} );